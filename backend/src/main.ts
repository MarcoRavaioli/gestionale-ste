import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. HELMET: Configurato per permettere il caricamento immagini cross-site
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 2. CORS: Fondamentale per far parlare i due sottodomini
  app.enableCors({
    origin: [
      'https://gestionalegspose.marcoravaiolii.xyz', // Produzione
      'http://localhost:8100', // Sviluppo locale (opzionale)
      'http://localhost:4200',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 3. ASSET STATICI (Uploads)
  // Decommentato e reso robusto.
  // In locale userà la cartella 'uploads' nella root del progetto.
  // In Docker mapperemo questa cartella su un volume.
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3000);
}
void bootstrap();
