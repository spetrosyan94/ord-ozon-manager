import { Module } from '@nestjs/common';
import { OrdManagerModule } from './ord-manager/ord-manager.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getMySQLConfig } from './configs/mysql.config';
import { GenerationSeedModule } from './generation-seed/generation-seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMySQLConfig,
    }),
    OrdManagerModule,
    GenerationSeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
