import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Integration } from '../integration/Intergration.entity';

@Entity('OrdIntegrations')
@Index('idx_integrationId', ['integration'])
@Index('idx_dateStartFact', ['dateStartFact'])
@Index('idx_dateEndFact', ['dateEndFact'])
@Index('idx_eridToken', ['eridToken'])
export class OrdIntegration {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Integration, (integration) => integration.id, {
    nullable: false,
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'integrationId',
  })
  integration: Integration;

  @Column()
  creativeId: string;

  @Column({ type: 'date' })
  dateEndFact: string;

  @Column({ type: 'date' })
  dateEndPlan: string;

  @Column({ type: 'date' })
  dateStartFact: string;

  @Column({ type: 'date' })
  dateStartPlan: string;

  @Column()
  externalCreativeId: string;

  @Column()
  externalPlatformId: string;

  @Column()
  externalStatisticId: string;

  @Column()
  moneySpent: number;

  @Column()
  platformId: string;

  @Column({ nullable: true })
  statisticId: string;

  @Column()
  unitCost: number;

  @Column()
  viewsCountByFact: number;

  @Column()
  viewsCountByInvoice: number;

  @Column({ type: Boolean, default: true })
  withNds: boolean;

  @Column({ nullable: true })
  comment?: string;

  @Column()
  eridToken: string;

  @Column({ default: 0 })
  viewsSum: number;
}
