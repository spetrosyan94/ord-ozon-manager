import { CreatedBy, EditedBy } from './OzonTypes';

interface GeoTarget {
  guid: string;
  name: string;
}

interface File {
  id: string;
  originalUrl: string;
  url: string;
}

interface MediaData {
  description: string;
  file: File;
  text: string;
}

export interface Creative {
  advObjectType: string;
  createdAt: string;
  createdBy: CreatedBy;
  creativeId: string;
  editedAt: string;
  editedBy: EditedBy;
  description: string;
  externalContractId: string;
  externalCreativeId: string;
  geoTargets: GeoTarget[];
  isSocialAdv: boolean;
  marker: string;
  mediaData: MediaData[];
  okvedCodes: string[];
  paymentType: string;
  targetAudienceSettings: string;
  targetLink: string;
  title: string;
  updatedAt: string;
  comment?: string;
}

export class ICreativeListOzonResponse {
  creative: Creative[];
}
