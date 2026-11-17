import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadgesService } from './badges.service.js';

@ApiTags('badges')
@Controller()
export class BadgesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgesService,
  ) {}

  @Public()
  @Get('badges')
  lister() {
    return this.prisma.badge.findMany({ orderBy: { nom: 'asc' } });
  }

  /** Classement des citoyens. ?periode=2026-11 (par défaut : mois en cours) */
  @Public()
  @Get('classement')
  classement(@Query('periode') periode?: string) {
    return this.badges.classement(periode && /^\d{4}-\d{2}$/.test(periode) ? periode : undefined);
  }
}
