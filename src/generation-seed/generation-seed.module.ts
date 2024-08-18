import { Module } from '@nestjs/common';
import { GenerationSeedService } from './generation-seed.service';
import { GenerationSeedController } from './generation-seed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/database/entities/payment/Payment.entity';
import { Integration } from 'src/database/entities/integration/Intergration.entity';
import { Channel } from 'src/database/entities/channel/Channel.entity';
import { OrdIntegration } from 'src/database/entities/ordIntegration/OrdIntegration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, Payment, Integration, OrdIntegration]),
  ],
  controllers: [GenerationSeedController],
  providers: [GenerationSeedService],
  exports: [GenerationSeedService],
})
export class GenerationSeedModule {}
