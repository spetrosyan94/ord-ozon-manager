import { Module } from '@nestjs/common';
import { OrdManagerService } from './ord-manager.service';
import { OrdManagerController } from './ord-manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdIntegration } from 'src/database/entities/ordIntegration/OrdIntegration.entity';
import { Integration } from 'src/database/entities/integration/Intergration.entity';
import { Channel } from 'src/database/entities/channel/Channel.entity';
import { Payment } from 'src/database/entities/payment/Payment.entity';
import { OrdOzonService } from './ordOzon/ordOzon.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdIntegration, Integration, Channel, Payment]),
  ],
  controllers: [OrdManagerController],
  providers: [OrdManagerService, OrdOzonService],
  exports: [OrdManagerService],
})
export class OrdManagerModule {}
