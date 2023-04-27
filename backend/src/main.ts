import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('BACKEND_PORT');

  const redisClient = createClient({
    socket: {
      host: 'redis',
      port: 6379,
    }
  });
  redisClient.connect().catch(console.error);
  const redisStore = new RedisStore({
    client: redisClient,
  });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [
      `${configService.get('FRONTEND_HOST')}`,
    ],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({whitelist: true}));
  app.use(session({
    store: redisStore,
    secret: "a-secret-string",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false // remove for production
    }
  }));
  await app.listen(port);
}

bootstrap();
