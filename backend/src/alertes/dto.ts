import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { NiveauAlerte, TypeAlerte } from '../generated/prisma/enums.js';

export class CreerAlerteDto {
  @IsString() @MaxLength(120) titre: string;
  @IsString() @MaxLength(1000) message: string;
  /** Version courte lue à voix haute. Si absente, générée par l'IA à la publication. */
  @IsOptional() @IsString() @MaxLength(300) texteVocal?: string;
  @IsEnum(NiveauAlerte) niveau: NiveauAlerte;
  @IsOptional() @IsEnum(TypeAlerte) type?: TypeAlerte;
  @IsOptional() @IsString() zoneId?: string;
  @IsOptional() @IsString() commune?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
  @IsOptional() @IsNumber() @Min(0.1) @Max(50) rayonKm?: number;
  @IsOptional() @IsDateString() expireLe?: string;
  /** true = publier tout de suite (sinon brouillon) */
  @IsOptional() @IsBoolean() publier?: boolean;
}

export class FiltreAlertesDto {
  @IsOptional() @Type(() => Number) @IsLatitude() lat?: number;
  @IsOptional() @Type(() => Number) @IsLongitude() lng?: number;
  @IsOptional() @IsString() commune?: string;
}
