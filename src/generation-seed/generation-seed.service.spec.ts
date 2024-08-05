import { Test, TestingModule } from '@nestjs/testing';
import { GenerationSeedService } from './generation-seed.service';

describe('GenerationSeedService', () => {
  let service: GenerationSeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerationSeedService],
    }).compile();

    service = module.get<GenerationSeedService>(GenerationSeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
