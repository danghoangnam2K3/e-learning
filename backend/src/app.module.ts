import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ClassesModule } from './modules/classes/classes.module';
import { AutomationModule } from './modules/automation/automation.module';
import { LmsModule } from './modules/lms/lms.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // Biến môi trường
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // In-Memory Caching toàn cục (TTL mặc định 5 phút)
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,
    }),

    // Kết nối CSDL SQL Server (TypeORM)
    DatabaseModule,

    // 7 Modules nghiệp vụ cốt lõi
    AuthModule,
    UsersModule,
    CoursesModule,
    ClassesModule,
    AutomationModule,
    LmsModule,
    ReportsModule,
  ],
})
export class AppModule {}
