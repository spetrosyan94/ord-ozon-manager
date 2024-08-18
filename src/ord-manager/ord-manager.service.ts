import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { OrdIntegration } from 'src/database/entities/ordIntegration/OrdIntegration.entity';
import { In, Repository } from 'typeorm';
import { Integration } from 'src/database/entities/integration/Intergration.entity';
import { Channel } from 'src/database/entities/channel/Channel.entity';
import { OrdOzonService } from './ordOzon/ordOzon.service';
import { IExtendedOrdIntegration } from './models/IExtendedOrdIntegration';
import { IStatisticsOrdToSend } from './models/IStatisticsCreateRequest';
import { IPlatformCreateRequest } from './models/IPlatformCreateRequest';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { EIntegrationStatus, PlatformType } from 'src/constants/constants';
import { Payment } from 'src/database/entities/payment/Payment.entity';
dayjs.extend(utc);
dayjs.extend(timezone);
// dayjs.tz.setDefault('Asia/Yekaterinburg');

@Injectable()
export class OrdManagerService {
  constructor(
    @InjectRepository(OrdIntegration)
    private readonly ordIntegrationRepository: Repository<OrdIntegration>,
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly ordOzonService: OrdOzonService,
  ) {}

  // 1. Получить список креативов из ОРД и сопоставить с Erid токеном интеграций в БД
  async getIntegrationsByOrdCreativeList(): Promise<IExtendedOrdIntegration[]> {
    const startIntegrationDate = '2024-01-01T00:00:00Z'; // Отчетная дата начала фильтрации интеграций по дате выпуска
    const endIntegrationDate = dayjs()
      .subtract(1, 'month')
      .endOf('month')
      .format('YYYY-MM-DD HH:mm:ss'); // Отчетная дата окончания фильтрации интеграций (конец предыдущего месяца, интеграции вышедшие в текущем месяце не входят в выборку)

    // Получаем список креативов из ОРД Озон
    // const creativeListResponse = await this.ordOzonService.getCreativeList();

    // TODO: Получаем список mock-креативов ОРД Озон для теста
    const creativeListResponse =
      await this.ordOzonService.getMockCreativeList();

    const creatives = creativeListResponse.creative;

    // Извлекаем Erid Token и создаем карту для сопоставления External Creative ID
    const markers = creatives.map((creative) => creative.marker);

    const externalCreativeMap = new Map(
      creatives.map((creative) => [
        creative.marker,
        {
          creativeId: creative.creativeId,
          externalCreativeId: creative.externalCreativeId,
        },
      ]),
    );

    // Получаем интеграции с совпадающими Erid Tokens
    const aliasIntegration = 'integration';
    const integrations = await this.integrationRepository
      .createQueryBuilder(aliasIntegration)
      .select([
        `${aliasIntegration}.id`,
        `${aliasIntegration}.views`,
        `${aliasIntegration}.integration_date`,
        `${aliasIntegration}.status`,
        `${aliasIntegration}.comment`,
        `${aliasIntegration}.eridToken`,
        `channel.name`,
        `channel.ordPlatformId`,
        `channel.ordExternalPlatformId`,
        `channel.link`,
        `channel.type`,
      ])
      .leftJoin(`${aliasIntegration}.channel`, 'channel')
      .leftJoinAndSelect(`${aliasIntegration}.payment`, 'payment')
      .leftJoin(`payment.integrations`, 'paymentIntegrations')
      .where(`${aliasIntegration}.eridToken IN (:markers)`, { markers })
      .andWhere(`${aliasIntegration}.status = :status`, {
        status: EIntegrationStatus.RELEASE,
      })
      .andWhere(
        `CONVERT_TZ(${aliasIntegration}.integration_date, '+00:00', '+05:00') BETWEEN :startIntegrationDate AND :endIntegrationDate`,
        {
          startIntegrationDate,
          endIntegrationDate,
        },
      )
      .orderBy(`${aliasIntegration}.integration_date`, 'ASC')
      .getMany();

    // Карта для хранения уникальных интеграций по Erid Token
    const uniqueIntegrations = new Map<string, IExtendedOrdIntegration>();
    // Множество для хранения дублирующихся токенов
    const duplicateTokens = new Set<string>();

    // Обработка интеграций для нахождения уникальных токенов
    for (const integration of integrations) {
      const token = integration.eridToken;

      // Если токен еще не добавлен в карту, добавляем интеграцию
      if (!uniqueIntegrations.has(token)) {
        uniqueIntegrations.set(token, {
          ...integration,
          eridToken: token,
          creativeId: '',
          externalCreativeId: '',
          externalPlatformId: '',
          externalStatisticId: '',
          platformId: '',
          dateEndFact: null,
          dateEndPlan: null,
          dateStartFact: null,
          dateStartPlan: null,
          moneySpent: 0,
          unitCost: 0,
          viewsCountByFact: 0,
          viewsCountByInvoice: 0,
          withNds: integration?.payment?.isNDS || false,
          comment: null,
          viewsSum: 0,
        });
      } else {
        // Если токен уже есть в карте, добавляем его в множество дубликатов
        duplicateTokens.add(token);
        const existingIntegration = uniqueIntegrations.get(token);

        if (existingIntegration) {
          if (
            dayjs(integration.integration_date).isBefore(
              dayjs(existingIntegration.integration_date),
            )
          ) {
            // Сравниваем даты и оставляем интеграцию с более ранней датой выпуска integration_date
            uniqueIntegrations.set(token, {
              ...integration,
              eridToken: token,
              creativeId: '',
              externalCreativeId: '',
              externalPlatformId: '',
              externalStatisticId: '',
              platformId: '',
              dateEndFact: null,
              dateEndPlan: null,
              dateStartFact: null,
              dateStartPlan: null,
              moneySpent: 0,
              unitCost: 0,
              viewsCountByFact: 0,
              viewsCountByInvoice: 0,
              withNds: integration?.payment?.isNDS || false,
              comment: null,
              viewsSum: 0,
            });
          }
        }
      }
    }

    // Вывод сообщения об ошибке, если найдены дублирующиеся токены
    if (duplicateTokens.size > 0) {
      console.error(
        `Найдены дублирующиеся Erid Tokens интеграций: (${Array.from(
          duplicateTokens,
        ).join(', ')})`,
      );
    }

    // Формирование результата с сопоставлением External Creative ID
    const results = Array.from(uniqueIntegrations.values()).map(
      (integration) => {
        const externalCreative = externalCreativeMap.get(integration.eridToken);
        return {
          ...integration,
          creativeId: externalCreative.creativeId,
          externalCreativeId: externalCreative.externalCreativeId,
        };
      },
    );
    return results;
  }

