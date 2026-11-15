import { after, before, beforeEach, test } from 'node:test';
import assert = require('node:assert/strict');
import { Category, PrismaClient, Severity, SyncHealth } from '@prisma/client';
import { SyncService } from './sync.service';
import { AdapterResult, NormalizedEvent, SourceAdapter } from './sync.core';

const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
const databaseName = url.split('/').pop()?.split('?')[0] ?? '';
if (!/test/i.test(databaseName)) {
  throw new Error(`Refusing to run integration tests against non-test database "${databaseName}"`);
}
process.env.DATABASE_URL = url;

const prisma = new PrismaClient();

class FakeAdapter implements SourceAdapter {
  readonly code: string;
  queue: (AdapterResult | Error)[] = [];
  lastResult: AdapterResult = { records: [], fetched: 0, rejected: [] };

  constructor(code: string) {
    this.code = code;
  }

  async fetch(): Promise<AdapterResult> {
    const next = this.queue.shift();
    if (next instanceof Error) throw next;
    return next ?? { records: [], fetched: 0, rejected: [] };
  }
}

let sequence = 0;

function event(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    externalId: `EXT-${sequence}`,
    category: Category.EARTHQUAKE,
    title: 'Gempa M5.0 Test',
    description: 'keterangan',
    severity: Severity.MODERATE,
    province: 'Jawa Barat',
    locationName: 'Cianjur',
    latitude: -6.81234,
    longitude: 107.12345,
    occurredAt: new Date('2026-01-02T03:04:00.000Z'),
    metadata: { magnitude: 5.0 },
    ...overrides,
  };
}

function result(records: NormalizedEvent[], extra: Partial<AdapterResult> = {}): AdapterResult {
  return { records, fetched: records.length, rejected: [], ...extra };
}

async function makeSource(code: string) {
  return prisma.dataSource.create({
    data: { name: `Test ${code}`, code, isEnabled: true, pollIntervalMinutes: 1 },
  });
}

async function makeEngine(code: string) {
  const source = await makeSource(code);
  const adapter = new FakeAdapter(code);
  const engine = new SyncService(prisma as any, [adapter]);
  return { source, adapter, engine };
}

async function rows(sourceId: string) {
  return prisma.disasterEvent.findMany({ where: { sourceId }, orderBy: { createdAt: 'asc' } });
}

before(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.disasterEvent.deleteMany({ where: { source: { is: { code: { startsWith: 'TEST_' } } } } });
  await prisma.syncLog.deleteMany({ where: { dataSource: { is: { code: { startsWith: 'TEST_' } } } } });
  await prisma.syncCheckpoint.deleteMany({ where: { dataSource: { is: { code: { startsWith: 'TEST_' } } } } });
  await prisma.dataSource.deleteMany({ where: { code: { startsWith: 'TEST_' } } });
});

after(async () => {
  await prisma.disasterEvent.deleteMany({ where: { source: { is: { code: { startsWith: 'TEST_' } } } } });
  await prisma.dataSource.deleteMany({ where: { code: { startsWith: 'TEST_' } } });
  await prisma.$disconnect();
});

test('a new record is inserted exactly once', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_INSERT');
  adapter.queue.push(result([event()]));

  const run = await engine.syncSource(source.id);

  assert.equal(run.status, 'SUCCESS');
  assert.equal(run.inserted, 1);
  assert.equal((await rows(source.id)).length, 1);
});

test('an identical payload on the next poll is skipped without touching updatedAt', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_SKIP');
  const payload = event();
  adapter.queue.push(result([payload]));
  await engine.syncSource(source.id);
  const first = (await rows(source.id))[0];

  adapter.queue.push(result([{ ...payload }]));
  const second = await engine.syncSource(source.id);
  const after = (await rows(source.id))[0];

  assert.equal(second.skipped, 1);
  assert.equal(second.updated, 0);
  assert.equal(after.updatedAt.getTime(), first.updatedAt.getTime(), 'polling must not bump updatedAt');
});

test('a meaningful change updates the record', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_UPDATE');
  const payload = event();
  adapter.queue.push(result([payload]));
  await engine.syncSource(source.id);

  adapter.queue.push(result([{ ...payload, title: 'Gempa M5.2 Revisi' }]));
  const run = await engine.syncSource(source.id);

  assert.equal(run.updated, 1);
  assert.equal((await rows(source.id))[0].title, 'Gempa M5.2 Revisi');
});

test('a change in transport metadata alone does not update the event', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_TRANSPORT');
  const payload = event();
  adapter.queue.push(result([payload]));
  await engine.syncSource(source.id);

  adapter.queue.push(result([{ ...payload, rawPayload: { fetchedAt: new Date().toISOString() } }]));
  const run = await engine.syncSource(source.id);

  assert.equal(run.skipped, 1);
  assert.equal(run.updated, 0);
});

