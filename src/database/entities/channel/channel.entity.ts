import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Integration } from '../integration/Intergration.entity';
import { EChannelStatus, EChannelTypes } from 'src/constants/constants';

@Entity('Channels')
export class Channel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name: string;

  @OneToMany(() => Integration, (integration) => integration.channel)
  @JoinColumn()
  integrations?: Integration[];

  @Column({ type: 'enum', enum: EChannelTypes, default: EChannelTypes.YOUTUBE })
  type: EChannelTypes;

  @Column({
    type: 'enum',
    enum: EChannelStatus,
    default: EChannelStatus.RELEASED,
  })
  status: EChannelStatus;

  @Column()
  link: string;

  @Column({ nullable: true, default: null })
  ordPlatformId?: string;

  @Column({ nullable: true, default: null })
  ordExternalPlatformId?: string;
}
