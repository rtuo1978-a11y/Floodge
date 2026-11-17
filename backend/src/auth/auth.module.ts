import { Module } from '@nestjs/common';
import { UtilisateursController } from '../utilisateurs/utilisateurs.controller.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  controllers: [AuthController, UtilisateursController],
  providers: [AuthService],
})
export class AuthModule {}