  // 2. Синхронизация платформ из ОРД базой данных. Проверяет и добавляет отсутствующие платформы к каналам в БД
  async syncExternalPlatformsWithDatabase(): Promise<void> {
    try {
      // Получаем список платформ из ОРД Озон
      const platformListResponse = await this.ordOzonService.getPlatformList();
      const platforms = platformListResponse.platform;

      // Используем коллекцию Set для хранения уникальных URL платформ
      const platformUrlSet = new Set<string>(
        platforms.map((platform) => platform.url.trim()),
      );

      // Преобразуем Set обратно в массив
      const platformUrls = Array.from(platformUrlSet);

      // Получаем все каналы из базы данных, где URL платформы ОРД совпадает с ссылкой на канал
      const channels = await this.channelRepository.find({
        where: { link: In(platformUrls) },
      });

      console.log(
        `Найдено ${channels.length} каналов в базе данных, соответствующих URL из ОРД`,
      );

      // Карта для быстрого поиска каналов по URL
      const channelMap = new Map<string, Channel>();
      channels.forEach((channel) => {
        if (channel.link) {
          channelMap.set(channel.link.trim(), channel);
        }
      });

      // Массив для каналов, которые нужно обновить
      const channelsToUpdate: Channel[] = [];

      // Обрабатываем каждую платформу из ОРД Озон
      platforms.forEach((platform) => {
        const matchingChannel = channelMap.get(platform.url.trim());

        // Проверка на наличие канала в БД
        if (matchingChannel) {
          // Проверка, имеются ли у канала поля ordPlatformId и ordExternalPlatformId для связи с ОРД Озон,
          // если поля уже были обновлены, то пропускаем этот канал
          if (
            !matchingChannel.ordPlatformId ||
            !matchingChannel.ordExternalPlatformId
          ) {
            // Обновляем поля ordPlatformId и ordExternalPlatformId
            matchingChannel.ordPlatformId = platform.platformId;
            matchingChannel.ordExternalPlatformId = platform.externalId;

            // Добавляем канал в массив для обновления
            channelsToUpdate.push(matchingChannel);
          }
        } else {
          console.log(
            `Платформа с URL ${platform.url} не найдена в базе данных`,
          );
        }
      });

      console.log(
        `Подготовлено ${channelsToUpdate.length} каналов для обновления в БД`,
      );
      // return channelsToUpdate;

      // Сохраняем обновленные каналы в базе данных
      if (channelsToUpdate.length > 0) {
        // await this.channelRepository.save(channelsToUpdate);
        await this.channelRepository.manager.transaction(
          async (transactionalEntityManager) => {
            await transactionalEntityManager.save(Channel, channelsToUpdate);
          },
        );
        console.log(
          `Обновлено ${channelsToUpdate.length} каналов в базе данных`,
        );
      } else {
        console.log(`Нет обновлений каналов в базе данных`);
      }
    } catch (err) {
      console.error(
        'Ошибка при обновлении ОРД платформы каналов в базе данных',
        err,
      );
      throw new InternalServerErrorException(
        `Ошибка при обновлении ОРД платформы каналов в базе данных`,
        err.message,
      );
    }
  }

