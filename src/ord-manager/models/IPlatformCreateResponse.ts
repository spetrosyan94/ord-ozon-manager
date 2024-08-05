import { CreatedBy, EditedBy } from './OzonTypes';

interface IPlatformResponse {
  appName: string;
  createdAt: string;
  createdBy: CreatedBy;
  editedAt: string;
  editedBy: EditedBy;
  externalId: string;
  platformId: string;
  platformType: string;
  url: string;
  updatedAt: string;
  comment?: string;
}

export interface IPlatformCreateResponse {
  platform: IPlatformResponse;
}

export interface IPlatformsBatchCreateResponse {
  platforms: IPlatformResponse[];
}
