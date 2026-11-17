import { Body, Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';
import { sansSecret } from '../auth/auth.service.js';
import { Roles, UtilisateurCourant, type UtilisateurConnecte } from '../common/decorators.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

class MajProfilDto {
  @IsOptional() @IsString() nom?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() commune?: string;
  /** Jeton Expo (ExponentPushToken[...]) pour recevoir les alertes */
  @IsOptional() @IsString() pushToken?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
}

class ChangerRoleDto {
  @IsEnum(Role) role: Role;
}

@ApiTags('utilisateurs')
@ApiBearerAuth()
@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('moi')
  async moi(@UtilisateurCourant() u: UtilisateurConnecte) {
    const user = await this.prisma.user.findUnique({
      where: { id: u.id },
      include: { badges: { include: { badge: true }, orderBy: { obtenuLe: 'desc' } } },
    });
    if (!user) throw new NotFoundException();
    const { badges, ...reste } = user;
    return { ...sansSecret(reste), badges };
  }

  @Patch('moi')
  async majProfil(@UtilisateurCourant() u: UtilisateurConnecte, @Body() dto: MajProfilDto) {
    return sansSecret(await this.prisma.user.update({ where: { id: u.id }, data: dto }));
  }

  /** Un administrateur nomme un secouriste ou une autorité. */
  @Roles(Role.ADMIN)
  @Patch(':id/role')
  async changerRole(@Param('id') id: string, @Body() dto: ChangerRoleDto) {
    return sansSecret(await this.prisma.user.update({ where: { id }, data: { role: dto.role } }));
  }

  @Roles(Role.ADMIN)
  @Get()
  async lister() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(sansSecret);
  }
}