  // // 3. Добавляем площадку канала объекту статистики интеграций platformId и externalPlatformId
  async addExternalPlatformIdInBatch(
    integrations: IExtendedOrdIntegration[] | Integration[],
  ): Promise<IExtendedOrdIntegration[]> {
    const channelsToSave: Channel[] = []; // Массив каналов, которые нужно сохранить в базе данных после получения ответов от ОРД Озон
    const platformRequestData: IPlatformCreateRequest[] = []; // Массив содержит данные для платформ, которые будут отправлены в запросе к ОРД Озон
    const urlToChannelMap = new Map<string, Channel>(); // Карта используется для сопоставления URL каналов и объектов Channel, что позволяет корректно обновлять каналы после получения ответов от ОРД Озон
    const uniqueUrls = new Set<string>(); // Уникальные URL-адреса, чтобы избежать дублирования запросов на создание платформ
    const errorLinksChannels = new Set<string>();
    // Карта для хранения данных платформы канала в процессе итерации,
    // чтобы не создавать повторяющиеся платформы
    const processedChannels = new Map<
      number,
      { externalPlatformId: string; platformId: string }
    >();

    // Собираем данные платформ для отправки и каналы для обработки
    integrations.forEach((integration) => {
      const channel = integration.channel;
      const platformUrl = channel.link.trim();

      if (!channel) {
        throw new NotFoundException(
          `Не найден канал интеграции ${integration.id}`,
        );
      }

      // Проверка, существует ли площадка в ОРД и не была ли она уже обработана
      if (
        !channel.ordPlatformId &&
        !channel.ordExternalPlatformId &&
        !uniqueUrls.has(platformUrl)
      ) {
        // Формируем данные платформы для отправки в ОРД Озон
        const platformData = {
          appName: `${channel.name}. ${channel.type.toUpperCase()}`,
          platformType: PlatformType.PLATFORM_TYPE_SITE,
          url: platformUrl,
          externalPlatformId: uuidv4(),
        };

        uniqueUrls.add(platformUrl); // Добавляем URL в Set для создания уникальных платформ без дубликатов
        platformRequestData.push(platformData); // Добавляем данные платформы в массив для отправки в ОРД Озон
        urlToChannelMap.set(platformUrl, channel); // Добавляем канал в Map для обработки
      }
    });

    console.log(
      `Подготовлено ${platformRequestData.length} новых площадок каналов для отправки в ОРД Озон`,
    );
    // return platformRequestData;

    // Проверяем корректность URL перед отправкой
    platformRequestData.forEach((platformData) => {
      if (
        !platformData.url.startsWith('https://') &&
        !platformData.url.startsWith('http://')
      ) {
        errorLinksChannels.add(platformData.url);
      }
    });

    if (errorLinksChannels.size > 0) {
      console.error(
        `Некорректные URL площадок: ${Array.from(errorLinksChannels).join(
          ', ',
        )}`,
      );
      throw new BadRequestException(
        `Некорректные URL площадок: ${Array.from(errorLinksChannels).join(
          ', ',
        )}`,
      );
    }

    // Просмотр, есть ли новые платформы каналов для добавления их в ОРД Озон
    // return platformRequestData;

    // Проверка, есть ли новые платформы каналов для добавления их в ОРД Озон
    if (platformRequestData.length > 0) {
      try {
        // Отправляем запрос на создание площадок в ОРД Озон
        const createdPlatforms =
          await this.ordOzonService.createPlatfromsBatch(platformRequestData);

        // Обрабатываем результат и сохраняем данные в базу
        createdPlatforms.platforms.forEach((externalPlatformId) => {
          const channel = urlToChannelMap.get(externalPlatformId.url);

          if (!channel) return;

          // Сохраняем идентификаторы платформы в канале
          channel.ordExternalPlatformId = externalPlatformId.externalId;
          channel.ordPlatformId = externalPlatformId.platformId;
          channelsToSave.push(channel); // Добавляем канал в массив для сохранения в БД

          // Сохраняем данные платформы в Map для последующего использования
          processedChannels.set(channel.id, {
            externalPlatformId: externalPlatformId.externalId,
            platformId: externalPlatformId.platformId,
          });
        });
      } catch (err) {
        throw new InternalServerErrorException(
          `Ошибка при создании новых платформ канала в ОРД Озон: ${err}`,
        );
      }
    }

    // Обновляем интеграции с новыми данными платформ
    const updatedIntegrations = integrations.map((integration) => {
      const channel = integration.channel;

      if (!channel) return;

      const platformData = processedChannels.get(channel.id);
      // Если платформа была обработана, используем сохраненные данные
      if (platformData) {
        integration.externalPlatformId = platformData.externalPlatformId;
        integration.platformId = platformData.platformId;
      } else {
        // Если платформа уже существует в БД, используем её текущие идентификаторы
        integration.externalPlatformId = channel.ordExternalPlatformId;
        integration.platformId = channel.ordPlatformId;
      }

      return integration;
    });

    // Используем транзакцию для сохранения всех новых площадок в БД разом
    if (channelsToSave.length > 0) {
      await this.channelRepository.manager
        .transaction(async (transactionalEntityManager) => {
          await transactionalEntityManager.save(Channel, channelsToSave);
        })
        .catch((err) => {
          throw new InternalServerErrorException(
            'При сохранении новых площадок в БД произошла ошибка',
            err.message,
          );
        });
    }

    return updatedIntegrations;
  }

