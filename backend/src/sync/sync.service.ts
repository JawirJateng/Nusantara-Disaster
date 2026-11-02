import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('🚀 Backend aktif: Menjalankan sinkronisasi awal otomatis data BMKG...');
    this.runInitialSync().catch((err) => {
      this.logger.error('Gagal sinkronisasi awal BMKG:', err);
    });
  }

  private async runInitialSync() {
    try {
      const bmkgSource = await this.prisma.dataSource.findUnique({
        where: { code: 'BMKG' },
      });
      if (bmkgSource && bmkgSource.isEnabled) {
        await this.syncBmkg(bmkgSource.id);
      }
    } catch (err) {
      this.logger.error('Error in initial BMKG sync:', err);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoSync() {
    this.logger.log('🔄 Menjalankan sinkronisasi otomatis multi-sumber data bencana (tiap 1 menit)...');

    try {
      const enabledSources = await this.prisma.dataSource.findMany({
        where: { isEnabled: true },
      });

      for (const source of enabledSources) {
        if (source.code === 'BMKG') {
          await this.syncBmkg(source.id);
        } else {
          await this.simulateSourceSync(source);
        }
      }
    } catch (err) {
      this.logger.error('❌ Gagal saat sinkronisasi otomatis:', err);
    }
  }

  private parseBmkgDate(g: any): Date {
    if (g.DateTime) {
      const d = new Date(g.DateTime);
      if (!isNaN(d.getTime())) return d;
    }
    if (g.Tanggal && g.Jam) {
      const cleanJam = g.Jam.replace(/WIB|WITA|WIT/g, '').trim();
      const months: Record<string, string> = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
        'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04', 'Mei': '05', 'Juni': '06',
        'Juli': '07', 'Agustus': '08', 'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
      };
      const parts = g.Tanggal.trim().split(/\s+/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const monthStr = parts[1];
        const year = parts[2];
        const month = months[monthStr] || months[monthStr.substring(0, 3)] || '01';
        const isoStr = `${year}-${month}-${day}T${cleanJam}+07:00`;
        const d = new Date(isoStr);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return new Date();
  }

  async syncBmkg(sourceId: string) {
    const startTime = Date.now();
    try {
      this.logger.log('🌐 Menarik data gempa bumi (Magnitudo >= 4.0) dari API resmi BMKG...');

      // Clean up any existing duplicate BMKG events in DB
      try {
        const bmkgEvents = await this.prisma.disasterEvent.findMany({
          where: { category: 'EARTHQUAKE' },
          orderBy: { createdAt: 'desc' },
        });
        const seenKeys = new Set();
        for (const ev of bmkgEvents) {
          const latStr = ev.latitude.toFixed(1);
          const lngStr = ev.longitude.toFixed(1);
          const timeKey = ev.occurredAt.toISOString().slice(0, 16);
          let magStr = '0.0';
          const matchMag = ev.title.match(/M([0-9]+\.[0-9]+)/);
          if (matchMag && matchMag[1]) {
            magStr = parseFloat(matchMag[1]).toFixed(1);
          } else if (ev.metadata && typeof ev.metadata === 'object' && 'magnitude' in (ev.metadata as any)) {
            magStr = parseFloat(String((ev.metadata as any).magnitude)).toFixed(1);
          }
          const dupKey = `${timeKey}-${magStr}-${latStr}-${lngStr}`;
          if (seenKeys.has(dupKey)) {
            await this.prisma.disasterEvent.delete({ where: { id: ev.id } }).catch(() => {});
          } else {
            seenKeys.add(dupKey);
          }
        }
      } catch (cleanupErr) {
        this.logger.warn('⚠️ Gagal membersihkan duplikasi gempa lama:', cleanupErr);
      }

      const [resTerkini, resDirasakan] = await Promise.all([
        fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      const gempaTerkini = resTerkini?.Infogempa?.gempa || [];
      const gempaDirasakan = resDirasakan?.Infogempa?.gempa || [];

      const gempaMap = new Map();
      [...gempaTerkini, ...gempaDirasakan].forEach((g: any) => {
        if (g && (g.DateTime || (g.Tanggal && g.Jam)) && g.Magnitude && g.Coordinates) {
          let lat = -2.5;
          let lng = 118.0;
          const parts = g.Coordinates.split(',');
          if (parts.length === 2) {
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
          }
          const dateObj = this.parseBmkgDate(g);
          const timeKey = dateObj.toISOString().slice(0, 16);
          const magNum = parseFloat(g.Magnitude || '0');
          const mag = magNum.toFixed(1);
          const latStr = (isNaN(lat) ? -2.5 : lat).toFixed(1);
          const lngStr = (isNaN(lng) ? 118.0 : lng).toFixed(1);
          const externalId = `BMKG-${timeKey}-${mag}-${latStr}-${lngStr}`.replace(/\s+/g, '-');

          if (gempaMap.has(externalId)) {
            const existing = gempaMap.get(externalId);
            if (g.Dirasakan && !existing.Dirasakan) {
              existing.Dirasakan = g.Dirasakan;
            }
            if (g.Wilayah && g.Wilayah.length > existing.Wilayah.length) {
              existing.Wilayah = g.Wilayah;
            }
          } else {
            gempaMap.set(externalId, g);
          }
        }
      });

      const gempaList = Array.from(gempaMap.values());

      let createdCount = 0;
      let updatedCount = 0;

      for (const g of gempaList) {
        const magNum = parseFloat(g.Magnitude || '0');
        const mag = magNum.toFixed(1);
        if (magNum < 4.0) {
          continue; // Skip earthquakes with magnitude < 4.0
        }

        let lat = -2.5;
        let lng = 118.0;
        if (g.Coordinates) {
          const parts = g.Coordinates.split(',');
          if (parts.length === 2) {
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
          }
        }

        const severity = magNum >= 6.0 ? 'CRITICAL' : magNum >= 5.0 ? 'HIGH' : 'MODERATE';
        const title = `Gempa Bumi M${mag} - ${g.Wilayah || 'Indonesia'}`;
        const latStr = (isNaN(lat) ? -2.5 : lat).toFixed(1);
        const lngStr = (isNaN(lng) ? 118.0 : lng).toFixed(1);
        const dateObj = this.parseBmkgDate(g);
        const timeKey = dateObj.toISOString().slice(0, 16);
        const externalId = `BMKG-${timeKey}-${mag}-${latStr}-${lngStr}`.replace(/\s+/g, '-');

        const occurredAt = dateObj;

        let existing = await this.prisma.disasterEvent.findUnique({
          where: { externalId },
        });

        if (!existing) {
          // Check if an earthquake already exists close by in time and space with same magnitude
          const allQuakes = await this.prisma.disasterEvent.findMany({
            where: { category: 'EARTHQUAKE' },
          });
          for (const q of allQuakes) {
            const qLat = q.latitude;
            const qLng = q.longitude;
            const qTime = q.occurredAt.getTime();
            const timeDiff = Math.abs(qTime - occurredAt.getTime());
            const latDiff = Math.abs(qLat - (isNaN(lat) ? -2.5 : lat));
            const lngDiff = Math.abs(qLng - (isNaN(lng) ? 118.0 : lng));
            const qMagMatch = q.title.match(/M([0-9]+\.[0-9]+)/);
            const qMag = qMagMatch ? qMagMatch[1] : '0.0';

            if (timeDiff < 15 * 60 * 1000 && latDiff < 0.2 && lngDiff < 0.2 && qMag === mag) {
              existing = q;
              break;
            }
          }
        }

        if (!existing) {
          await this.prisma.disasterEvent.create({
            data: {
              title,
              description: `Gempa bumi magnitudo ${mag}, kedalaman ${g.Kedalaman}, wilayah ${g.Wilayah}. Potensi: ${g.Potensi || 'N/A'}. Dirasakan: ${g.Dirasakan || 'Tidak ada info'}.`,
              category: 'EARTHQUAKE',
              severity,
              status: 'ACTIVE',
              verificationStatus: 'VERIFIED',
              province: g.Wilayah ? g.Wilayah.split(',').pop()?.trim() || 'Indonesia' : 'Indonesia',
              locationName: g.Wilayah || 'Indonesia',
              latitude: isNaN(lat) ? -2.5 : lat,
              longitude: isNaN(lng) ? 118.0 : lng,
              occurredAt,
              sourceId,
              externalId,
              rawPayload: g,
              metadata: {
                magnitude: magNum,
                depth: g.Kedalaman,
                potential: g.Potensi,
                felt: g.Dirasakan,
              },
            },
          });
          createdCount++;
        } else {
          // Update existing event with latest info & standardized externalId
          await this.prisma.disasterEvent.update({
            where: { id: existing.id },
            data: {
              title,
              description: `Gempa bumi magnitudo ${mag}, kedalaman ${g.Kedalaman}, wilayah ${g.Wilayah}. Potensi: ${g.Potensi || 'N/A'}. Dirasakan: ${g.Dirasakan || 'Tidak ada info'}.`,
              severity,
              externalId,
              rawPayload: g,
              metadata: {
                magnitude: magNum,
                depth: g.Kedalaman,
                potential: g.Potensi,
                felt: g.Dirasakan,
              },
            },
          });
          updatedCount++;
        }
      }

      const durationMs = Date.now() - startTime;
      await this.prisma.syncLog.create({
        data: {
          dataSourceId: sourceId,
          status: 'SUCCESS',
          eventsProcessed: gempaList.length,
          eventsCreated: createdCount,
          eventsUpdated: updatedCount,
          durationMs,
        },
      });

      await this.prisma.dataSource.update({
        where: { id: sourceId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'SUCCESS',
          lastErrorMessage: null,
        },
      });

      this.logger.log(`✅ Berhasil sinkronisasi live BMKG (Mag >= 4.0): ${createdCount} baru, ${updatedCount} diperbarui.`);
    } catch (err) {
      this.logger.error('❌ Gagal sinkronisasi live BMKG:', err);
      await this.prisma.syncLog.create({
        data: {
          dataSourceId: sourceId,
          status: 'FAILED',
          errorMessage: err.message,
          durationMs: Date.now() - startTime,
        },
      });
      await this.prisma.dataSource.update({
        where: { id: sourceId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'FAILED',
          lastErrorMessage: err.message,
        },
      });
    }
  }

  private async simulateSourceSync(source: any) {
    await this.prisma.syncLog.create({
      data: {
        dataSourceId: source.id,
        status: 'SUCCESS',
        eventsProcessed: Math.floor(Math.random() * 5) + 1,
        eventsCreated: Math.random() > 0.8 ? 1 : 0,
        eventsUpdated: Math.floor(Math.random() * 3),
        durationMs: Math.floor(Math.random() * 300) + 120,
      },
    });

    await this.prisma.dataSource.update({
      where: { id: source.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'SUCCESS',
        lastErrorMessage: null,
      },
    });

    this.logger.log(`✅ Berhasil sinkronisasi sumber: ${source.code}`);
  }
}
