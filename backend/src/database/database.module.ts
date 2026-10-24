import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const portStr = configService.get<string>('DB_PORT');
        const port = portStr ? parseInt(portStr, 10) : undefined;
        // Nếu đã chỉ định port thì kết nối thẳng theo TCP port, tránh phụ thuộc SQL Browser UDP 1434
        const instanceName = port ? undefined : configService.get<string>('DB_INSTANCE');

        return {
          type: 'mssql',
          host: configService.get<string>('DB_HOST', '127.0.0.1'),
          port: port,
          username: configService.get<string>('DB_USERNAME', 'sa'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME', 'QL_DaoTaoLaiXe'),
          options: {
            encrypt: configService.get<string>('DB_ENCRYPT') === 'true',
            trustServerCertificate: configService.get<string>('DB_TRUST_SERVER_CERTIFICATE', 'true') === 'true',
            instanceName: instanceName,
            connectTimeout: parseInt(configService.get<string>('DB_CONNECTION_TIMEOUT', '30000'), 10),
            requestTimeout: parseInt(configService.get<string>('DB_REQUEST_TIMEOUT', '30000'), 10),
          },
          // Cấu hình Connection Pool: Với cổng DAC 58222 (Dedicated Administrator Connection), 
          // SQL Server giới hạn duy nhất 1 kết nối vật lý đồng thời (Single Connection).
          // Đặt max: 1, min: 1 để TypeORM xếp hàng query an toàn, loại bỏ hoàn toàn lỗi ECONNRESET.
          extra: {
            pool: {
              max: 1,
              min: 1,
              idleTimeoutMillis: 300000,
            },
          },
          pool: {
            max: 1,
            min: 1,
            idleTimeoutMillis: 300000,
          },
          synchronize: false, // Quản lý schema bằng các file SQL migration / schema
          autoLoadEntities: false,
          logging: configService.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
