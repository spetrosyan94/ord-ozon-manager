import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Integration } from '../integration/Intergration.entity';

@Entity('Payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Integration, (integration) => integration.payment)
  integrations: Integration[];

  @Column({ default: 0 })
  price: number;

  @Column({ default: false, type: 'bool' })
  isNDS?: boolean;
}
