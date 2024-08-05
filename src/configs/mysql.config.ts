import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const getMySQLConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
  type: 'mysql',
  host: configService.get<string>('MYSQL_HOST', 'localhost'),
  port: configService.get<number>('MYSQL_PORT', 3306),
  username: configService.get<string>('MYSQL_USERNAME', 'root'),
  password: configService.get<string>('MYSQL_PASSWORD', 'root'),
  database: configService.get<string>('MYSQL_DATABASE', 'ord-manager'),
  synchronize: true,
  autoLoadEntities: true,
  logging: true,
  // entities: [path.join(__dirname, '../database/entities/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  subscribers: [
    path.join(__dirname, '../database/subscribers/*.subscriber.{ts,js}'),
  ],
});
