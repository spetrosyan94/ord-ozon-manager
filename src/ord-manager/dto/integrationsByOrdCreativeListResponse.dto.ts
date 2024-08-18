import { Integration } from 'src/database/entities/integration/Intergration.entity';

export class IntegrationsByOrdCreativeListResponse extends Integration {
  creativeId: string;

  dateEndFact: string;
  dateEndPlan: string;
  dateStartFact: string;
  dateStartPlan: string;
  externalCreativeId: string;
  externalPlatformId: string;
  externalStatisticId?: string;
  moneySpent: number;
  platformId: string;
  statisticId?: string;
  unitCost: number;
  viewsCountByFact: number;
  viewsCountByInvoice: number;
  withNds: boolean;
  comment?: string;

  eridToken: string;
  viewsSum?: number;
}
