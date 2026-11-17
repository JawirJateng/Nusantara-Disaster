import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { categoryFor } from './news.classifier';

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

  // Batasi umur berita supaya DB gratian tidak penuh.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleRetention() {
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const { count } = await this.prisma.newsItem.deleteMany({
      where: { publishedAt: { lt: cutoff } },
    });
    if (count) this.logger.log(`🧹 Retensi berita: ${count} berita lebih dari 90 hari dihapus.`);
  }

  async fetchAndSyncDisasterNews() {
    const rssFeeds = [
      { name: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/nasional/rss' },
      { name: 'Detik.com', url: 'https://news.detik.com/rss' },
      { name: 'Tempo', url: 'https://www.tempo.co/rss' },
      { name: 'Antara News', url: 'https://www.antaranews.com/rss/metro' }
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
            if (!/^https?:\/\//i.test(sourceUrl)) continue; // block javascript:/data: links from feeds
            const summary = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : title;
            const pubDateStr = dateMatch ? dateMatch[1].trim() : new Date().toISOString();
            const publishedAt = new Date(pubDateStr);

            // Only save news that is about a natural disaster
            const category = categoryFor(title, summary);
            if (!category) continue;

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

    await this.pruneNonDisaster();

    this.logger.log(`✅ Berhasil sinkronisasi berita bencana live dari API berita. Berita baru: ${newCount}`);
  }

  // shortcut: full-table scan per sync; switch to a keyword/publishedAt filtered query if newsItem grows past tens of thousands.
  private async pruneNonDisaster() {
    const items = await this.prisma.newsItem.findMany({ select: { id: true, title: true, summary: true } });
    const ids = items.filter((item) => !categoryFor(item.title, item.summary)).map((item) => item.id);
    if (!ids.length) return;
    await this.prisma.newsItem.deleteMany({ where: { id: { in: ids } } });
    this.logger.log(`🧹 Hapus ${ids.length} berita yang bukan bencana alam.`);
  }

  async findAll(limit = 20, offset = 0) {
    // Public endpoint: hard cap so `?limit=100000000` cannot dump the whole table.
    const takeNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skipNum = Math.max(0, Number(offset) || 0);

    // Only disaster news is stored (see categoryFor), so no category filter is needed here.
    const [items, total] = await Promise.all([
      this.prisma.newsItem.findMany({
        orderBy: { publishedAt: 'desc' },
        take: takeNum,
        skip: skipNum,
      }),
      this.prisma.newsItem.count(),
    ]);

    return {
      items,
      meta: { total, limit: takeNum, offset: skipNum },
    };
  }
}
