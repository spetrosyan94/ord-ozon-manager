import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { OrdOzonService } from './ordOzon/ordOzon.service';
import { ICreativeListOzonResponse } from './models/ICreativeListOzonResponse';
import { IPlatformListOzonResponse } from './models/IPlatformListOzonResponse';
import { OrdManagerService } from './ord-manager.service';
import { OrdIntegration } from 'src/database/entities/ordIntegration/OrdIntegration.entity';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IntegrationsByOrdCreativeListResponse } from './dto/integrationsByOrdCreativeListResponse.dto';

@ApiTags('Ord Manager')
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
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Метод получает список креативов из ОРД и сопоставить с Erid токеном интеграций в БД',
    type: IntegrationsByOrdCreativeListResponse,
    isArray: true,
  })
  async getIntegrationsByOrdCreativeList() {
    return this.ordManagerService.getIntegrationsByOrdCreativeList();
  }

  @Get('process-update-channel-platforms')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Метод обновляет недостающие рекламные платформы созданные в ОРД Озон в нашей базе данных',
  })
  async processUpdateChannelPlatforms() {
    return this.ordManagerService.processUpdateChannelPlatforms();
  }

  @Get('process-ord-integrations')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Комплексный метод, формирующий и отправляющий статистику интеграции в ОРД, а также сохраняет в БД статистику интеграции в сущности ordIntegration',
    type: OrdIntegration,
    isArray: true,
  })
  async processOrdIntegrations() {
    return this.ordManagerService.processOrdIntegrations();
  }
}
