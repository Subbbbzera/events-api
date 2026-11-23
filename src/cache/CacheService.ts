import Redis from 'ioredis';
import { PaginationQuery } from '../common/dto/pagination.dto';
import { env } from '../config/env';

class CacheService {
  private client: Redis | null = null;
  private isAvailable = false;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    try {
      this.client = new Redis(env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times: number) => {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 200, 1000);
        },
      });

      this.client.on('ready', () => {
        this.isAvailable = true;
      });

      this.client.on('error', () => {
        this.isAvailable = false;
      });

      this.client.on('end', () => {
        this.isAvailable = false;
      });

      this.client.connect().catch(() => {
        this.isAvailable = false;
      });
    } catch {
      this.client = null;
      this.isAvailable = false;
    }
  }

  public getEventsListKey(pagination: PaginationQuery): string {
    return `events:list:limit:${pagination.limit}:offset:${pagination.offset}`;
  }

  public getUserEventsKey(userId: string, pagination: PaginationQuery): string {
    return `events:user:${userId}:limit:${pagination.limit}:offset:${pagination.offset}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isAvailable) {
      return null;
    }

    try {
      const raw = await this.client.get(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public async set(
    key: string,
    value: unknown,
    ttlSeconds = env.CACHE_TTL_SECONDS,
  ): Promise<void> {
    if (!this.client || !this.isAvailable) {
      return;
    }

    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Fallback silently when Redis fails
    }
  }

  public async invalidateByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isAvailable) {
      return;
    }

    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Fallback silently when Redis fails
    }
  }

  public async invalidateEventsList(): Promise<void> {
    await this.invalidateByPattern('events:list:*');
  }

  public async invalidateUserEvents(userId?: string): Promise<void> {
    const pattern = userId ? `events:user:${userId}:*` : 'events:user:*';
    await this.invalidateByPattern(pattern);
  }

  public async invalidateAllEventsCache(): Promise<void> {
    await Promise.all([
      this.invalidateEventsList(),
      this.invalidateUserEvents(),
    ]);
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }
}

export const cacheService = new CacheService();