  // 4. Метод для расчета недостающих месяцев у статистики интеграци в ОРД
  async calculateMissingMonths(
    integrations: IExtendedOrdIntegration[],
  ): Promise<IExtendedOrdIntegration[]> {
    const startDate = dayjs('2023-09-01T00:00:00Z').startOf('month'); // Дата начала учета статистики
    const prevMonthDate = dayjs().subtract(1, 'month').endOf('month'); // Крайняя отчетная дата статистики за предыдущий месяц
    const currentMonthStart = dayjs().startOf('month'); // Начало текущего месяца для исключения его из обработки

    // Получаем существующую статистику из БД в заданном диапазоне дат
    const existingStatistics = await this.ordIntegrationRepository
      .createQueryBuilder('ordIntegration')
      .leftJoinAndSelect('ordIntegration.integration', 'integration')
      .where(
        `
      ordIntegration.dateStartFact BETWEEN :startDate AND :endDate
      `,
        {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: prevMonthDate.format('YYYY-MM-DD'),
        },
      )
      .getMany();

    // Создаем карту для быстрого поиска существующей статистики по ключу
    // Ключ составляется из ID интеграции и года-месяца даты начала планируемого периода
    const existingStatisticsMap = existingStatistics.reduce(
      (map, stat) => {
        const key = `${stat.integration.id}-${dayjs(stat.dateStartFact).format(
          'YYYY-MM',
        )}`;
        map[key] = stat;
        return map;
      },
      {} as Record<string, OrdIntegration>,
    );

    // Обрабатываем каждую интеграцию, чтобы определить недостающие месяцы
    const allMissingMonthsIntegrations: IExtendedOrdIntegration[] = [];

    for (const integration of integrations) {
      // Статистика интеграции за отчетный месяц
      const integrationDate = dayjs(integration.integration_date).startOf(
        'month',
      );

      const monthsDiff = prevMonthDate.diff(integrationDate, 'month');

      // Проходим по каждому месяцу с даты выпуска до крайнего месяца перед текущим
      for (let i = 0; i <= monthsDiff; i++) {
        const monthDate = integrationDate.add(i, 'month');

        // Проверяем, что рассматриваемый месяц находится после даты начала учета статистики и до начала текущего месяца
        if (
          monthDate.isAfter(startDate) &&
          monthDate.isBefore(currentMonthStart)
        ) {
          // Формируем ключ для проверки существования статистики за рассматриваемый месяц
          const key = `${integration.id}-${monthDate.format('YYYY-MM')}`;

          // Если статистика за рассматриваемый месяц не найдена, добавляем его в массив недостающих месяцев
          if (!existingStatisticsMap[key]) {
            const isInitialMonth = i === 0;

            const newIntegration: IExtendedOrdIntegration = {
              ...integration,
              dateStartFact: isInitialMonth
                ? dayjs(integration.integration_date).format('YYYY-MM-DD')
                : monthDate.startOf('month').format('YYYY-MM-DD'),
              dateEndFact: monthDate.endOf('month').format('YYYY-MM-DD'),
              dateStartPlan: isInitialMonth
                ? dayjs(integration.integration_date).format('YYYY-MM-DD')
                : monthDate.startOf('month').format('YYYY-MM-DD'),
              dateEndPlan: monthDate.endOf('month').format('YYYY-MM-DD'),
            };

            allMissingMonthsIntegrations.push(newIntegration);
          }
        }
      }
    }

    return allMissingMonthsIntegrations;
  }