test('concurrent runs on the same source never duplicate a record', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_CONCURRENT');
  adapter.queue.push(result([event()]));
  adapter.queue.push(result([event()]));

  const results = await Promise.all([engine.syncSource(source.id), engine.syncSource(source.id)]);

  assert.equal((await rows(source.id)).length, 1);
  assert.ok(results.some((r) => r.status === 'LOCKED' || r.status === 'SUCCESS'));
});

test('the same external ID from two sources stays two records', async () => {
  const first = await makeEngine('TEST_SRC_A');
  const second = await makeEngine('TEST_SRC_B');
  const shared = event({ externalId: 'SHARED-1' });
  first.adapter.queue.push(result([shared]));
  second.adapter.queue.push(result([shared]));

  await first.engine.syncSource(first.source.id);
  await second.engine.syncSource(second.source.id);

  assert.equal(await prisma.disasterEvent.count({ where: { externalId: 'SHARED-1' } }), 2);
});

test('records without an external ID use the fingerprint consistently', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_FINGERPRINT');
  const payload = event({ externalId: null });

  adapter.queue.push(result([payload]));
  await engine.syncSource(source.id);
  adapter.queue.push(result([{ ...payload }]));
  const second = await engine.syncSource(source.id);

  const stored = await rows(source.id);
  assert.equal(stored.length, 1);
  assert.ok(stored[0].identityFingerprint, 'fingerprint must be persisted');
  assert.equal(second.skipped, 1);
});

test('an invalid record is rejected without failing the batch', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_REJECT');
  adapter.queue.push(result([event({ latitude: 400 }), event()]));

  const run = await engine.syncSource(source.id);

  assert.equal(run.rejected, 1);
  assert.equal(run.inserted, 1);
  assert.equal((await rows(source.id)).length, 1);
});

test('a failed batch leaves the checkpoint and stored data untouched', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_FAILURE');
  adapter.queue.push(new Error('provider down'));

  const run = await engine.syncSource(source.id);
  const checkpoint = await prisma.syncCheckpoint.findUnique({ where: { dataSourceId: source.id } });

  assert.equal(run.status, 'FAILED');
  assert.equal(checkpoint.status, SyncHealth.FAILED);
  assert.equal(checkpoint.lastSuccessfulSyncAt, null);
  assert.equal(checkpoint.consecutiveFailures, 1);
  assert.equal((await rows(source.id)).length, 0);
});

test('events missing from a later response are not deleted', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_NO_DELETE');
  adapter.queue.push(result([event()]));
  await engine.syncSource(source.id);

  adapter.queue.push(result([]));
  await engine.syncSource(source.id);

  assert.equal((await rows(source.id)).length, 1);
});

test('a partial payload does not null out existing fields', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_PARTIAL');
  const payload = event();
  adapter.queue.push(result([payload]));
  await engine.syncSource(source.id);

  const { description, regency, ...partial } = payload;
  adapter.queue.push(result([{ ...partial, title: 'Judul baru' }]));
  await engine.syncSource(source.id);

  const stored = (await rows(source.id))[0];
  assert.equal(stored.title, 'Judul baru');
  assert.equal(stored.description, 'keterangan');
});

test('one failing source does not stop the others', async () => {
  const broken = await makeEngine('TEST_BROKEN');
  const healthy = await makeEngine('TEST_HEALTHY');
  broken.adapter.queue.push(new Error('provider down'));
  healthy.adapter.queue.push(result([event()]));

  const engine = new SyncService(prisma as any, [broken.adapter, healthy.adapter]);
  const results = await engine.syncAll({ force: true });

  assert.ok(results.some((r) => r.status === 'FAILED'));
  assert.ok(results.some((r) => r.status === 'SUCCESS'));
  assert.equal((await rows(healthy.source.id)).length, 1);
});

test('repeated runs keep the database consistent', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_IDEMPOTENT');
  const payload = event();
  adapter.queue.push(result([payload]), result([payload]), result([payload]));

  await engine.syncSource(source.id);
  const first = await rows(source.id);
  await engine.syncSource(source.id);
  await engine.syncSource(source.id);
  const last = await rows(source.id);

  assert.equal(first.length, 1);
  assert.equal(last.length, 1);
  assert.equal(last[0].contentHash, first[0].contentHash);
  assert.equal(last[0].updatedAt.getTime(), first[0].updatedAt.getTime());
});

test('sync logs record fetched, valid and skipped counters', async () => {
  const { source, adapter, engine } = await makeEngine('TEST_LOG');
  adapter.queue.push(result([event()], { fetched: 3, rejected: [{ reason: 'invalid coordinates' }] }));
  await engine.syncSource(source.id);

  const log = await prisma.syncLog.findFirst({ where: { dataSourceId: source.id }, orderBy: { createdAt: 'desc' } });
  assert.equal(log.eventsFetched, 3);
  assert.equal(log.eventsProcessed, 1);
  assert.equal(log.eventsValid, 1);
  assert.equal(log.eventsRejected, 1);
  assert.ok(log.startedAt <= log.finishedAt);
});
