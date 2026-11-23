import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { cacheService } from '../src/cache/CacheService';
import { HttpStatus } from '../src/common/errors/AppError';
import { AppDataSource } from '../src/db/data-source';
import { EventResponseDto } from '../src/events/dto/event.dto';
import { AuthResponseDto } from '../src/users/dto/auth.dto';

const app = createApp();

describe('Events & Participants Integration Tests', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.runMigrations();
  });

  beforeEach(async () => {
    await AppDataSource.query(
      'TRUNCATE TABLE "participants", "events", "users" RESTART IDENTITY CASCADE',
    );
    await cacheService.invalidateAllEventsCache();
  });

  afterAll(async () => {
    await cacheService.disconnect();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  const registerTestUser = async (
    username: string,
    email: string,
  ): Promise<AuthResponseDto> => {
    const res = await request(app).post('/api/auth/register').send({
      username,
      email,
      password: 'Password123!',
    });

    expect(res.status).toBe(HttpStatus.CREATED);
    return res.body as AuthResponseDto;
  };

  const createTestEvent = async (
    token: string,
    maxParticipants: number,
    name = 'Tech Conference 2026',
  ): Promise<EventResponseDto> => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name,
        description: 'Annual developer meetup',
        date: '2026-12-15T10:00:00.000Z',
        location: 'Kyiv, Ukraine',
        maxParticipants,
      });

    expect(res.status).toBe(HttpStatus.CREATED);
    return res.body as EventResponseDto;
  };

  it('rejects protected actions without an authentication token (401)', async () => {
    const createRes = await request(app).post('/api/events').send({
      name: 'Unauthorized Event',
      description: 'Should fail',
      date: '2026-12-15T10:00:00.000Z',
      location: 'Lviv',
      maxParticipants: 10,
    });
    expect(createRes.status).toBe(HttpStatus.UNAUTHORIZED);

    const registerRes = await request(app).post(
      '/api/events/00000000-0000-0000-0000-000000000000/register',
    );
    expect(registerRes.status).toBe(HttpStatus.UNAUTHORIZED);

    const myEventsRes = await request(app).get('/api/events/my');
    expect(myEventsRes.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('prevents duplicate registration by the same user for the same event (409)', async () => {
    const user = await registerTestUser('alice', 'alice@example.com');
    const event = await createTestEvent(user.accessToken, 5);

    const firstAttempt = await request(app)
      .post(`/api/events/${event.id}/register`)
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(firstAttempt.status).toBe(HttpStatus.CREATED);

    const secondAttempt = await request(app)
      .post(`/api/events/${event.id}/register`)
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(secondAttempt.status).toBe(HttpStatus.CONFLICT);
  });

  it('prevents exceeding maxParticipants under concurrent registration requests (201 and 409)', async () => {
    const user1 = await registerTestUser('user1', 'user1@example.com');
    const user2 = await registerTestUser('user2', 'user2@example.com');

    // Create an event with strictly 1 spot available
    const event = await createTestEvent(user1.accessToken, 1);

    // Fire two registration requests concurrently for the single spot
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/events/${event.id}/register`)
        .set('Authorization', `Bearer ${user1.accessToken}`),
      request(app)
        .post(`/api/events/${event.id}/register`)
        .set('Authorization', `Bearer ${user2.accessToken}`),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([HttpStatus.CREATED, HttpStatus.CONFLICT]);

    // Verify in DB that exactly 1 participant was recorded
    const countResult = await AppDataSource.query<Array<{ count: string }>>(
      'SELECT COUNT(*) as count FROM "participants" WHERE "event_id" = $1',
      [event.id],
    );
    expect(Number(countResult[0]?.count)).toBe(1);
  });

  it('returns all events the authenticated user is registered for with pagination ("my events")', async () => {
    const user = await registerTestUser('bob', 'bob@example.com');

    const event1 = await createTestEvent(user.accessToken, 10, 'Event One');
    const event2 = await createTestEvent(user.accessToken, 10, 'Event Two');
    await createTestEvent(user.accessToken, 10, 'Unregistered Event');

    await request(app)
      .post(`/api/events/${event1.id}/register`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(HttpStatus.CREATED);

    await request(app)
      .post(`/api/events/${event2.id}/register`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(HttpStatus.CREATED);

    const myEventsRes = await request(app)
      .get('/api/events/my?limit=10&offset=0')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(myEventsRes.status).toBe(HttpStatus.OK);
    expect(myEventsRes.body.total).toBe(2);
    expect(myEventsRes.body.limit).toBe(10);
    expect(myEventsRes.body.offset).toBe(0);
    expect(myEventsRes.body.items).toHaveLength(2);

    const returnedIds = (myEventsRes.body.items as EventResponseDto[]).map(
      (e) => e.id,
    );
    expect(returnedIds).toContain(event1.id);
    expect(returnedIds).toContain(event2.id);
  });
});
