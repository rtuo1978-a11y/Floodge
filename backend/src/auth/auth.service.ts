import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConnexionDto, InscriptionDto } from './dto.js';

export type UtilisateurPublic = Omit<User, 'motDePasse' | 'pushToken'>;

export function sansSecret(user: User): UtilisateurPublic {
  const { motDePasse: _m, pushToken: _p, ...reste } = user;
  return reste;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async inscrire(dto: InscriptionDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Un compte existe déjà avec cet e-mail');
    }
    const user = await this.prisma.user.create({
      data: {
        nom: dto.nom.trim(),
        email,
        telephone: dto.telephone,
        commune: dto.commune,
        motDePasse: await bcrypt.hash(dto.motDePasse, 10),
      },
    });
    return this.session(user);
  }

  async connecter(dto: ConnexionDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user || !(await bcrypt.compare(dto.motDePasse, user.motDePasse))) {
      throw new UnauthorizedException('E-mail ou mot de passe incorrect');
    }
    return this.session(user);
  }

  private async session(user: User) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, user: sansSecret(user) };
  }
}
