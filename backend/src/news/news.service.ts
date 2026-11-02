import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly logger = new Logger(NewsService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('📰 Mengambil berita bencana alam live dari API Tempo, CNN Indonesia, Detik.com, & Antara News...');
    this.fetchAndSyncDisasterNews().catch((err) => {
      this.logger.error('Gagal sinkronisasi berita bencana dari API:', err);
    });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCronSync() {
    await this.fetchAndSyncDisasterNews();
  }

  async fetchAndSyncDisasterNews() {
    const rssFeeds = [
      { name: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/nasional/rss' },
      { name: 'Detik.com', url: 'https://news.detik.com/rss' },
      { name: 'Tempo', url: 'https://www.tempo.co/rss' },
      { name: 'Antara News', url: 'https://www.antaranews.com/rss/peristiwa' }
    ];

    const disasterKeywords = [
      'gempa', 'banjir', 'longsor', 'gunung', 'tsunami', 'bencana', 'tanah longsor',
      'erupsi', 'cuaca ekstrem', 'badai', 'angin puting beliung', 'kebakaran hutan',
      'vulkanik', 'letusan', 'abrasi', 'kekeringan', 'gelombang tinggi', 'banjir bandang',
      'seismik', 'tektonik'
    ];

    let newCount = 0;

    for (const feed of rssFeeds) {
      try {
        const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        if (!res.ok) continue;
        const xml = await res.text();

        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null) {
          const itemXml = match[1];
          const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
          const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/) || itemXml.match(/<summary>([\s\S]*?)<\/summary>/);
          const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

          if (titleMatch && linkMatch) {
            const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim();
            const sourceUrl = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
            const summary = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : title;
            const pubDateStr = dateMatch ? dateMatch[1].trim() : new Date().toISOString();
            const publishedAt = new Date(pubDateStr);

            const lowerTitle = title.toLowerCase();
            const lowerSummary = summary.toLowerCase();

            // STRICT FILTER: Only save if related to natural disasters
            const isDisaster = disasterKeywords.some(kw => lowerTitle.includes(kw) || lowerSummary.includes(kw));

            if (!isDisaster) {
              continue; // Skip non-disaster news
            }

            let category = 'OTHER';
            if (lowerTitle.includes('gempa') || lowerSummary.includes('gempa') || lowerTitle.includes('tektonik')) category = 'EARTHQUAKE';
            else if (lowerTitle.includes('banjir') || lowerSummary.includes('banjir')) category = 'FLOOD';
            else if (lowerTitle.includes('gunung') || lowerTitle.includes('erupsi') || lowerSummary.includes('gunung') || lowerSummary.includes('vulkanik')) category = 'VOLCANO';
            else if (lowerTitle.includes('longsor') || lowerSummary.includes('longsor')) category = 'LANDSLIDE';
            else if (lowerTitle.includes('cuaca') || lowerTitle.includes('badai') || lowerSummary.includes('angin') || lowerSummary.includes('gelombang')) category = 'WEATHER';
            else if (lowerTitle.includes('kebakaran') || lowerSummary.includes('kebakaran')) category = 'WILDFIRE';

            const existing = await this.prisma.newsItem.findFirst({
              where: { sourceUrl },
            });

            if (!existing) {
              await this.prisma.newsItem.create({
                data: {
                  title,
                  summary: summary.slice(0, 300),
                  content: summary,
                  category: category as any,
                  sourceName: feed.name,
                  sourceUrl,
                  publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
                },
              });
              newCount++;
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Gagal mengambil berita live dari ${feed.name}:`, err);
      }
    }

    this.logger.log(`✅ Berhasil sinkronisasi berita bencana live dari API berita. Berita baru: ${newCount}`);
  }

  async findAll(limit = 20, offset = 0) {
    const takeNum = isNaN(Number(limit)) ? 20 : Number(limit);
    const skipNum = isNaN(Number(offset)) ? 0 : Number(offset);

    // Trigger background sync from live APIs
    this.fetchAndSyncDisasterNews().catch(() => {});

    // STRICT: Only return disaster news items stored in database
    const where = { category: { not: 'OTHER' as any } };

    const [items, total] = await Promise.all([
      this.prisma.newsItem.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: takeNum,
        skip: skipNum,
      }),
      this.prisma.newsItem.count({ where }),
    ]);

    return {
      items,
      meta: { total, limit: takeNum, offset: skipNum },
    };
  }
}
