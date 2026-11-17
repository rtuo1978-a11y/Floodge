import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Photos enregistrées en local quand Supabase Storage n'est pas configuré
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const swagger = new DocumentBuilder()
    .setTitle('Floodge API')
    .setDescription("API de prévention et de gestion des inondations en Côte d'Ivoire")
    .setVersion('0.1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'interne')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = process.env.PORT ?? 3000;
  // 0.0.0.0 : accessible depuis le téléphone sur le même réseau Wi-Fi
  await app.listen(port, '0.0.0.0');
  console.log(`Floodge API : http://localhost:${port}/api/v1 — documentation : http://localhost:${port}/docs`);
}
await bootstrap();
