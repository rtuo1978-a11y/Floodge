import { Injectable, Logger } from '@nestjs/common';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface MessagePush {
  titre: string;
  corps: string;
  /** Données reçues par l'application (ex. { type: 'alerte', alerteId, texteVocal }) */
  donnees?: Record<string, unknown>;
  urgent?: boolean;
}

/** Envoi des notifications push via le service Expo. */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  /** Envoie à tous les utilisateurs correspondant au filtre et ayant un jeton push. */
  async envoyerA(filtre: Prisma.UserWhereInput, message: MessagePush): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: { ...filtre, pushToken: { not: null } },
      select: { pushToken: true },
    });
    return this.envoyer(
      users.map((u) => u.pushToken!),
      message,
    );
  }

  async envoyer(jetons: string[], message: MessagePush): Promise<number> {
    const valides = jetons.filter((t) => Expo.isExpoPushToken(t));
    if (!valides.length) return 0;

    const messages: ExpoPushMessage[] = valides.map((to) => ({
      to,
      title: message.titre,
      body: message.corps,
      data: message.donnees ?? {},
      sound: 'default',
      priority: message.urgent ? 'high' : 'default',
      channelId: message.urgent ? 'alertes-urgentes' : 'default',
    }));

    let envoyes = 0;
    for (const lot of this.expo.chunkPushNotifications(messages)) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(lot);
        envoyes += tickets.filter((t) => t.status === 'ok').length;
      } catch (e) {
        this.logger.error(`Échec d'envoi push : ${(e as Error).message}`);
      }
    }
    this.logger.log(`Notification « ${message.titre} » envoyée à ${envoyes}/${valides.length} appareil(s)`);
    return envoyes;
  }
}
