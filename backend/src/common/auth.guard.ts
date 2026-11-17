import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '../generated/prisma/enums.js';
import { IS_INTERNAL, IS_PUBLIC, ROLES, type UtilisateurConnecte } from './decorators.js';

/**
 * Garde global :
 *  - routes @Interne()  → clé x-api-key = INTERNAL_API_KEY
 *  - routes @Public()   → pas de contrôle (le JWT est lu s'il est présent)
 *  - autres routes      → JWT obligatoire, puis contrôle des @Roles()
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const request = context.switchToHttp().getRequest();

    if (this.reflector.getAllAndOverride<boolean>(IS_INTERNAL, targets)) {
      const cle = request.headers['x-api-key'];
      if (!cle || cle !== this.config.get<string>('INTERNAL_API_KEY')) {
        throw new UnauthorizedException('Clé interne invalide');
      }
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets);
    const token = this.extraireToken(request.headers.authorization);

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string; email: string; role: Role }>(token);
        request.user = { id: payload.sub, email: payload.email, role: payload.role } satisfies UtilisateurConnecte;
      } catch {
        if (!isPublic) throw new UnauthorizedException('Session expirée, reconnectez-vous');
      }
    }

    if (isPublic) return true;
    if (!request.user) throw new UnauthorizedException('Connexion requise');

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, targets);
    if (roles?.length && !roles.includes(request.user.role)) {
      throw new ForbiddenException("Vous n'avez pas les droits pour cette action");
    }
    return true;
  }

  private extraireToken(header?: string): string | undefined {
    const [type, token] = header?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
