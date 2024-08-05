import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT', 3600);

  await app.listen(PORT, () => console.log(`Server started on port = ${PORT}`));
}

bootstrap();
