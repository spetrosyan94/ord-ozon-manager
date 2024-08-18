import { Controller, Delete, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { GenerationSeedService } from './generation-seed.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Generation Seed')
@Controller('generation-seed')
export class GenerationSeedController {
  constructor(private readonly generationSeedService: GenerationSeedService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Метод генерирует мок-данные в БД, для начала и тестирования быстрой работы с приложением',
  })
  async generationSeeds(): Promise<void> {
    await this.generationSeedService.generationSeeds();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Метод для удаления всех данных из таблиц',
  })
  async clearAllData(): Promise<void> {
    await this.generationSeedService.clearAllData();
  }
}
