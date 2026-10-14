/**
 * Seed script — populates the database with sample data.
 * Run with:  npm run db:seed   (after schema.sql has been applied)
 *
 * Passwords are bcrypt-hashed here (not in raw SQL) because a hash needs
 * the same bcrypt library and salt rounds as the login route to verify.
 * Every seeded user below shares the password:  Passw0rd!
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding BorrowBox sample data...');
    const passwordHash = await bcrypt.hash('Passw0rd!', 10);

    await client.query('BEGIN');

    // wipe existing data (keeps schema intact)
    await client.query('TRUNCATE reviews, condition_logs, bookings, items, categories, users RESTART IDENTITY CASCADE');

    const users = await client.query(
      `INSERT INTO users (name, email, password_hash, phone, area, role, is_active) VALUES
       ('Admin User', 'admin@borrowbox.app', $1, '0300-0000000', 'Block A', 'admin', true),
       ('Ali Khan',   'ali@borrowbox.app',   $1, '0301-1111111', 'Block B', 'member', true),
       ('Sara Ahmed', 'sara@borrowbox.app',  $1, '0302-2222222', 'Block C', 'member', true),
       ('Bilal Raza', 'bilal@borrowbox.app', $1, '0303-3333333', 'Block D', 'member', true)
       RETURNING id`,
      [passwordHash]
    );
    const [adminId, aliId, saraId, bilalId] = users.rows.map(r => r.id);

    const cats = await client.query(
      `INSERT INTO categories (name) VALUES
       ('Power Tools'), ('Home & Garden'), ('Electronics'), ('Kitchen'), ('Sports & Outdoor')
       RETURNING id`
    );
    const [powerTools, homeGarden, electronics, , sportsOutdoor] = cats.rows.map(r => r.id);

    const items = await client.query(
      `INSERT INTO items (owner_id, category_id, title, description, condition, max_days, pickup_area, image_url, is_active, price_per_day) VALUES
       ($1, $4, 'Cordless Drill 18V', '18V cordless drill with two batteries, charger and a set of bits. Please return it charged and clean.', 'good', 5, 'Block B', '', true, 0),
       ($1, $5, 'Extension Ladder 12ft', 'Aluminium extension ladder, sturdy and lightweight.', 'good', 3, 'Block B', '', true, 100),
       ($2, $6, 'HD Projector', '1080p home projector with HDMI cable included.', 'new', 7, 'Block C', '', true, 300),
       ($2, $6, 'DSLR Camera Kit', 'Entry level DSLR with 18-55mm lens and extra battery.', 'good', 4, 'Block C', '', true, 500),
       ($3, $7, 'Camping Tent (4 person)', 'Waterproof 4-person tent, easy setup, used twice.', 'good', 6, 'Block D', '', true, 200),
       ($3, $6, 'Bluetooth Speaker', 'Portable speaker, 10-hour battery life.', 'fair', 3, 'Block D', '', true, 0)
       RETURNING id`,
      [aliId, saraId, bilalId, powerTools, homeGarden, electronics, sportsOutdoor]
    );
    const drillId = items.rows[0].id;

    const booking = await client.query(
      `INSERT INTO bookings (item_id, borrower_id, start_date, end_date, status, message)
       VALUES ($1, $2, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '8 days', 'RETURNED', 'Need it for a shelf install.')
       RETURNING id`,
      [drillId, saraId]
    );
    const bookingId = booking.rows[0].id;

    await client.query(
      `INSERT INTO condition_logs (booking_id, stage, condition, note, logged_by) VALUES
       ($1, 'handover', 'good', 'Good, one scratch on the handle.', $2),
       ($1, 'return',   'good', 'Returned clean and working fine.', $2)`,
      [bookingId, aliId]
    );

    await client.query(
      `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment) VALUES
       ($1, $2, $3, 5, 'Sara returned it on time and in great condition.'),
       ($1, $3, $2, 5, 'Ali was very helpful and the drill worked perfectly.')`,
      [bookingId, aliId, saraId]
    );

    await client.query('COMMIT');
    console.log('Seed complete. Sample login: ali@borrowbox.app / Passw0rd!  (admin: admin@borrowbox.app / Passw0rd!)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
