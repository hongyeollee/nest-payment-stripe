import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import express from 'express';
import session from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'local-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'shop', method: RequestMethod.GET },
      { path: 'cart', method: RequestMethod.GET },
      { path: 'cart/add', method: RequestMethod.POST },
      { path: 'cart/remove', method: RequestMethod.POST },
      { path: 'cart/update', method: RequestMethod.POST },
      { path: 'orders/:orderCode', method: RequestMethod.GET },
    ],
  });

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use(expressLayouts);
  app.set('layout', 'partials/layout');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
