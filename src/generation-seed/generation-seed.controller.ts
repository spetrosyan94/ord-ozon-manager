import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { GenerationSeedService } from './generation-seed.service';

@Controller('generation-seed')
export class GenerationSeedController {
  constructor(private readonly generationSeedService: GenerationSeedService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async generationSeeds(): Promise<void> {
    await this.generationSeedService.generationSeeds();
  }
}
