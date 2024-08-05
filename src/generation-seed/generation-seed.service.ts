import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EChannelStatus,
  EChannelTypes,
  EIntegrationStatus,
} from 'src/constants/constants';
import { Channel } from 'src/database/entities/channel/Channel.entity';
import { Integration } from 'src/database/entities/integration/Intergration.entity';
import { Payment } from 'src/database/entities/payment/Payment.entity';
import { Repository } from 'typeorm';

import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { mockCreatives } from 'src/mock/mock-creatives';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class GenerationSeedService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
  ) {}

  async seedDataChannels(): Promise<void> {
    const channelData: Partial<Channel>[] = [
      {
        name: 'Бобр Добр',
        type: EChannelTypes.YOUTUBE,
        status: EChannelStatus.RELEASED,
        views: 50000,
        link: 'https://youtube.com/BoberKurwa',
      },
      {
        name: 'Смешные утята',
        type: EChannelTypes.TELEGRAM,
        status: EChannelStatus.TO_WORK,
        views: 30000,
        link: 'https://t.me/DucksAndDucks',
      },
      {
        name: 'Санта-барбара',
        type: EChannelTypes.VK_VIDEO,
        status: EChannelStatus.RELEASED,
        views: 45000,
        link: 'https://vk-video.com/channel3',
      },
      {
        name: 'Плюс +15000',
        type: EChannelTypes.TELEGRAM,
        status: EChannelStatus.TO_WORK,
        views: 35000,
        link: 'https://t.me/plus15000',
      },
      {
        name: 'Сваты онлайн',
        type: EChannelTypes.VK_VIDEO,
        status: EChannelStatus.RELEASED,
        views: 60000,
        link: 'https://vk-video.com/SVATY_ONLINE',
      },
      {
        name: 'MR BEAST',
        type: EChannelTypes.YOUTUBE,
        status: EChannelStatus.RELEASED,
        views: 25000,
        link: 'https://youtube.com/mrbeast',
      },
    ];

    try {
      await this.channelRepository.save(channelData);
      console.log('Сиды каналов успешно созданы в БД');
    } catch (err) {
      console.error(`Ошибка при создании сидов каналов ${err.message}`, err);
    }
  }

  async seedDataPayments(): Promise<void> {
    const paymentsData: Partial<Payment>[] = [];

    for (let i = 0; i < 20; i++) {
      const payment = {
        price: Math.floor(Math.random() * 9000) + 1000,
        isNDS: Math.random() < 0.5,
      };
      paymentsData.push(payment);
    }

    try {
      await this.paymentRepository.save(paymentsData);
      console.log('Сиды оплат успешно созданы в БД');
    } catch (err) {
      console.error(`Ошибка при создании сидов оплат ${err.message}`, err);
    }
  }

  async seedDataIntegrations(): Promise<void> {
    const integrationData: Partial<Integration>[] = [];

    const channels = await this.channelRepository.find();
    const payments = await this.paymentRepository.find();

    const integrationStatus = [
      EIntegrationStatus.RELEASE,
      EIntegrationStatus.CANCEL,
    ];

    for (let i = 0; i < 20; i++) {
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const payment = payments[Math.floor(Math.random() * payments.length)];

      integrationData.push({
        channel,
        payment,
        integration_date: this.getRandomDateThisYear(),
        views: Math.floor(Math.random() * 10000) + 500, // Random views between 500 and 10000
        status:
          integrationStatus[
            Math.floor(Math.random() * integrationStatus.length)
          ],
        //   Генерация токена
        // eridToken: this.generateToken(10),
        eridToken: mockCreatives.creative[i].marker,
        comment: 'Комментарий для примера ' + i,
      });
    }

    try {
      await this.integrationRepository.save(integrationData);
      console.log('Сиды интеграций успешно созданы в БД');
    } catch (err) {
      console.error(`Ошибка при создании сидов каналов ${err.message}`, err);
    }
  }

  // Генерация токена (erid)
  private generateToken(length: number): string {
    // Создаем строку на основе случайных чисел и преобразуем ее в строку с основанием 36
    let token = '';
    while (token.length < length) {
      token += Math.random().toString(36).substring(2); // substring(2) отрезает "0."
    }

    return token.substring(0, length); //Возвращает первые length символов из сгенерированного токена, чтобы гарантировать его точную длину
  }

  // Генерация случайной даты за текущий год
  private getRandomDateThisYear(): Date {
    const now = dayjs();
    const startOfYear = now.startOf('year');
    const endOfYear = now.endOf('year');

    // Разница во времени в миллисекундах между началом года и текущей датой
    const timeRange = endOfYear.get('second') - startOfYear.get('second');

    // Генерация случайного числа в пределах этого диапазона
    const randomTime = Math.random() * timeRange;

    // Создаем новую дату, добавляя случайное время к началу года
    return startOfYear.add(randomTime, 'second').toDate();
  }

  // Генерация сидов
  async generationSeeds(): Promise<void> {
    console.log('Сиды создание...');
    await this.seedDataChannels();
    await this.seedDataPayments();
    await this.seedDataIntegrations();
    console.log('Сиды успешно созданы');
  }
}
