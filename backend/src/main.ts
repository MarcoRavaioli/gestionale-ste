import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ABILITA CORS: Permette al frontend (porta 5173) di parlare con il backend
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
