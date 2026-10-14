# BorrowBox — Client (React + Vite)

Community tool & equipment lending platform — frontend.

## Tech stack
React 18 · React Router 6 · Axios · Vite · Plain CSS (custom design system)

## Design system
**Workshop Green: deep forest, sage, paper & brass**

| Role | Color |
|---|---|
| Primary | `#1E4D3A` Forest |
| Ink (headings, dark surfaces) | `#0D2018` |
| Secondary | `#86C69A` Sage |
| Background | `#F5F3EA` Paper |
| Accent | `#EAE0CC` Sand |
| Rating star | `#B8832A` Brass |

Type: Bricolage Grotesque (display) + Figtree (body), loaded from Google Fonts in `index.html`.

All tokens (colour, radius, shadow, spacing, type) live in `src/styles/global.css` as CSS
variables, so the palette is defined once and reused across every button, card and badge.

## 1. Install

```bash
cd client
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

By default it points at `http://localhost:5000/api` — update `VITE_API_URL` if
your API runs elsewhere.

## 3. Run

```bash
npm run dev
```

Open `http://localhost:5173`. Make sure the **server** (see `../server/README.md`)
is running first, with the database seeded.

**Sample logins** (password: `Passw0rd!`): `ali@borrowbox.app`, `sara@borrowbox.app`,
`bilal@borrowbox.app`, and admin `admin@borrowbox.app`.

## Project structure

```
client/
|-- src/
|   |-- api/          axios instance + endpoint helper functions
|   |-- components/   Navbar, ItemCard, StatusBadge, BookingRow, modals, ...
|   |-- context/      AuthContext, ToastContext
|   |-- pages/        Home, ItemDetail, Dashboard, Admin, ...
|   |-- routes/       ProtectedRoute, AdminRoute
|   |-- styles/       global.css (design tokens + all component styles)
|   |-- App.jsx        route table
|   `-- main.jsx       entry point
`-- index.html
```

## Pages / routes

| Route | Page | Access |
|---|---|---|
| `/` | Browse & search items with filters and pagination | Public |
| `/items/:id` | Item detail — availability calendar, booking form | Public (login to book) |
| `/login`, `/register` | Auth pages | Public |
| `/dashboard` | Tabs: My Items · My Borrowings · Incoming Requests | Member |
| `/items/new`, `/items/:id/edit` | Add / edit item | Member (owner) |
| `/bookings/:id` | Booking detail with condition log & reviews | Participants |
| `/profile/:id` | Public profile with trust score and reviews | Public |
| `/admin` | Users, categories, statistics | Admin |

## Notes

- One shared Axios instance (`src/api/axios.js`) attaches the JWT to every
  request and normalises error messages.
- `AuthContext` restores the session on load by calling `GET /auth/me` with
  the stored token.
- Every list (items, bookings, categories, reviews) has add/edit/delete
  actions in the UI, with a confirmation modal before any delete.
- Loading, empty and error states are shown on every data-driven page; toast
  messages confirm success/failure of actions.
- Item photos are optional URLs; without one, a category icon placeholder is shown.
