import { Test, TestingModule } from '@nestjs/testing';
import { GenerationSeedController } from './generation-seed.controller';
import { GenerationSeedService } from './generation-seed.service';

describe('GenerationSeedController', () => {
  let controller: GenerationSeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenerationSeedController],
      providers: [GenerationSeedService],
    }).compile();

    controller = module.get<GenerationSeedController>(GenerationSeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
