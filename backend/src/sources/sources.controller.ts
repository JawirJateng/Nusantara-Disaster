import { Controller, Get, Param, Post, Put, Body, UseGuards, Req } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  async findAll() {
    return this.sourcesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  @Put(':id/toggle')
  async toggle(@Param('id') id: string, @Body('isEnabled') isEnabled: boolean, @Req() req) {
    return this.sourcesService.toggle(id, isEnabled, req.user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  @Post(':id/sync')
  async triggerSync(@Param('id') id: string, @Req() req) {
    return this.sourcesService.triggerSync(id, req.user?.id);
  }
}
