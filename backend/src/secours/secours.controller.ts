import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Roles, UtilisateurCourant, type UtilisateurConnecte } from '../common/decorators.js';
import { StatutSecours } from '../generated/prisma/enums.js';
import { NotificationsService } from '../integrations/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

class DemandeSecoursDto {
  @IsLatitude() latitude: number;
  @IsLongitude() longitude: number;
  @IsOptional() @IsInt() @Min(1) @Max(500) nbPersonnes?: number;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() telephone?: string;
}

class MajSecoursDto {
  @IsEnum(StatutSecours) statut: StatutSecours;
}

const TRANSITIONS: Record<StatutSecours, StatutSecours[]> = {
  EN_ATTENTE: ['PRISE_EN_CHARGE', 'ANNULEE'],
  PRISE_EN_CHARGE: ['TERMINEE', 'EN_ATTENTE'],
  TERMINEE: [],
  ANNULEE: [],
};

@Injectable()
export class SecoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async demander(dto: DemandeSecoursDto, demandeurId: string) {
    const demande = await this.prisma.demandeSecours.create({
      data: { ...dto, demandeurId },
      include: { demandeur: { select: { nom: true, telephone: true } } },
    });
    await this.prisma.user.update({
      where: { id: demandeurId },
      data: { latitude: dto.latitude, longitude: dto.longitude },
    });
    await this.notifications.envoyerA(
      { role: { in: ['SECOURISTE', 'AUTORITE'] } },
      {
        titre: '🆘 Demande de secours',
        corps: `${demande.nbPersonnes} personne(s) — ${demande.description ?? 'sans précision'}`,
        donnees: { type: 'secours', demandeId: demande.id, latitude: dto.latitude, longitude: dto.longitude },
        urgent: true,
      },
    );
    return demande;
  }

  lister(statut?: StatutSecours) {
    return this.prisma.demandeSecours.findMany({
      where: { statut: statut ?? { in: ['EN_ATTENTE', 'PRISE_EN_CHARGE'] } },
      include: {
        demandeur: { select: { nom: true, telephone: true } },
        secouriste: { select: { nom: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  miennes(userId: string) {
    return this.prisma.demandeSecours.findMany({
      where: { demandeurId: userId },
      include: { secouriste: { select: { nom: true, telephone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async majStatut(id: string, statut: StatutSecours, u: UtilisateurConnecte) {
    const d = await this.prisma.demandeSecours.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Demande introuvable');

    const estDemandeur = d.demandeurId === u.id;
    const estSecours = ['SECOURISTE', 'AUTORITE', 'ADMIN'].includes(u.role);
    if (!estSecours && !(estDemandeur && statut === 'ANNULEE')) {
      throw new ForbiddenException('Seuls les secours peuvent modifier cette demande');
    }
    if (!TRANSITIONS[d.statut].includes(statut)) {
      throw new BadRequestException(`Passage impossible de ${d.statut} à ${statut}`);
    }

    const maj = await this.prisma.demandeSecours.update({
      where: { id },
      data: {
        statut,
        ...(statut === 'PRISE_EN_CHARGE' ? { secouristeId: u.id, priseEnChargeLe: new Date() } : {}),
        ...(statut === 'TERMINEE' ? { termineeLe: new Date() } : {}),
        ...(statut === 'EN_ATTENTE' ? { secouristeId: null, priseEnChargeLe: null } : {}),
      },
    });
    if (statut === 'PRISE_EN_CHARGE') {
      await this.notifications.envoyerA(
        { id: d.demandeurId },
        { titre: '🚑 Les secours arrivent', corps: 'Votre demande a été prise en charge. Restez en hauteur et joignable.', urgent: true },
      );
    }
    return maj;
  }
}

@ApiTags('secours')
@ApiBearerAuth()
@Controller('secours')
export class SecoursController {
  constructor(private readonly secours: SecoursService) {}

  /** Bouton SOS du citoyen */
  @Post()
  demander(@Body() dto: DemandeSecoursDto, @UtilisateurCourant() u: UtilisateurConnecte) {
    return this.secours.demander(dto, u.id);
  }

  @Get('miennes')
  miennes(@UtilisateurCourant() u: UtilisateurConnecte) {
    return this.secours.miennes(u.id);
  }

  /** Espace secours : demandes en cours (?statut= pour filtrer) */
  @Roles('SECOURISTE', 'AUTORITE', 'ADMIN')
  @Get()
  lister(@Query('statut') statut?: StatutSecours) {
    return this.secours.lister(statut && statut in TRANSITIONS ? statut : undefined);
  }

  @Patch(':id')
  majStatut(@Param('id') id: string, @Body() dto: MajSecoursDto, @UtilisateurCourant() u: UtilisateurConnecte) {
    return this.secours.majStatut(id, dto.statut, u);
  }
}
