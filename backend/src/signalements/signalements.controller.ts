import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Interne, Public, Roles, UtilisateurCourant, type UtilisateurConnecte } from '../common/decorators.js';
import { StockageService } from '../integrations/stockage.service.js';
import { ChangerStatutDto, CreerSignalementDto, FiltreSignalementsDto } from './dto.js';
import { SignalementsService } from './signalements.service.js';

@ApiTags('signalements')
@ApiBearerAuth()
@Controller()
export class SignalementsController {
  constructor(
    private readonly signalements: SignalementsService,
    private readonly stockage: StockageService,
  ) {}

  /** Étape 1 (optionnelle) : envoyer la photo (multipart, champ "photo") → { url } */
  @Post('signalements/photo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async envoyerPhoto(@UploadedFile() photo?: Express.Multer.File) {
    if (!photo) throw new BadRequestException('Aucune photo reçue (champ "photo")');
    return { url: await this.stockage.enregistrerPhoto(photo) };
  }

  /** Étape 2 : créer le signalement */
  @Post('signalements')
  creer(@Body() dto: CreerSignalementDto, @UtilisateurCourant() u: UtilisateurConnecte) {
    return this.signalements.creer(dto, u.id);
  }

  /** Signalements pour la carte (publics). */
  @Public()
  @Get('signalements')
  lister(@Query() filtre: FiltreSignalementsDto) {
    return this.signalements.lister(filtre);
  }

  @Get('signalements/miens')
  miens(@UtilisateurCourant() u: UtilisateurConnecte) {
    return this.signalements.mesSignalements(u.id);
  }

  @Public()
  @Get('signalements/:id')
  trouver(@Param('id') id: string) {
    return this.signalements.trouver(id);
  }

  @Post('signalements/:id/confirmer')
  confirmer(@Param('id') id: string, @UtilisateurCourant() u: UtilisateurConnecte) {
    return this.signalements.confirmer(id, u.id);
  }

  @Roles('AUTORITE', 'ADMIN', 'SECOURISTE')
  @Patch('signalements/:id/statut')
  changerStatut(
    @Param('id') id: string,
    @Body() dto: ChangerStatutDto,
    @UtilisateurCourant() u: UtilisateurConnecte,
  ) {
    return this.signalements.changerStatut(id, dto, u.id);
  }

  /** Pour le service cartographie (calcul du risque) */
  @Interne()
  @Get('interne/signalements/recents')
  recents(@Query('heures') heures?: string) {
    return this.signalements.pointsInondes(Number(heures) || 12);
  }
}
