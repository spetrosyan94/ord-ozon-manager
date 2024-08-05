import { CreatedBy, EditedBy } from './OzonTypes';

interface Platform {
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

export interface IPlatformListOzonResponse {
  platform: Platform[];
}