  // 5. Метод для расчета moneySpent и unitCost для интеграций за текущий месяц
  async calculateCost(
    integrations: IExtendedOrdIntegration[],
  ): Promise<IExtendedOrdIntegration[]> {
    // Множество ID интеграций, у которых в оплатах отсутствует price сумма стоимости приложения
    const missingPriceIds = new Set<number>();

    for (const integration of integrations) {
      // Если отсутствует сумма стоимости приложения в оплате, то пропускаем итерацию
      if (!integration?.payment?.price) {
        missingPriceIds.add(integration.id);

        integration.moneySpent = 0;
        integration.unitCost = 0;
        continue;
      }

      const monthDate = dayjs(integration.dateStartFact);
      const monthsSinceIntegration = monthDate.diff(
        dayjs(integration.integration_date).startOf('month'),
        'month',
      );

      // Если это первый месяц выпуска интеграции,
      // то устанавливаем стоимость из оплат
      // иначе все последующие месяцы, то устанавливаем стоимость в 0
      if (monthsSinceIntegration === 0) {
        const price = integration?.payment?.price;

        integration.moneySpent = price;
        integration.unitCost = price;
      } else {
        integration.moneySpent = 0;
        integration.unitCost = 0;
      }
    }

    if (missingPriceIds.size > 0) {
      console.error(
        `Интеграции с отсутствующей суммой стоимости приложения в оплате ID: (${Array.from(
          missingPriceIds,
        ).join(', ')})`,
      );
    }

    return integrations;
  }

