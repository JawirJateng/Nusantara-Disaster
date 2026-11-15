import { test } from 'node:test';
import assert = require('node:assert/strict');
import { Category, Severity } from '@prisma/client';
import {
  NormalizedEvent,
  backoffDelayMs,
  buildContentHash,
  buildIdentityFingerprint,
  buildPatch,
  parseRetryAfterMs,
  round,
  stableStringify,
  validateEvent,
} from './sync.core';
import { bmkgExternalId, legacyBmkgExternalId, parseBmkgCoordinates, parseBmkgDate, provinceFromRegion } from './adapters/bmkg.adapter';

function event(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    externalId: 'EXT-1',
    category: Category.EARTHQUAKE,
    title: 'Gempa M5.0 Test',
    description: 'keterangan',
    severity: Severity.MODERATE,
    province: 'Jawa Barat',
    regency: 'Cianjur',
    locationName: 'Cianjur',
    latitude: -6.81234,
    longitude: 107.12345,
    occurredAt: new Date('2026-01-02T03:04:00.000Z'),
    metadata: { magnitude: 5.0 },
    ...overrides,
  };
}

test('stableStringify ignores object key order', () => {
  assert.equal(stableStringify({ b: 1, a: 2 }), stableStringify({ a: 2, b: 1 }));
});

test('identity fingerprint is stable and source-scoped', () => {
  const first = buildIdentityFingerprint('BMKG', event());
  const second = buildIdentityFingerprint('BMKG', event({ title: 'judul berubah' }));
  const otherSource = buildIdentityFingerprint('BNPB', event());

  assert.equal(first, second, 'title must not change identity');
  assert.notEqual(first, otherSource, 'same attributes from another source are a different identity');
});

test('content hash detects meaningful changes only', () => {
  const base = buildContentHash(event());
  assert.equal(base, buildContentHash(event()), 'identical content must hash the same');
  assert.notEqual(base, buildContentHash(event({ title: 'judul baru' })));

  const withTransportNoise = {
    ...event(),
    rawPayload: { fetchedAt: new Date().toISOString(), requestId: 'abc' },
    lastSeenAt: new Date(),
  };
  assert.equal(base, buildContentHash(withTransportNoise), 'volatile fields must not affect the hash');
});

test('validation rejects unsafe records', () => {
  assert.equal(validateEvent(event()), null);
  assert.equal(validateEvent(null), 'empty record');
  assert.equal(validateEvent(event({ title: '  ' })), 'missing title');
  assert.equal(validateEvent(event({ latitude: 200 })), 'invalid latitude');
  assert.equal(validateEvent(event({ longitude: -181 })), 'invalid longitude');
  assert.equal(validateEvent(event({ occurredAt: new Date('nope') })), 'invalid occurredAt');
  assert.equal(
    validateEvent(event({ occurredAt: new Date(Date.now() + 2 * 60 * 60 * 1000) })),
    'occurredAt in the future',
  );
});

test('partial payload never nulls stored fields', () => {
  const patch = buildPatch(event({ description: undefined, regency: undefined, province: null }));
  assert.equal('description' in patch, false);
  assert.equal('regency' in patch, false);
  assert.equal('province' in patch, false);
  assert.equal(patch.title, 'Gempa M5.0 Test');
});

test('BMKG date parsing respects WIB, WITA and WIT', () => {
  const wib = parseBmkgDate({ Tanggal: '02 Jan 2026', Jam: '10:04:00 WIB' });
  const wita = parseBmkgDate({ Tanggal: '02 Jan 2026', Jam: '10:04:00 WITA' });
  const wit = parseBmkgDate({ Tanggal: '02 Jan 2026', Jam: '10:04:00 WIT' });

  assert.equal(wib.toISOString(), '2026-01-02T03:04:00.000Z');
  assert.equal(wita.toISOString(), '2026-01-02T02:04:00.000Z');
  assert.equal(wit.toISOString(), '2026-01-02T01:04:00.000Z');
  assert.equal(parseBmkgDate({ Tanggal: '02 Jan 2026' }), null);
});

test('BMKG identity survives a magnitude revision', () => {
  const occurredAt = new Date('2026-01-02T03:04:00.000Z');
  const current = bmkgExternalId(occurredAt, -6.81234, 107.12345);
  const revised = bmkgExternalId(occurredAt, -6.81234, 107.12345);

  assert.equal(current, revised);
  assert.notEqual(current, legacyBmkgExternalId(occurredAt, -6.81234, 107.12345, 5.0));
  assert.equal(bmkgExternalId(occurredAt, -6.849, 107.111), current, 'coordinates round to 1 decimal');
});

test('BMKG coordinates parser rejects malformed input', () => {
  assert.deepEqual(parseBmkgCoordinates({ Coordinates: '-6.81,107.12' }), { latitude: -6.81, longitude: 107.12 });
  assert.equal(parseBmkgCoordinates({ Coordinates: 'laut' }), null);
  assert.equal(parseBmkgCoordinates({ Coordinates: '1,2,3' }), null);
});

test('BMKG region resolves a province only when one is present', () => {
  assert.equal(provinceFromRegion('Pusat gempa berada di laut 24 km selatan Enggano, Bengkulu'), 'Bengkulu');
  assert.equal(provinceFromRegion('24 km Selatan Enggano'), null, 'free-text sentence must not become a province');
  assert.equal(provinceFromRegion('Pusat gempa berada di darat 8 km Barat Daya Kab. Cianjur, Jawa Barat'), 'Jawa Barat');
  assert.equal(provinceFromRegion('Papua Barat Daya'), 'Papua Barat Daya', 'longest province name wins');
  assert.equal(provinceFromRegion('Kota Jakarta Selatan'), 'DKI Jakarta');
  assert.equal(provinceFromRegion('Balikpapan'), null, 'must not match a province inside another word');
});

test('Retry-After parses seconds and HTTP dates', () => {
  assert.equal(parseRetryAfterMs('2'), 2000);
  assert.equal(parseRetryAfterMs('0'), 0);
  assert.equal(parseRetryAfterMs(null), undefined);
  assert.equal(parseRetryAfterMs('bukan-angka'), undefined);

  const future = new Date(Date.now() + 5000).toUTCString();
  const parsed = parseRetryAfterMs(future);
  assert.ok(parsed !== undefined && parsed > 3000 && parsed <= 5000);
});

test('backoff grows, stays bounded and jitters', () => {
  const first = backoffDelayMs(1);
  assert.ok(first >= 15_000 && first <= 30_000);
  assert.ok(backoffDelayMs(99) <= 30 * 60_000);
  assert.equal(round(1.23456, 4), 1.2346);
});
