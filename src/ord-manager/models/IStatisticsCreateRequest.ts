export interface IStatisticsOrdToSend {
  creativeId: string;
  dateEndFact: string;
  dateEndPlan: string;
  dateStartFact: string;
  dateStartPlan: string;
  externalCreativeId: string;
  externalPlatformId: string;
  externalStatisticId: string;
  moneySpent: string;
  platformId: string;
  statisticId?: string;
  unitCost: string;
  viewsCountByFact: string;
  viewsCountByInvoice: string;
  withNds: boolean;
  comment?: string;

  integrationId?: number;
}

export interface IStatisticsCreateRequest {
  statistics: IStatisticsOrdToSend[];
}
