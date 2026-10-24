import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // KÃ­ch hoáº¡t nÃ©n HTTP Payload (Gzip/Deflate) tá»‘i Æ°u tá»‘c Ä‘á»™ máº¡ng vÃ  giáº£m Ä‘á»™ trá»…
  app.use(compression());

  // Cáº¥u hÃ¬nh phá»¥c vá»¥ tá»‡p tÄ©nh (Static Assets) cho uploads / avatars theo quy trÃ¬nh lÆ°u áº£nh
  const uploadsDir = join(process.cwd(), 'uploads');
  const avatarsDir = join(uploadsDir, 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // 1. Cáº¥u hÃ¬nh tiá»n tá»‘ toÃ n cá»¥c (Global Prefix)
  app.setGlobalPrefix(apiPrefix);

  // 2. Cáº¥u hÃ¬nh CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin === '*' ? true : (corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Cáº¥u hÃ¬nh ValidationPipe toÃ n cá»¥c
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Cáº¥u hÃ¬nh Exception Filter báº¯t lá»—i Stored Procedure & HTTP
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. Cáº¥u hÃ¬nh Response Interceptor chuáº©n hÃ³a format
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 6. Cáº¥u hÃ¬nh Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Há»† THá»NG QUáº¢N LÃ ÄÃ€O Táº O LÃI XE & E-LEARNING (LMS)')
    .setDescription(
      'TÃ i liá»‡u Ä‘áº·c táº£ toÃ n bá»™ RESTful API Backend cho 7 Modules theo Clean Architecture vÃ  100% Stored Procedures trong MS SQL Server 2019.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nháº­p JWT Token xÃ¡c thá»±c',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'LMS LÃ¡i Xe - API Documentation',
  });

  // 7. Khá»Ÿi cháº¡y Server
  await app.listen(port);
  logger.log(`========================================================`);
  logger.log(`ðŸš€ Há»‡ thá»‘ng Backend LMS ÄÃ o táº¡o LÃ¡i xe Ä‘ang cháº¡y táº¡i:`);
  logger.log(`ðŸ‘‰ API Server Base URL : http://localhost:${port}/${apiPrefix}`);
  logger.log(`ðŸ‘‰ Swagger Docs URL    : http://localhost:${port}/api/docs`);
  logger.log(`========================================================`);
}

bootstrap();

