📦 BorrowBox

A community tool & equipment lending platform. Neighbours list items they own, and others request to borrow them for specific dates. Owners can lend for free or set a daily price, and every handover and return is logged with the item's condition.

Built with React + Vite (client) and Node.js + Express + PostgreSQL (server).

✨ Features
Accounts & roles – register, log in (JWT), member and admin roles
Browse & search – search, category and condition filters, sort by rating, pagination, availability by date range
Item listings – add, edit, deactivate or delete your items
Flexible pricing – set a price per day (or 0 for free) and choose which weekdays are charged, for example weekends only. Borrowers see a live total before they request
Photo gallery – a main photo plus up to 10 extra photos showing the item from different angles
Full-screen photo viewer – click a photo on the item page to enlarge it, with arrow keys and Esc support
Availability calendar – booked dates are blocked so double bookings can't happen
Booking workflow – REQUESTED → APPROVED → PICKED_UP → RETURNED (plus reject / cancel), with owner and borrower permissions
Condition logs – item condition recorded at handover and return
Reviews & trust score – rate each other after a return; public profiles show ratings
Admin panel – manage users, categories and see platform statistics
🛠 Tech stack
Layer	Technology
Frontend	React 18, React Router 6, Axios, Vite, plain CSS
Backend	Node.js, Express, pg, JWT, bcryptjs, Multer (image uploads)
Database	PostgreSQL
📁 Project structure
BorrowBox/
├── client/     React + Vite frontend
└── server/     Express API, database schema and seed data
🚀 Getting started
Prerequisites
Node.js 18 or newer
PostgreSQL 13 or newer
1. Clone the repo
bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
2. Set up the database

Create an empty PostgreSQL database (for example borrowbox) using pgAdmin or:

bash
createdb borrowbox
3. Set up the server
bash
cd server
npm install
cp .env.example .env      # on Windows PowerShell: copy .env.example .env

Edit server/.env and set your database name, user, password and a long random JWT_SECRET.

Create the tables and add sample data:

bash
psql -U postgres -d borrowbox -f src/db/schema.sql
npm run db:seed

No psql on Windows? Run the schema through Node instead:

powershell
node -e "require('dotenv').config(); const fs=require('fs'); const pool=require('./src/config/db'); pool.query(fs.readFileSync('src/db/schema.sql','utf8')).then(()=>{console.log('Schema created'); return pool.end();}).catch(e=>{console.error('Failed:', e.message); process.exit(1);})"

Or open schema.sql in pgAdmin's Query Tool and run it.

Start the API:

bash
npm run dev

It runs at http://localhost:5000.

4. Set up the client

In a second terminal:

bash
cd client
npm install
cp .env.example .env      # on Windows PowerShell: copy .env.example .env
npm run dev

Open http://localhost:5173.

Sample logins

All seeded users share the password Passw0rd!

Email	Role
admin@borrowbox.app	Admin
ali@borrowbox.app	Member
sara@borrowbox.app	Member
bilal@borrowbox.app	Member

⚠️ npm run db:seed wipes existing data. Only run it on a fresh or disposable database.

Upgrading an existing database

If you already have a database from an earlier version, add pricing and gallery support without losing data:

bash
psql -U postgres -d borrowbox -f src/db/migration_pricing_gallery.sql
🔐 Environment variables

server/.env

Variable	Description
PORT	API port (default 5000)
PGHOST, PGPORT	PostgreSQL host and port
PGDATABASE, PGUSER, PGPASSWORD	PostgreSQL database and credentials
JWT_SECRET	Long random string used to sign login tokens
JWT_EXPIRES_IN	Token lifetime, e.g. 7d
CLIENT_ORIGIN	Frontend URL allowed by CORS

client/.env

Variable	Description
VITE_API_URL	API base URL (default http://localhost:5000/api)
🧭 Pages
Route	Page	Access
/	Browse and search items	Public
/items/:id	Item details, gallery, calendar, booking form	Public (log in to book)
/login, /register	Authentication	Public
/dashboard	My items, my borrowings, incoming requests	Member
/items/new, /items/:id/edit	Add or edit an item	Member
/bookings/:id	Booking details, condition log, reviews	Participants
/profile/:id	Public profile and reviews	Public
/admin	Users, categories, statistics	Admin
📜 Business rules
You can't borrow your own item
Start date can't be in the past, and the end date must be on or after the start date
A booking can't exceed the item's maximum lending days
Dates can't overlap an approved or picked-up booking for the same item
A borrower can have at most 3 open bookings at a time
Only the owner can approve, reject, mark picked up or mark returned. Only the borrower can cancel
Approving a booking automatically rejects clashing requests, inside one database transaction
Reviews are only allowed after an item is returned, once per person per booking
Items with booking history are deactivated instead of deleted
The booking price is calculated on the server from the item's daily rate and charged weekdays
🔌 API overview

Base path /api. All responses use the shape { success, data, message }.

Auth: POST /auth/register, POST /auth/login, GET /auth/me
Users: PUT /users/me, DELETE /users/me, GET /users/:id
Categories: GET /categories (create, update and delete are admin only)
Items: GET /items, GET /items/mine, GET /items/:id, GET /items/:id/availability, POST /items, PUT /items/:id, DELETE /items/:id, POST /items/upload-image
Bookings: POST /bookings, GET /bookings/mine, GET /bookings/incoming, GET/PUT/DELETE /bookings/:id, PATCH /bookings/:id/status, POST /bookings/:id/reviews
Reviews: PUT/DELETE /reviews/:id
Admin: GET /admin/stats, GET /admin/users, PATCH /admin/users/:id/status
📝 Notes
BorrowBox displays prices and totals but does not process payments. Money is settled between the owner and borrower.
Uploaded photos are stored in server/uploads/.
