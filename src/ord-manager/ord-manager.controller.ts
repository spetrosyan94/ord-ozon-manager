import { Controller, Get } from '@nestjs/common';
import { OrdOzonService } from './ordOzon/ordOzon.service';
import { ICreativeListOzonResponse } from './models/ICreativeListOzonResponse';
import { IPlatformListOzonResponse } from './models/IPlatformListOzonResponse';
import { OrdManagerService } from './ord-manager.service';

@Controller('ord-manager')
export class OrdManagerController {
  constructor(
    private readonly ordManagerService: OrdManagerService,
    private readonly ordOzonService: OrdOzonService,
  ) {}

  @Get('ord-ozon/get-creative-list')
  async getCreativeList(): Promise<ICreativeListOzonResponse> {
    return this.ordOzonService.getCreativeList();
  }

  @Get('ord-ozon/get-platform-list')
  async getPlatformList(): Promise<IPlatformListOzonResponse> {
    return this.ordOzonService.getPlatformList();
  }

  @Get('get-integrations-by-ord')
  async getIntegrationsByOrdCreativeList() {
    return this.ordManagerService.getIntegrationsByOrdCreativeList();
  }

  // Метод, формирующий и отправляющий статистику интеграции в ОРД
  // а также сохраняет в БД статистику интеграциив сущности ordIntegration
  @Get('process-ord-integrations')
  async processOrdIntegrations() {
    return this.ordManagerService.processOrdIntegrations();
  }
}
