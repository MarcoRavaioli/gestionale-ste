import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet'; // <--- 1. IMPORTA HELMET
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- SICUREZZA 1: HELMET ---
  // Protegge dagli attacchi web comuni impostando header HTTP sicuri.
  app.use(
    helmet({
      // IMPORTANTE: Poiché servi file statici (uploads) a un frontend su un'altra porta (5173),
      // dobbiamo dire al browser che è sicuro caricare queste risorse "cross-origin".
      // Senza questo, le immagini/pdf nel frontend risulterebbero bloccati (rotti).
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // --- SICUREZZA 2: CORS ---
  // Permette al frontend (porta 5173) di parlare con il backend
  // Per la produzione, è meglio specificare l'origine esatta invece di lasciarlo aperto a tutti.
  app.enableCors({
    origin: '*', // In produzione metti: 'https://tuodominio.com'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Rimuove automaticamente campi non richiesti (pulizia)
      transform: true, // Converte automaticamente i tipi (es. "1" stringa diventa 1 numero)
    }),
  );

  // --- ASSET STATICI ---
  // Rendi pubblica la cartella uploads
  // I file saranno accessibili su: http://localhost:3000/uploads/fatture/nomefile.pdf
  //app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  //  prefix: '/uploads/',
  //});

  await app.listen(3000);
}
void bootstrap();