  // TODO: Метод генерации просмотров требует доработки.
  // В идеале сделать алгоритм, который берет общую сумму просмотров интеграции,
  // и делит ее на количество интеграций, причем генерирует число просмотров для каждой интеграции в пределах общей суммы.

  // 6. Метод для расчета просмотров интеграций viewsFact и viewsPlan
  async calculateIntegrationViews(
    integrations: IExtendedOrdIntegration[],
  ): Promise<IExtendedOrdIntegration[]> {
    // const currentDate = dayjs(); // Текущая дата

    // Множество ID интеграций, у которых в отсутствует просмотры views
    const missingViewsIds = new Set<number>();
    const negativeViewsIds = [];

    for (const integration of integrations) {
      // Пропустить текущую интеграцию, если у нее отсутствуют просмотры
      if (!integration.views) {
        missingViewsIds.add(integration.id);

        integration.viewsCountByFact = 0;
        integration.viewsCountByInvoice = 0;
        continue;
      }

      const reportMonthDate = dayjs(integration.dateStartFact);
      // Новые просмотры интеграции за месяц
      let viewsCount = 0;

      // Рассчитываем даты для проверки за предыдущий месяц
      const previousMonthStart = reportMonthDate
        .subtract(1, 'month')
        .startOf('month');
      const previousMonthEnd = reportMonthDate
        .subtract(1, 'month')
        .endOf('month');

      // Проверяем, есть ли данные за предыдущий месяц
      const previousMonthStatistic = await this.ordIntegrationRepository
        .createQueryBuilder('ordIntegration')
        .leftJoin('ordIntegration.integration', 'integration')
        .where(
          `
      ordIntegration.dateStartFact BETWEEN :startDate AND :endDate
      `,
          {
            startDate: previousMonthStart.format('YYYY-MM-DD'),
            endDate: previousMonthEnd.format('YYYY-MM-DD'),
          },
        )
        .andWhere(`integrationId = :id`, { id: integration.id })
        .getOne();

      if (previousMonthStatistic) {
        // Если данные за прошлый месяц существуют, используем разницу между текущими просмотрами и viewsSum просмотрами предыдущего месяца
        viewsCount = integration.views - previousMonthStatistic.viewsSum;

        // Проверка, если интеграция имеет отрицательные просмотры
        if (viewsCount < 0) {
          negativeViewsIds.push(integration.id);
        }
      } else {
        // Если записи за прошлый месяц нет, а интеграция вышла больше месяца назад
        const integrationStartDate = dayjs(
          integration.integration_date,
        ).startOf('month');
        const integrationStartFact = dayjs(integration.dateStartFact);

        const monthsSinceIntegration = integrationStartFact.diff(
          integrationStartDate,
          'month',
        );

        console.log('КОЛИЧЕСТВО МЕСЯЦЕВ СТАЛО', monthsSinceIntegration);

        if (monthsSinceIntegration > 0) {
          viewsCount = 0;
        } else {
          viewsCount = integration.views; // Все просмотры за первый месяц
        }

        // viewsCount = integration.views;
      }

      integration.viewsCountByFact = viewsCount;
      integration.viewsCountByInvoice = viewsCount;
      integration.viewsSum = integration.views;
    }

    if (negativeViewsIds.length > 0) {
      console.error(
        `Имеются отрицательные просмотры интеграции ID: (${Array.from(
          negativeViewsIds,
        ).join(', ')})`,
      );
      throw new BadRequestException(
        `Имеются отрицательные просмотры интеграции ID: (${Array.from(
          negativeViewsIds,
        ).join(', ')})`,
      );
    }

    if (missingViewsIds.size > 0) {
      console.error(
        `Отсутствует кол-во просмотров интеграции ID: (${Array.from(
          missingViewsIds,
        ).join(', ')})`,
      );
    }

    return integrations;
  }

