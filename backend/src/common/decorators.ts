import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Role } from '../generated/prisma/enums.js';

export const IS_PUBLIC = 'isPublic';
/** Route accessible sans être connecté. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
/** Restreint une route à certains rôles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

export const IS_INTERNAL = 'isInternal';
/** Route réservée aux services internes (IA, cartographie) : en-tête x-api-key. */
export const Interne = () => SetMetadata(IS_INTERNAL, true);

export interface UtilisateurConnecte {
  id: string;
  email: string;
  role: Role;
}

/** Récupère l'utilisateur connecté (extrait du JWT). */
export const UtilisateurCourant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UtilisateurConnecte =>
    ctx.switchToHttp().getRequest().user,
);
