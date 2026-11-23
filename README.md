# Events Management API

REST API для управління подіями та реєстрації учасників із захистом від гонки станів (Race Conditions) та кешуванням у Redis.

## Стек технологій

- **Runtime & Framework**: Node.js, Express, TypeScript (`strict: true`, без `any`)
- **ORM & Database**: TypeORM (міграції, `synchronize: false`), PostgreSQL 16
- **Caching**: Redis 7 (`ioredis`, патерн *Cache-Aside* з TTL та *Graceful Degradation*)
- **Auth & Security**: JWT (`jsonwebtoken`), `bcrypt`
- **Validation**: `zod` (валідація конфігурації `.env` та HTTP-запитів)
- **Testing**: Vitest + Supertest (інтеграційні тести з реальною тестовою БД)

---

## Архітектура та ключові рішення

1. **Шарова структура (`routes -> controllers -> services -> repositories`)**:
   - **Routes**: опис маршрутів та підключення middleware (`authenticate`, `authorizeRoles`, `validateRequest`).
   - **Controllers**: тонкий шар, що приймає провалідовані дані та повертає HTTP-відповіді.
   - **Services**: бізнес-логіка, мапінг у DTO та робота з кешем Redis.
   - **Repositories**: ізольована робота з TypeORM та транзакціями PostgreSQL.

2. **Захист від гонки (Race Condition) при реєстрації на подію**:
   - Реєстрація (`ParticipantRepository.registerWithLock`) виконується всередині транзакції з песимістичним блокуванням рядка події (`pessimistic_write` -> `SELECT ... FOR UPDATE`).
   - **Чому без блокування виникає баг?** При стандартному рівні ізоляції PostgreSQL (`READ COMMITTED`) два одночасні запити на останнє вільне місце одночасно прочитають `COUNT(*) < maxParticipants` до того, як будь-який із них виконає `INSERT` та `COMMIT`. У результаті обидва запити запишуть учасників і перевищать `maxParticipants`.
   - Із `pessimistic_write` перша транзакція блокує рядок події в таблиці `events`, а паралельна транзакція чекає звільнення замка, після чого бачить актуальну кількість учасників і повертає `409 Conflict`.
   - Додатково на рівні БД створено унікальне обмеження `UQ_participants_event_user (event_id, user_id)`, яке унеможливлює повторну реєстрацію одного користувача на ту саму подію.

3. **Кешування в Redis (Cache-Aside)**:
   - Кешуються списки подій (`GET /api/events`) та список подій користувача (`GET /api/events/my`) із TTL (`CACHE_TTL_SECONDS`).
   - Інвалідація виконується автоматично через неблокуючий `SCAN` при створенні, оновленні, видаленні події та реєстрації учасника.
   - Якщо Redis недоступний, застосунок продовжує працювати напряму з PostgreSQL без помилок.

---

## Швидкий старт

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Налаштування змінних середовища

Скопіюйте `.env.example` у `.env` та задайте власні значення секретів:

```bash
cp .env.example .env
```

### 3. Запуск PostgreSQL та Redis через Docker Compose

```bash
docker compose up -d
```

> Контейнер PostgreSQL автоматично створить основну базу `events_db` та тестову базу `events_test_db` (через скрипт `docker/init-test-db.sql`).

### 4. Запуск міграцій TypeORM

```bash
npm run migration:run
```

### 5. Запуск сервера

```bash
# Режим розробки
npm run dev

# Production збірка та запуск
npm run build
npm start
```

---

## Тестування

Інтеграційні тести використовують реальну тестову БД (`events_test_db`) і перевіряють:
- паралельні запити на реєстрацію при ліміті `maxParticipants = 1` (очікуються статуси `201` та `409`);
- заборону повторної реєстрації того самого користувача (`409`);
- відхилення запитів без JWT-токена (`401`);
- отримання списку подій користувача (`GET /api/events/my`) з пагінацією.

```bash
npm test
```

---

## Основні ендпоінти API

| Метод | Шлях | Авторизація | Опис |
|---|---|---|---|
| `POST` | `/api/auth/register` | Публічний | Реєстрація користувача |
| `POST` | `/api/auth/login` | Публічний | Логін та отримання JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Профіль поточного користувача |
| `GET` | `/api/events?limit=10&offset=0` | Публічний | Список усіх подій (з пагінацією та кешем) |
| `GET` | `/api/events/my?limit=10&offset=0` | Bearer JWT | Події, на які зареєстрований користувач |
| `GET` | `/api/events/:id` | Публічний | Деталі події за ID |
| `POST` | `/api/events` | Bearer JWT | Створення нової події |
| `PATCH` | `/api/events/:id` | Bearer JWT | Оновлення події |
| `DELETE` | `/api/events/:id` | Bearer JWT | Видалення події |
| `POST` | `/api/events/:id/register` | Bearer JWT | Реєстрація поточного користувача на подію |