  // 7. Метод для создания объекта статистики OrdIntegration, cохраняет экземпляры OrdIntegration в БД
  // и отправляет объекты статистики в ОРД
  async createStatisticsObjects(integrations: IExtendedOrdIntegration[]) {
    const statisticsObjects: OrdIntegration[] = [];
    const statisticsToSend: IStatisticsOrdToSend[] = [];

    for (const integration of integrations) {
      // Генерируем UUID для каждой интеграции
      integration.externalStatisticId = await uuidv4();

      const ordIntegration = new OrdIntegration();
      ordIntegration.integration = integration;
      ordIntegration.creativeId = integration.creativeId;
      ordIntegration.dateEndFact = integration.dateEndFact;
      ordIntegration.dateEndPlan = integration.dateEndPlan;
      ordIntegration.dateStartFact = integration.dateStartFact;
      ordIntegration.dateStartPlan = integration.dateStartPlan;
      ordIntegration.externalCreativeId = integration.externalCreativeId;
      ordIntegration.externalPlatformId = integration.externalPlatformId;
      ordIntegration.externalStatisticId = integration.externalStatisticId;
      // ordIntegration.statisticId = integration.statisticId || null;
      ordIntegration.moneySpent = integration.moneySpent;
      ordIntegration.platformId = integration.platformId;
      ordIntegration.unitCost = integration.unitCost;
      ordIntegration.viewsCountByFact = integration.viewsCountByFact;
      ordIntegration.viewsCountByInvoice = integration.viewsCountByInvoice;
      ordIntegration.withNds = integration.withNds;
      ordIntegration.comment = integration.comment || null;
      ordIntegration.eridToken = integration.eridToken;
      ordIntegration.viewsSum = integration.viewsSum;

      // Добавляем объект статистики в массив
      statisticsObjects.push(ordIntegration);

      // Формируем объект для отправки в API ОРД
      const statisticsToSendObject: IStatisticsOrdToSend = {
        creativeId: integration.creativeId,
        dateEndFact: integration.dateEndFact,
        dateEndPlan: integration.dateEndPlan,
        dateStartFact: integration.dateStartFact,
        dateStartPlan: integration.dateStartPlan,
        externalCreativeId: integration.externalCreativeId,
        externalPlatformId: integration.externalPlatformId,
        externalStatisticId: integration.externalStatisticId,
        // statisticId: integration.statisticId || null,
        moneySpent: integration.moneySpent.toString(),
        platformId: integration.platformId,
        unitCost: integration.unitCost.toString(),
        viewsCountByFact: integration.viewsCountByFact.toString(),
        viewsCountByInvoice: integration.viewsCountByInvoice.toString(),
        withNds: integration.withNds,
        comment: integration.comment || null,

        // Необязательное поле, нужно для тестирования. Проверить, какие интеграции отправляются в API ОРД
        // integrationId: integration.id,
      };

      statisticsToSend.push(statisticsToSendObject);
    }

    // TODO: При тестировании отправки запросов, можно увидеть, что будет отправлено в ОРД Озон, а что сохранено в локальную БД
    // return statisticsObjects; // То что будет сохранено в БД
    // return statisticsToSend; // То что будет отправлено в ОРД Озон

    // Внутри транзакции сначала отправляем данные в API ОРД, затем сохраняем их в БД
    return this.ordIntegrationRepository.manager
      .transaction(async (transactionalEntityManager) => {
        // TODO: Для проверки работы метода в тестовом режиме, метод отправки в Озон createStatistics можно закомментировать, так как чаще всего будет ошибка(отсутствуют креативы в ОРД Озон и прочее)

        // Отправляем созданный объект статистики в API ОРД
        await this.ordOzonService.createStatistics(statisticsToSend);

        console.log(
          `Отправлено в ОРД Озон ${statisticsToSend.length} объектов статистики`,
        );

        // Сохраняем список объектов статистики в БД
        return await transactionalEntityManager.save(
          OrdIntegration,
          statisticsObjects,
        );
      })
      .catch((err) => {
        throw new InternalServerErrorException(
          'При отправке и сохранении объектов статистики ОРД интеграций в БД произошла ошибка',
          err.message,
        );
      });
  }

