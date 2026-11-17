import { Body, Controller, Get, Param, Patch, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Interne, Public } from '../common/decorators.js';
import { NiveauRisque } from '../generated/prisma/enums.js';
import { CarteClient } from '../integrations/carte.client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SignalementsService } from '../signalements/signalements.service.js';

class PointDto {
  @IsLatitude() latitude: number;
  @IsLongitude() longitude: number;
}

class ItineraireDto {
  @ValidateNested() @Type(() => PointDto) origine: PointDto;
  @ValidateNested() @Type(() => PointDto) destination: PointDto;
  @IsOptional() @IsIn(['driving', 'walking']) mode?: 'driving' | 'walking';
}

class ZoneImportDto {
  @IsString() code: string;
  @IsString() nom: string;
  @IsString() commune: string;
  @IsObject() geometrie: Record<string, unknown>;
  @IsEnum(NiveauRisque) niveau: NiveauRisque;
  @IsOptional() @IsNumber() @Min(0) @Max(100) score?: number;
  @IsString() source: string;
  @IsBoolean() estDemo: boolean;
}

class ImportZonesDto {
  @IsArray() @ArrayMaxSize(2000) @ValidateNested({ each: true }) @Type(() => ZoneImportDto) zones: ZoneImportDto[];
}

class MajRisqueDto {
  @IsEnum(NiveauRisque) niveau: NiveauRisque;
  @IsNumber() @Min(0) @Max(100) score: number;
  @IsOptional() @IsString() source?: string;
}

class ObservationDto {
  @IsOptional() @IsString() source?: string;
  @IsString() stationCode: string;
  @IsOptional() @IsString() stationNom?: string;
  @IsLatitude() latitude: number;
  @IsLongitude() longitude: number;
  @IsOptional() @IsNumber() pluieMm?: number;
  @IsOptional() @IsInt() @Min(1) periodeH?: number;
  @IsOptional() @IsNumber() niveauEauCm?: number;
  @IsDateString() observeLe: string;
}

class ImportObservationsDto {
  @IsArray() @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => ObservationDto) observations: ObservationDto[];
}

@ApiTags('carte')
@Controller()
export class CarteController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carte: CarteClient,
    private readonly signalements: SignalementsService,
  ) {}

  /** Zones à risque au format GeoJSON (FeatureCollection) pour la carte. */
  @Public()
  @Get('zones')
  async zones(@Query('commune') commune?: string) {
    const zones = await this.prisma.zoneRisque.findMany({ where: { commune }, orderBy: { nom: 'asc' } });
    return {
      type: 'FeatureCollection',
      features: zones.map(({ geometrie, ...props }) => ({ type: 'Feature', geometry: geometrie, properties: props })),
    };
  }

  /** Dernières observations météo (SODEXAM) — ?heures=24 */
  @Public()
  @Get('meteo/observations')
  observations(@Query('heures') heures?: string) {
    const depuis = new Date(Date.now() - (Number(heures) || 24) * 3_600_000);
    return this.prisma.observationMeteo.findMany({ where: { observeLe: { gte: depuis } }, orderBy: { observeLe: 'desc' } });
  }

  /** Itinéraire qui évite les rues signalées inondées. */
  @Public()
  @Post('carte/itineraire-sur')
  async itineraireSur(@Body() dto: ItineraireDto) {
    const points = await this.signalements.pointsInondes(12);
    const res = await this.carte.itineraireSur({ ...dto, pointsInondes: points });
    if (!res) throw new ServiceUnavailableException('Service de cartographie indisponible');
    return res;
  }

  @Public()
  @Get('carte/localiser')
  async localiser(@Query() p: PointDto) {
    return (await this.carte.localiser(p)) ?? { zone: null, commune: null };
  }

  // ---------- Routes internes (service cartographie) ----------

  @Interne()
  @Post('interne/zones/import')
  async importerZones(@Body() dto: ImportZonesDto) {
    for (const z of dto.zones) {
      const data = { ...z, geometrie: z.geometrie as object };
      await this.prisma.zoneRisque.upsert({ where: { code: z.code }, create: data, update: data });
    }
    return { importees: dto.zones.length };
  }

  @Interne()
  @Patch('interne/zones/:code/risque')
  majRisque(@Param('code') code: string, @Body() dto: MajRisqueDto) {
    return this.prisma.zoneRisque.update({ where: { code }, data: dto });
  }

  @Interne()
  @Post('interne/meteo/observations')
  async importerObservations(@Body() dto: ImportObservationsDto) {
    const res = await this.prisma.observationMeteo.createMany({
      data: dto.observations.map((o) => ({ ...o, observeLe: new Date(o.observeLe) })),
      skipDuplicates: true,
    });
    return { importees: res.count, ignorees: dto.observations.length - res.count };
  }
}
