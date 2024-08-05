import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Channel } from '../channel/Channel.entity';
import { Payment } from '../payment/Payment.entity';
import { OrdIntegration } from '../ordIntegration/OrdIntegration.entity';
import { EIntegrationStatus } from '../../../constants/constants';

@Entity('Integrations')
export class Integration {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => Channel, (channel) => channel.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  channel: Channel;

  @OneToMany(
    () => OrdIntegration,
    (ordIntegration) => ordIntegration.integration,
  )
  @JoinColumn()
  ordIntegrations: OrdIntegration[];

  @ManyToOne(() => Payment, (payment) => payment.id)
  @JoinColumn()
  payment: Payment;

  @Column({ nullable: true })
  integration_date: Date;

  @Column({ nullable: true, default: 0 })
  views: number;

  @Column({
    nullable: true,
    type: 'enum',
    enum: EIntegrationStatus,
    default: EIntegrationStatus.RELEASE,
  })
  status: EIntegrationStatus;

  @Column({ nullable: true })
  eridToken?: string;

  @Column({ nullable: true })
  comment?: string;
}
