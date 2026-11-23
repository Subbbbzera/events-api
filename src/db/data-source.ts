import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { Event } from '../events/entities/Event.entity';
import { Participant } from '../participants/entities/Participant.entity';
import { User } from '../users/entities/User.entity';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [User, Event, Participant],
  migrations: [InitialSchema1700000000000],
  subscribers: [],
});
