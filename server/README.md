# BorrowBox API (server)

Node.js + Express + PostgreSQL REST API for BorrowBox — a community tool &
equipment lending platform.

## Tech stack
Express.js · PostgreSQL (`pg`) · JWT auth (`jsonwebtoken`) · `bcryptjs` password hashing

## 1. Install

```bash
cd server
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL credentials and a long random `JWT_SECRET`.

## 3. Create the database

```bash
createdb borrowbox
psql -U postgres -d borrowbox -f src/db/schema.sql
```

### Already have a database? (upgrade, keeps your data)

```bash
psql -U postgres -d borrowbox -f src/db/migration_pricing_gallery.sql
```

This adds per-day pricing (with chargeable weekdays), booking totals and the item photo gallery.

## 4. Seed sample data (optional but recommended)

Passwords must be bcrypt-hashed with the same library the login route uses,
so seeding is a small Node script rather than raw SQL:

```bash
npm run db:seed
```

This creates 4 users (1 admin, 3 members), 5 categories, 6 items, and one
completed booking with condition logs and reviews so the app has data to
show immediately.

**Sample logins** (password for all: `Passw0rd!`)
| Email | Role |
|---|---|
| admin@borrowbox.app | admin |
| ali@borrowbox.app | member |
| sara@borrowbox.app | member |
| bilal@borrowbox.app | member |

## 5. Run the API

```bash
npm run dev      # nodemon, auto-restart
# or
npm start
```

The API runs at `http://localhost:5000` by default.

## Project structure

```
server/
|-- src/
|   |-- config/db.js         pg Pool
|   |-- controllers/         one file per module
|   |-- middleware/          auth.js, role.js, validate.js, errorHandler.js
|   |-- routes/              one file per module
|   |-- services/            bookingService.js (business rules + status machine)
|   |-- db/                  schema.sql, seed.js
|   `-- server.js
|-- .env.example
`-- package.json
```

## Response & error convention

All responses: `{ success, data, message }`.
Errors: `400` validation · `401` not logged in · `403` not allowed ·
`404` not found · `409` date overlap or invalid status change.

All SQL uses parameterised queries (`$1, $2 ...`) — never string concatenation.

## API summary

See the FYP brief for the full endpoint table. Base path: `/api`.

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `PUT /users/me`, `DELETE /users/me`, `GET /users/:id`
- `GET/POST/PUT/DELETE /categories` (write = admin)
- `GET /items`, `GET /items/mine`, `GET /items/:id`, `GET /items/:id/availability`,
  `POST/PUT/DELETE /items/:id`
- `POST /bookings`, `GET /bookings/mine`, `GET /bookings/incoming`,
  `GET/PUT/DELETE /bookings/:id`, `PATCH /bookings/:id/status`,
  `POST /bookings/:id/reviews`
- `PUT/DELETE /reviews/:id`
- `GET /admin/stats`, `GET /admin/users`, `PATCH /admin/users/:id/status`

## Business rules implemented (see `services/bookingService.js`)

1. A member cannot borrow their own item.
2. `start_date` not in the past, `end_date >= start_date`.
3. Duration must not exceed the item's `max_days`.
4. Requested dates must not overlap an `APPROVED`/`PICKED_UP` booking of the same item.
5. Only active items owned by active users can be requested.
6. A borrower may have at most 3 open bookings at a time.
7. Only the owner can approve/reject/pickup/return; only the borrower can cancel.
8. Status can only move through the allowed transitions (409 otherwise).
9. Approving a booking auto-rejects clashing `REQUESTED` bookings — all inside one DB transaction with a row lock.
10. Reviews only after `RETURNED`, one per person per booking, rating 1–5.
11. An item with booking history is only deactivated, never hard-deleted.
12. A booking can be edited only while `REQUESTED`, deleted only when `REJECTED`/`CANCELLED`.
13. Only the author (or an admin) can edit/delete a review.
