import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { NiveauInondation, StatutSignalement } from '../generated/prisma/enums.js';

export class CreerSignalementDto {
  @IsLatitude() latitude: number;
  @IsLongitude() longitude: number;
  @IsEnum(NiveauInondation) niveau: NiveauInondation;

  @IsString()
  @MinLength(5, { message: 'Décrivez la situation en quelques mots' })
  @MaxLength(1000)
  description: string;

  /** URL renvoyée par POST /signalements/photo */
  @IsOptional() @IsUrl({ require_tld: false }) photoUrl?: string;
  /** Commune choisie par l'utilisateur (sinon déduite de la position) */
  @IsOptional() @IsString() commune?: string;
}

export class ChangerStatutDto {
  @IsIn(['CONFIRME', 'REJETE', 'RESOLU'] satisfies StatutSignalement[])
  statut: 'CONFIRME' | 'REJETE' | 'RESOLU';
}

export class FiltreSignalementsDto {
  @IsOptional() @IsEnum(StatutSignalement) statut?: StatutSignalement;
  @IsOptional() @IsString() commune?: string;
  /** Signalements des N dernières heures (défaut 48) */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(24 * 30) heures?: number;
  @IsOptional() @Type(() => Number) @IsLatitude() lat?: number;
  @IsOptional() @Type(() => Number) @IsLongitude() lng?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0.1) @Max(100) rayonKm?: number;
}
