import { createHash } from 'crypto';
import { Category, EventStatus, Severity, VerificationStatus } from '@prisma/client';

/** A record after validation + normalization, before persistence. Optional fields may be absent in partial payloads. */
export interface NormalizedEvent {
  externalId?: string | null;
  category: Category;
  title: string;
  description?: string | null;
  severity?: Severity;
  status?: EventStatus;
  verificationStatus?: VerificationStatus;
  province?: string | null;
  regency?: string | null;
  locationName?: string | null;
  latitude: number;
  longitude: number;
  occurredAt: Date;
  sourceUpdatedAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  rawPayload?: unknown;
}

export const SOURCE_ADAPTERS = 'SOURCE_ADAPTERS';

export interface AdapterContext {
  config: Record<string, any>;
  timeoutMs: number;
  maxRetries: number;
}

export interface AdapterResult {
  records: NormalizedEvent[];
  /** Number of raw records returned by the provider, before filtering/validation. */
  fetched: number;
  rejected: { reason: string; ref?: string }[];
  /** Records whose identity cannot be established with confidence. Never merged or deleted automatically. */
  review?: { reason: string; ref?: string }[];
  warnings?: string[];
  retryCount?: number;
  rateLimitCount?: number;
}

export interface SourceAdapter {
  readonly code: string;
  fetch(context: AdapterContext): Promise<AdapterResult>;
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** JSON with sorted object keys so equal data always hashes the same. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.keys(value as Record<string, unknown>)
    .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);
  return `{${entries.join(',')}}`;
}

/** Identity for providers without a stable external ID. Volatile data (fetch time, request metadata) is excluded. */
export function buildIdentityFingerprint(sourceCode: string, event: NormalizedEvent): string {
  return sha256(
    stableStringify({
      source: sourceCode,
      category: event.category,
      occurredAt: event.occurredAt.toISOString(),
      latitude: round(event.latitude, 4),
      longitude: round(event.longitude, 4),
    }),
  );
}

const CONTENT_FIELDS = [
  'category',
  'title',
  'description',
  'severity',
  'status',
  'verificationStatus',
  'province',
  'regency',
  'locationName',
  'latitude',
  'longitude',
  'occurredAt',
  'metadata',
] as const;

/** Hash of the meaningful event fields only. `rawPayload`, `fetchedAt`, `lastSeenAt` etc. never affect it. */
export function buildContentHash(event: Record<string, any>): string {
  const content: Record<string, unknown> = {};
  for (const field of CONTENT_FIELDS) {
    const value = event[field];
    if (field === 'latitude' || field === 'longitude') content[field] = round(Number(value), 6);
    else if (field === 'occurredAt') content[field] = value ? new Date(value).toISOString() : null;
    else if (field === 'metadata') content[field] = value ?? null;
    else content[field] = value ?? null;
  }
  return sha256(stableStringify(content));
}

/** Merge metadata without letting null/undefined overwrite an existing value. */
export function mergeMetadata(
  existing: unknown,
  incoming: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  const base = existing && typeof existing === 'object' && !Array.isArray(existing)
    ? { ...(existing as Record<string, unknown>) }
    : {};
  for (const [key, value] of Object.entries(incoming ?? {})) {
    if (value !== null && value !== undefined) base[key] = value;
  }
  return Object.keys(base).length ? base : null;
}

export function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

const CATEGORIES = Object.values(Category);

/** Returns a rejection reason, or null when the record is safe to persist. */
export function validateEvent(event: NormalizedEvent | null | undefined): string | null {
  if (!event) return 'empty record';
  if (!CATEGORIES.includes(event.category)) return 'invalid category';
  if (typeof event.title !== 'string' || !event.title.trim()) return 'missing title';
  if (!(event.occurredAt instanceof Date) || isNaN(event.occurredAt.getTime())) return 'invalid occurredAt';
  if (event.occurredAt.getTime() > Date.now() + 60 * 60 * 1000) return 'occurredAt in the future';
  if (!Number.isFinite(event.latitude) || event.latitude < -90 || event.latitude > 90) return 'invalid latitude';
  if (!Number.isFinite(event.longitude) || event.longitude < -180 || event.longitude > 180) return 'invalid longitude';
  return null;
}

/**
 * Fields that may be written. Only values actually supplied by the provider are returned,
 * so a partial payload can never null out valid stored data.
 */
export function buildPatch(event: NormalizedEvent): Record<string, any> {
  const patch: Record<string, any> = { category: event.category, occurredAt: event.occurredAt };
  const optional: (keyof NormalizedEvent)[] = [
    'title',
    'description',
    'severity',
    'status',
    'verificationStatus',
    'province',
    'regency',
    'locationName',
    'latitude',
    'longitude',
    'sourceUpdatedAt',
    'rawPayload',
  ];
  for (const field of optional) {
    const value = event[field];
    if (value !== undefined && value !== null) patch[field] = value;
  }
  if (event.metadata !== undefined) patch.metadata = event.metadata;
  return patch;
}

/** Exponential backoff with jitter, bounded. */
export function backoffDelayMs(failureCount: number, baseMs = 30_000, capMs = 30 * 60_000): number {
  const exponent = Math.min(Math.max(failureCount, 1) - 1, 8);
  const ceiling = Math.min(capMs, baseMs * 2 ** exponent);
  return Math.round(ceiling / 2 + Math.random() * (ceiling / 2));
}

export function parseRetryAfterMs(header: string | null | undefined): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds * 1000));
  const date = Date.parse(header);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}
