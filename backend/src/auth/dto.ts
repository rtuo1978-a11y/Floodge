import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class InscriptionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nom: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  motDePasse: string;

  @IsOptional()
  @IsString()
  commune?: string;
}

export class ConnexionDto {
  @IsEmail()
  email: string;

  @IsString()
  motDePasse: string;
}
