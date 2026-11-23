import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Participant } from '../../participants/entities/Participant.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ name: 'max_participants', type: 'integer' })
  maxParticipants: number;

  @OneToMany(() => Participant, (participant) => participant.event)
  participants: Participant[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
