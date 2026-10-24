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

  // Kích hoạt nén HTTP Payload (Gzip/Deflate) tối ưu tốc độ mạng và giảm độ trễ
  app.use(compression());

  // Cấu hình phục vụ tệp tĩnh (Static Assets) cho uploads / avatars theo quy trình lưu ảnh
  const uploadsDir = join(process.cwd(), 'uploads');
  const avatarsDir = join(uploadsDir, 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // 1. Cấu hình tiền tố toàn cục (Global Prefix)
  app.setGlobalPrefix(apiPrefix);

  // 2. Cấu hình CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Cấu hình ValidationPipe toàn cục
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

  // 4. Cấu hình Exception Filter bắt lỗi Stored Procedure & HTTP
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. Cấu hình Response Interceptor chuẩn hóa format
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 6. Cấu hình Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HỆ THỐNG QUẢN LÝ ĐÀO TẠO LÁI XE & E-LEARNING (LMS)')
    .setDescription(
      'Tài liệu đặc tả toàn bộ RESTful API Backend cho 7 Modules theo Clean Architecture và 100% Stored Procedures trong MS SQL Server 2019.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập JWT Token xác thực',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'LMS Lái Xe - API Documentation',
  });

  // 7. Khởi chạy Server
  await app.listen(port);
  logger.log(`========================================================`);
  logger.log(`🚀 Hệ thống Backend LMS Đào tạo Lái xe đang chạy tại:`);
  logger.log(`👉 API Server Base URL : http://localhost:${port}/${apiPrefix}`);
  logger.log(`👉 Swagger Docs URL    : http://localhost:${port}/api/docs`);
  logger.log(`========================================================`);
}

bootstrap();
