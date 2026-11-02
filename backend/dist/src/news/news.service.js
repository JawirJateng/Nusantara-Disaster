"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
let NewsService = NewsService_1 = class NewsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NewsService_1.name);
    }
    async onModuleInit() {
        this.logger.log('📰 Mengambil berita bencana alam live dari API Tempo, CNN Indonesia, Detik.com, & Antara News...');
        this.fetchAndSyncDisasterNews().catch((err) => {
            this.logger.error('Gagal sinkronisasi berita bencana dari API:', err);
        });
    }
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
                if (!res.ok)
                    continue;
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
                        const isDisaster = disasterKeywords.some(kw => lowerTitle.includes(kw) || lowerSummary.includes(kw));
                        if (!isDisaster) {
                            continue;
                        }
                        let category = 'OTHER';
                        if (lowerTitle.includes('gempa') || lowerSummary.includes('gempa') || lowerTitle.includes('tektonik'))
                            category = 'EARTHQUAKE';
                        else if (lowerTitle.includes('banjir') || lowerSummary.includes('banjir'))
                            category = 'FLOOD';
                        else if (lowerTitle.includes('gunung') || lowerTitle.includes('erupsi') || lowerSummary.includes('gunung') || lowerSummary.includes('vulkanik'))
                            category = 'VOLCANO';
                        else if (lowerTitle.includes('longsor') || lowerSummary.includes('longsor'))
                            category = 'LANDSLIDE';
                        else if (lowerTitle.includes('cuaca') || lowerTitle.includes('badai') || lowerSummary.includes('angin') || lowerSummary.includes('gelombang'))
                            category = 'WEATHER';
                        else if (lowerTitle.includes('kebakaran') || lowerSummary.includes('kebakaran'))
                            category = 'WILDFIRE';
                        const existing = await this.prisma.newsItem.findFirst({
                            where: { sourceUrl },
                        });
                        if (!existing) {
                            await this.prisma.newsItem.create({
                                data: {
                                    title,
                                    summary: summary.slice(0, 300),
                                    content: summary,
                                    category: category,
                                    sourceName: feed.name,
                                    sourceUrl,
                                    publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
                                },
                            });
                            newCount++;
                        }
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Gagal mengambil berita live dari ${feed.name}:`, err);
            }
        }
        this.logger.log(`✅ Berhasil sinkronisasi berita bencana live dari API berita. Berita baru: ${newCount}`);
    }
    async findAll(limit = 20, offset = 0) {
        const takeNum = isNaN(Number(limit)) ? 20 : Number(limit);
        const skipNum = isNaN(Number(offset)) ? 0 : Number(offset);
        this.fetchAndSyncDisasterNews().catch(() => { });
        const where = { category: { not: 'OTHER' } };
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
};
exports.NewsService = NewsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NewsService.prototype, "handleCronSync", null);
exports.NewsService = NewsService = NewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NewsService);
//# sourceMappingURL=news.service.js.map