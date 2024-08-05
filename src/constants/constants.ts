export const apiUrlOzon = 'https://ord-sandbox.ozon.ru/api';

export const enum PlatformType {
  PLATFORM_TYPE_INVALID = 'PLATFORM_TYPE_INVALID',
  PLATFORM_TYPE_SITE = 'PLATFORM_TYPE_SITE',
  PLATFORM_TYPE_APP = 'PLATFORM_TYPE_APP',
  PLATFORM_TYPE_SYSTEM = 'PLATFORM_TYPE_SYSTEM',
}

export enum EIntegrationStatus {
  CANCEL = 'cancel',
  RELEASE = 'release',
}

export enum EChannelStatus {
  TO_WORK = 'to_work',
  RELEASED = 'released',
}

export enum EChannelTypes {
  YOUTUBE = 'youtube',
  TELEGRAM = 'telegram',
  VK_VIDEO = 'vk_video',
}

export const enum EPaymentStatus {
  CANCEL = 'cancel',
  COMPLETED = 'completed',
}
