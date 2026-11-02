import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async findAll(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.newsService.findAll(limit, offset);
  }
}
