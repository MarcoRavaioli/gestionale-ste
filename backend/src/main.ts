import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ABILITA CORS: Permette al frontend (porta 5173) di parlare con il backend
  app.enableCors();

  // Rendi pubblica la cartella uploads
  // I file saranno accessibili su: http://localhost:3000/uploads/fatture/nomefile.pdf
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3000);
}
void bootstrap();
