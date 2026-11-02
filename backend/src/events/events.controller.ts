import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventFilterDto } from './dto/event-filter.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(@Query() filter: EventFilterDto) {
    return this.eventsService.findAll(filter);
  }

  @Get('geojson')
  async findGeoJSON(@Query() filter: EventFilterDto) {
    return this.eventsService.findGeoJSON(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  @Post()
  async create(@Body() dto: CreateEventDto, @Req() req) {
    return this.eventsService.create(dto, req.user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.OPERATOR)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto, @Req() req) {
    return this.eventsService.update(id, dto, req.user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.eventsService.remove(id, req.user?.id);
  }
}
