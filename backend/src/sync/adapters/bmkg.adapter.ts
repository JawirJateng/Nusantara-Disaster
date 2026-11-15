import { Injectable, Optional } from '@nestjs/common';
import { Category, EventStatus, Severity, VerificationStatus } from '@prisma/client';
import { fetchJsonWithRetry, SourceHttpError } from '../http-client';
import {
  AdapterContext,
  AdapterResult,
  NormalizedEvent,
  SourceAdapter,
  round,
} from '../sync.core';

const BMKG_FEEDS = [
  'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json',
  'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json',
];

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', mei: '05', jun: '06',
  jul: '07', aug: '08', agu: '08', sep: '09', oct: '10', okt: '10', nov: '11', dec: '12', des: '12',
};

/** Parse BMKG `DateTime`, falling back to `Tanggal` + `Jam` (WIB/WITA/WIT) as UTC. */
export function parseBmkgDate(g: any): Date | null {
  if (g?.DateTime) {
    const direct = new Date(g.DateTime);
    if (!isNaN(direct.getTime())) return direct;
  }
  if (g?.Tanggal && g?.Jam) {
    const jam = String(g.Jam);
    const offsetHours = /WITA/.test(jam) ? 8 : /WIT/.test(jam) ? 9 : 7;
    const cleanJam = jam.replace(/WIB|WITA|WIT/g, '').trim();
    const parts = String(g.Tanggal).trim().split(/\s+/);
    if (parts.length === 3) {
      const month = MONTHS[parts[1].substring(0, 3).toLowerCase()] || MONTHS[parts[1].toLowerCase()];
      if (month) {
        const iso = `${parts[2]}-${month}-${parts[0].padStart(2, '0')}T${cleanJam}+${String(offsetHours).padStart(2, '0')}:00`;
        const parsed = new Date(iso);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
  }
  return null;
}

export function parseBmkgCoordinates(g: any): { latitude: number; longitude: number } | null {
  const parts = String(g?.Coordinates || '').split(',');
  if (parts.length !== 2) return null;
  const latitude = Number.parseFloat(parts[0]);
  const longitude = Number.parseFloat(parts[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

/**
 * Stable identity: origin time truncated to the minute + coordinates (1 decimal).
 * Magnitude is deliberately excluded because BMKG revises it; including it would
 * create a second record for the same earthquake.
 */
export function bmkgExternalId(occurredAt: Date, latitude: number, longitude: number): string {
  const timeKey = occurredAt.toISOString().slice(0, 16);
  return `BMKG-${timeKey}-${round(latitude, 1).toFixed(1)}-${round(longitude, 1).toFixed(1)}`;
}

/** Legacy ID used before the sync engine rewrite (`...-<magnitude>-<lat>-<lng>`). Used only to adopt old rows. */
export function legacyBmkgExternalId(occurredAt: Date, latitude: number, longitude: number, magnitude: number): string {
  const timeKey = occurredAt.toISOString().slice(0, 16);
  return `BMKG-${timeKey}-${magnitude.toFixed(1)}-${round(latitude, 1).toFixed(1)}-${round(longitude, 1).toFixed(1)}`;
}

export function severityForMagnitude(magnitude: number): Severity {
  if (magnitude >= 6.0) return Severity.CRITICAL;
  if (magnitude >= 5.0) return Severity.HIGH;
  return Severity.MODERATE;
}

const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Bengkulu',
  'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Lampung', 'Banten', 'DKI Jakarta', 'Jakarta',
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Yogyakarta', 'Jawa Timur', 'Bali',
  'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah',
  'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Gorontalo',
  'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Maluku',
  'Maluku Utara', 'Papua Barat Daya', 'Papua Barat', 'Papua Selatan', 'Papua Tengah',
  'Papua Pegunungan', 'Papua',
].sort((a, b) => b.length - a.length);

const PROVINCE_PATTERNS = PROVINCES.map((name) => ({ name, pattern: new RegExp(`\\b${name.toLowerCase()}\\b`) }));

/**
 * BMKG `Wilayah` is free text ("Pusat gempa berada di laut 24 km selatan Enggano").
 * Only return a value when a real province name appears, never the whole sentence.
 */
export function provinceFromRegion(region: string): string | null {
  const text = region.toLowerCase();
  const match = PROVINCE_PATTERNS.find(({ pattern }) => pattern.test(text))?.name;
  if (!match) return null;
  if (match === 'Jakarta') return 'DKI Jakarta';
  if (match === 'Yogyakarta') return 'DI Yogyakarta';
  return match;
}

function numberFromConfig(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

@Injectable()
export class BmkgAdapter implements SourceAdapter {
  readonly code = 'BMKG';

  constructor(@Optional() private readonly fetchImpl: typeof fetch = fetch) {}

  async fetch(context: AdapterContext): Promise<AdapterResult> {
    const minMagnitude = numberFromConfig(context.config.minMagnitude, 4.0);
    const options = {
      timeoutMs: context.timeoutMs,
      maxRetries: context.maxRetries,
    };

    const results = await Promise.allSettled(
      BMKG_FEEDS.map((url) => fetchJsonWithRetry(url, options, this.fetchImpl)),
    );

    const fulfilled = results.filter((r): r is PromiseFulfilledResult<{ data: any; retryCount: number }> => r.status === 'fulfilled');
    if (fulfilled.length === 0) {
      const errors = results.map((r) => (r as PromiseRejectedResult).reason);
      const rateLimited = errors.find((e) => e instanceof SourceHttpError && e.kind === 'rate_limit');
      const error = rateLimited || errors[0];
      throw error instanceof SourceHttpError
        ? error
        : new SourceHttpError(`BMKG feed failed: ${String(error?.message || error).slice(0, 200)}`, 'transient');
    }

    const warnings: string[] = [];
    let retryCount = 0;
    let rateLimitCount = 0;
    for (const result of fulfilled) retryCount += result.value.retryCount;
    for (const rejected of results) {
      if (rejected.status !== 'fulfilled') {
        const reason = rejected.reason;
        if (reason instanceof SourceHttpError) {
          warnings.push(`${reason.kind}: ${reason.message}`);
          if (reason.kind === 'rate_limit') rateLimitCount++;
        } else {
          warnings.push(`transient: ${String(reason?.message || reason).slice(0, 200)}`);
        }
      }
    }

    const rawItems: any[] = [];
    for (const result of fulfilled) {
      const items = result.value.data?.Infogempa?.gempa;
      if (Array.isArray(items)) rawItems.push(...items);
    }

    const rejected: { reason: string; ref?: string }[] = [];
    const merged = new Map<string, { raw: any; occurredAt: Date; latitude: number; longitude: number; magnitude: number }>();

    for (const raw of rawItems) {
      const occurredAt = parseBmkgDate(raw);
      const coordinates = parseBmkgCoordinates(raw);
      const magnitude = Number.parseFloat(raw?.Magnitude);
      const ref = raw?.DateTime || [raw?.Tanggal, raw?.Jam].filter(Boolean).join(' ');

      if (!occurredAt) {
        rejected.push({ reason: 'invalid event time', ref });
        continue;
      }
      if (!coordinates) {
        rejected.push({ reason: 'invalid coordinates', ref });
        continue;
      }
      if (!Number.isFinite(magnitude)) {
        rejected.push({ reason: 'invalid magnitude', ref });
        continue;
      }
      if (magnitude < minMagnitude) continue; // source policy filter, not a data error

      const externalId = bmkgExternalId(occurredAt, coordinates.latitude, coordinates.longitude);
      const existing = merged.get(externalId);
      if (!existing) {
        merged.set(externalId, { raw: { ...raw }, occurredAt, ...coordinates, magnitude });
        continue;
      }
      // Same quake in both feeds: keep the richer field values.
      if (raw.Dirasakan && String(raw.Dirasakan).length > String(existing.raw.Dirasakan || '').length) {
        existing.raw.Dirasakan = raw.Dirasakan;
      }
      if (raw.Wilayah && String(raw.Wilayah).length > String(existing.raw.Wilayah || '').length) {
        existing.raw.Wilayah = raw.Wilayah;
      }
      if (raw.Kedalaman && !existing.raw.Kedalaman) existing.raw.Kedalaman = raw.Kedalaman;
      if (raw.Potensi && !existing.raw.Potensi) existing.raw.Potensi = raw.Potensi;
    }

    const records = Array.from(merged.values()).map((item) => this.normalize(item));

    return {
      records,
      fetched: rawItems.length,
      rejected,
      warnings,
      retryCount,
      rateLimitCount,
    };
  }

  private normalize(item: { raw: any; occurredAt: Date; latitude: number; longitude: number; magnitude: number }): NormalizedEvent {
    const { raw, occurredAt, latitude, longitude, magnitude } = item;
    const region = raw.Wilayah ? String(raw.Wilayah).trim() : 'Indonesia';
    const depthKm = Number.parseFloat(String(raw.Kedalaman || '').replace(/[^\d.]/g, ''));
    const felt = raw.Dirasakan || null;
    const potential = raw.Potensi || null;

    return {
      externalId: bmkgExternalId(occurredAt, latitude, longitude),
      category: Category.EARTHQUAKE,
      title: `Gempa Bumi M${magnitude.toFixed(1)} - ${region}`,
      description: `Gempa bumi magnitudo ${magnitude.toFixed(1)}, kedalaman ${raw.Kedalaman || 'tidak diketahui'}, wilayah ${region}. Potensi: ${potential || 'N/A'}. Dirasakan: ${felt || 'Tidak ada info'}.`,
      severity: severityForMagnitude(magnitude),
      status: EventStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
      province: provinceFromRegion(region),
      locationName: region,
      latitude,
      longitude,
      occurredAt,
      metadata: {
        magnitude,
        depthKm: Number.isFinite(depthKm) ? depthKm : null,
        depth: raw.Kedalaman || null,
        potential,
        felt,
        coordinates: raw.Coordinates || null,
      },
      rawPayload: raw,
    };
  }
}
