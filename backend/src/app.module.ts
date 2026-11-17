import { Controller, Get, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertesController } from './alertes/alertes.controller.js';
import { AlertesService } from './alertes/alertes.service.js';
import { AuthModule } from './auth/auth.module.js';
import { BadgesController } from './badges/badges.controller.js';
import { BadgesService } from './badges/badges.service.js';
import { CarteController } from './carte/carte.controller.js';
import { AuthGuard } from './common/auth.guard.js';
import { Public } from './common/decorators.js';
import { ConseilsController } from './conseils/conseils.controller.js';
import { CarteClient } from './integrations/carte.client.js';
import { IaClient } from './integrations/ia.client.js';
import { NotificationsService } from './integrations/notifications.service.js';
import { StockageService } from './integrations/stockage.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SecoursController, SecoursService } from './secours/secours.controller.js';
import { SignalementsController } from './signalements/signalements.controller.js';
import { SignalementsService } from './signalements/signalements.service.js';

@Controller()
class SanteController {
  @Public()
  @Get('sante')
  sante() {
    return { statut: 'ok', service: 'flowmanage-backend', heure: new Date().toISOString() };
  }
}

/** Services partagés par tous les modules. */
@Global()
@Module({
  providers: [IaClient, CarteClient, NotificationsService, StockageService, BadgesService, AlertesService],
  exports: [IaClient, CarteClient, NotificationsService, StockageService, BadgesService, AlertesService],
})
class PartageModule {}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    PrismaModule,
    PartageModule,
    AuthModule,
  ],
  controllers: [
    SanteController,
    SignalementsController,
    AlertesController,
    CarteController,
    SecoursController,
    ConseilsController,
    BadgesController,
  ],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }, SignalementsService, SecoursService],
})
export class AppModule {}
