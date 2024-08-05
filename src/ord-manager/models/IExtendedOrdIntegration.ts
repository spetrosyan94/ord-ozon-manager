import { Integration } from 'src/database/entities/integration/Intergration.entity';

export interface IExtendedOrdIntegration extends Integration {
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
  missingMonths?: { start: string; end: string }[];
  viewsSum?: number;
}