  // Общий метод для обработки,преобразования и сохранения преобразованных данных интеграций в БД
  async processOrdIntegrations(): Promise<OrdIntegration[]> {
    // Шаг 1. Получить список креативов из ОРД и сопоставить с Erid токеном интеграций в БД
    const integrations = await this.getIntegrationsByOrdCreativeList();

    // return integrations;

    // Шаг 2. Синхронизация платформ из ОРД базой данных. Добавление отсутствующих платформ к каналам в БД
    await this.syncExternalPlatformsWithDatabase();

    // // Шаг 3: Добавляем площадку канала интеграциямplatformId и externalPlatformId
    const integrationsWithPlatformId =
      await this.addExternalPlatformIdInBatch(integrations);

    // return integrationsWithPlatformId;

    // // Шаг 4.  Метод для расчета недостающих месяцев у статистики интеграци в ОРД
    const integrationsWithMissingMonths = await this.calculateMissingMonths(
      integrationsWithPlatformId,
    );

    // return integrationsWithMissingMonths;

    // Шаг 5. Метод для расчета totalCost и unitCost для интеграций за текущий месяц
    const integrationsWithCosts = await this.calculateCost(
      integrationsWithMissingMonths,
    );

    // return integrationsWithCosts;

    // Шаг 6. Метод для расчета просмотров интеграций viewsFact и viewsPlan
    const integrationsWithViews = await this.calculateIntegrationViews(
      integrationsWithCosts,
    );

    // return integrationsWithViews;

    // Шаг 7. Метод для создания объекта и отправки статистики OrdIntegration в ОРД
    return await this.createStatisticsObjects(integrationsWithViews);
  }

  // Используем декоратор @Cron для задания расписания отправки статистики в API ОРД
  @Cron('0 6 2 * *', { timeZone: 'Europe/Moscow' })
  async handleCronCreateOrdStatistics() {
    console.log(
      'Запуск отправки статистики в ОРД processOrdIntegrations по крону',
    );

    try {
      await this.processOrdIntegrations();
      console.log(
        `Отправка статистики в ОРД processOrdIntegrations по крону успешно завершена`,
      );
    } catch (err) {
      console.log(
        'Ошибка при отправке статистики в ОРД processOrdIntegrations',
        err,
      );
    }
  }

  // Обновление платформы канала в ОРД
  async updatePlatformInOrd(data: IPlatformCreateRequest) {
    await this.ordOzonService.createPlatfrom(data);
  }

  async getIntegrationsToAddChannelPlatform(): Promise<Integration[]> {
    const integrations = await this.integrationRepository.find({
      where: { status: EIntegrationStatus.RELEASE },
      relations: { channel: true },
    });

    return integrations;
  }

  async processUpdateChannelPlatforms(): Promise<IExtendedOrdIntegration[]> {
    // Шаг 1. Получить список интеграций из БД со статусом "В график"
    const integrations = await this.getIntegrationsToAddChannelPlatform();

    // Шаг 2. Синхронизация платформ из ОРД базой данных. Добавление отсутствующих платформ из ОРД к каналам в БД
    await this.syncExternalPlatformsWithDatabase();

    // // Шаг 3: Добавляем площадку канала интеграциям platformId и externalPlatformId
    const integrationsWithPlatformId =
      await this.addExternalPlatformIdInBatch(integrations);

    return integrationsWithPlatformId;
  }

  @Cron('0 8 * * *', { timeZone: 'Europe/Moscow' })
  async handleCronUpdateChannelPlatforms(): Promise<void> {
    console.log(
      `Обновление платформы канала в ОРД processUpdateChannelPlatforms по крону`,
    );

    try {
      await this.processUpdateChannelPlatforms();
      console.log(
        'Обновление платформы канала в ОРД processUpdateChannelPlatforms по крону успешно завершено',
      );
    } catch (err) {
      console.error(
        'Ошибка при обновлении платформы каналов в ОРД processUpdateChannelPlatforms',
        err,
      );
    }
  }
}
