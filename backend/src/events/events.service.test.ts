import assert = require('node:assert/strict');
import { test } from 'node:test';
import { EventsService } from './events.service';

function event(id: string, latitude: number, longitude: number, occurredAt: string) {
  return { id, category: 'EARTHQUAKE', latitude, longitude, occurredAt };
}

/** Same rows the production query returns, already ordered newest-first. */
function serviceWith(rows: any[]) {
  const prisma = {
    disasterEvent: {
      findMany: async ({ take }: { take?: number }) => rows.slice(0, take ?? rows.length),
      count: async () => rows.length,
    },
  };
  return new EventsService(prisma as any);
}

const rows = [
  event('a', -6.0, 128.8, '2026-11-15T20:51:00Z'),
  event('b', 1.79, 122.3, '2026-11-15T15:41:00Z'),
  // Near-duplicate report of `a`: same spot, 40 minutes earlier. Must not show twice.
  event('a-near', -6.05, 128.75, '2026-11-15T20:11:00Z'),
  event('c', -8.1, 120.49, '2026-11-14T21:24:00Z'),
  event('d', -5.56, 102.24, '2026-11-13T07:31:00Z'),
  event('e', 4.15, 97.49, '2026-11-10T23:05:00Z'),
  // Same area as `a` but 9 hours earlier: a separate quake, must be kept.
  event('a-earlier', -6.05, 128.75, '2026-11-15T11:51:00Z'),
];

test('a re-reported quake (same spot, within the hour) is collapsed', async () => {
  const res = await serviceWith(rows).findAll({ limit: 100 } as any);
  assert.deepEqual(res.items.map((e: any) => e.id), ['a', 'b', 'c', 'd', 'e', 'a-earlier']);
});

test('same spot hours apart is a different quake and stays', async () => {
  const res = await serviceWith(rows).findAll({ limit: 100 } as any);
  assert.ok(res.items.some((e: any) => e.id === 'a-earlier'), 'separate quake in the same area must not be dropped');
});

test('pagination never repeats a row across pages', async () => {
  const service = serviceWith(rows);
  const seen: string[] = [];
  for (let offset = 0; offset < rows.length; offset += 2) {
    const res = await service.findAll({ limit: 2, offset } as any);
    for (const item of res.items) seen.push(item.id);
  }
  assert.equal(new Set(seen).size, seen.length, `duplicate across pages: ${seen.join(',')}`);
  assert.deepEqual(seen, ['a', 'b', 'c', 'd', 'e', 'a-earlier']);
});
