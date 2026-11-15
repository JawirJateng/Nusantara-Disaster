import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) throw new Error('CORS_ORIGIN belum diset');

  // Hanya aktifkan bila memang di belakang proxy tepercaya, supaya IP rate limit tidak bisa dipalsukan.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Host health checks probe "/" (Back4App does), which the prefixed API answers 404.
  app.getHttpAdapter().getInstance().get('/', (_req, res) => res.json({ status: 'ok' }));

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Nusantara Disaster Backend running on port ${port}`);
}
bootstrap();
