import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import {
  Creative,
  ICreativeListOzonResponse,
} from '../models/ICreativeListOzonResponse';
import { IPlatformListOzonResponse } from '../models/IPlatformListOzonResponse';

import { IPlatformCreateRequest } from '../models/IPlatformCreateRequest';
import {
  IPlatformCreateResponse,
  IPlatformsBatchCreateResponse,
} from '../models/IPlatformCreateResponse';
import {
  IStatisticsCreateRequest,
  IStatisticsOrdToSend,
} from '../models/IStatisticsCreateRequest';
import { apiUrlOzon } from 'src/constants/constants';
import { mockCreatives } from 'src/mock/mock-creatives';

@Injectable()
export class OrdOzonService {
  constructor() {}

  // Получение списка mock креативов для тестовой проверки работы сервиса
  async getMockCreativeList(): Promise<ICreativeListOzonResponse> {
    return mockCreatives;
  }

  // Получение списка креативов
  async getCreativeList(): Promise<ICreativeListOzonResponse> {
    const requestBody = {
      cursor: {
        externalId: '',
        updatedAt: {},
      },
      orderBy: 'ASC',
      pageSize: 100000,
    };

    try {
      const response = await axios.post(
        `${apiUrlOzon}/external/creative/list`,
        requestBody,
        {
          headers: {
            Authorization: 'Bearer ' + process.env.OZON_ORD_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      const allCreatives = response.data.creative as Creative[];

      return {
        creative: allCreatives,
      } as ICreativeListOzonResponse;
    } catch (err) {
      console.error('Ошибка при получении списка креативов из ОРД Ozon', err);
      throw new NotFoundException(
        'Ошибка при получении списка креативов из ОРД Ozon',
        err.message,
      );
    }
  }

  async getPlatformList(): Promise<IPlatformListOzonResponse> {
    const requestBody = {
      cursor: {
        externalId: '',
        updatedAt: {},
      },
      orderBy: 'ASC',
      pageSize: 10000,
    };

    try {
      const response = await axios.post(
        `${apiUrlOzon}/external/platform/list`,
        requestBody,
        {
          headers: {
            Authorization: 'Bearer ' + process.env.OZON_ORD_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data as IPlatformListOzonResponse;
    } catch (err) {
      console.error('Ошибка при получении списка площадок из ОРД Ozon', err);
      throw new NotFoundException(
        'Ошибка при получении списка площадок из ОРД Ozon',
        err.message,
      );
    }
  }

  // Создание площадки канала
  async createPlatfrom(
    platformData: IPlatformCreateRequest,
  ): Promise<IPlatformCreateResponse> {
    const requestBody = {
      ...platformData,
    };

    try {
      const response = await axios.post(
        `${apiUrlOzon}/external/platform`,
        requestBody,
        {
          headers: {
            Authorization: 'Bearer ' + process.env.OZON_ORD_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data as IPlatformCreateResponse;
    } catch (err) {
      console.error('Ошибка при создании площадки канала в ОРД Ozon', err);
      throw new NotFoundException(
        'Ошибка при создании площадки канала в ОРД Ozon',
        err.message,
      );
    }
  }

  // Создание площадки канала, где передается массив площадок
  async createPlatfromsBatch(
    platformData: IPlatformCreateRequest[],
  ): Promise<IPlatformsBatchCreateResponse> {
    const requestBody = {
      platforms: platformData,
    };

    try {
      const response = await axios.post(
        `${apiUrlOzon}/external/platform/batch`,
        requestBody,
        {
          headers: {
            Authorization: 'Bearer ' + process.env.OZON_ORD_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data as IPlatformsBatchCreateResponse;
    } catch (err) {
      console.error('Ошибка при создании площадок канала в ОРД Ozon', err);
      throw new NotFoundException(
        'Ошибка при создании площадок канала в ОРД Ozon',
        err.message,
      );
    }
  }

  // Создание статистики креатива и интеграции
  async createStatistics(
    statisticsData: IStatisticsOrdToSend[],
  ): Promise<void> {
    const requestBody: IStatisticsCreateRequest = {
      statistics: statisticsData,
    };

    try {
      const response = await axios.post(
        `${apiUrlOzon}/external/v2/statistic`,
        requestBody,
        {
          headers: {
            Authorization: 'Bearer ' + process.env.OZON_ORD_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (err) {
      console.error('Ошибка при отправке статистики в ОРД Ozon', err);
      throw new NotFoundException(
        'Ошибка при отправке статистики в ОРД Ozon',
        err.message,
      );
    }
  }
}
