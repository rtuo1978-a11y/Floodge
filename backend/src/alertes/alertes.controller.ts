import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Roles, UtilisateurCourant, type UtilisateurConnecte } from '../common/decorators.js';
import { AlertesService } from './alertes.service.js';
import { CreerAlerteDto, FiltreAlertesDto } from './dto.js';

@ApiTags('alertes')
@ApiBearerAuth()
@Controller('alertes')
export class AlertesController {
  constructor(private readonly alertes: AlertesService) {}

  /** Alertes en cours. ?lat=&lng= pour les trier par distance, ?commune= pour filtrer. */
  @Public()
  @Get()
  actives(@Query() filtre: FiltreAlertesDto) {
    return this.alertes.actives(filtre);
  }

  /** Alertes à valider (proposées par le moteur de règles ou en rédaction). */
  @Roles('AUTORITE', 'ADMIN')
  @Get('brouillons')
  brouillons() {
    return this.alertes.brouillons();
  }

  @Public()
  @Get(':id')
  trouver(@Param('id') id: string) {
    return this.alertes.trouver(id);
  }

  @Roles('AUTORITE', 'ADMIN')
  @Post()
  creer(@Body() dto: CreerAlerteDto, @UtilisateurCourant() u: UtilisateurConnecte) {
    return this.alertes.creer(dto, u.id);
  }

  @Roles('AUTORITE', 'ADMIN')
  @Patch(':id/publier')
  publier(@Param('id') id: string) {
    return this.alertes.publier(id);
  }

  @Roles('AUTORITE', 'ADMIN')
  @Patch(':id/archiver')
  archiver(@Param('id') id: string) {
    return this.alertes.archiver(id);
  }
}
