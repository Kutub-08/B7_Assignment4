# Home Services Marketplace Backend — Batch 7 Assignment 4

A REST API backend for a home services marketplace built with **Node.js, Express 5, TypeScript, PostgreSQL, and Prisma ORM v7**. Customers can browse services and technicians, book appointments, pay via Stripe, and leave reviews. Technicians manage their profiles, availability, and services. Admins moderate categories, users, and bookings.

---

**Live API:** https://b7-assignment4.vercel.app/

**Author:** [Kutub Uddin](mailto:kutubuddin2003251251@gmail.com)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API framework |
| TypeScript | Type safety |
| PostgreSQL | Database |
| Prisma ORM v7 (`prisma-client` generator + driver adapters) | Database access layer |
| Zod | Request validation |
| JWT (`jsonwebtoken`) | Authentication |
| bcryptjs | Password hashing |
| Stripe | Payment processing |
| tsup | Production build/bundling |
| Vercel | Deployment |

---

## 📁 Folder Structure

```
├── prisma/
│   ├── schema/                    # Multi-file Prisma schema
│   │   ├── schema.prisma          # Generator + datasource config
│   │   ├── enum.prisma            # Role, UserStatus, BookingStatus, PaymentStatus, etc.
│   │   ├── user.prisma            # User model
│   │   ├── technicianProfile.prisma
│   │   ├── technicianAvailability.prisma
│   │   ├── service.prisma
│   │   ├── category.prisma
│   │   ├── booking.prisma
│   │   ├── payment.prisma
│   │   └── review.prisma
│   └── migrations/
├── src/
│   ├── app.ts                     # Express app, middleware, route mounting
│   ├── server.ts                  # Entry point
│   ├── config/index.ts            # Environment variable config
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client (driver adapter)
│   │   └── stripe.ts              # Stripe instance
│   ├── middleware/
│   │   ├── auth.ts                # Role-based auth guard
│   │   ├── validateRequest.ts     # Zod validation middleware
│   │   ├── globalErrorHandler.ts  # Central error handler
│   │   └── routeNotFound.ts       # 404 handler
│   ├── schema/index.ts            # All Zod validation schemas
│   ├── utils/
│   │   ├── AppError.ts
│   │   ├── sendResponse.ts
│   │   ├── easyController.ts
│   │   └── jwtutils.ts
│   └── models/                    # Feature modules (controller / service / route)
│       ├── auth/
│       ├── technician/
│       ├── service/
│       ├── category/
│       ├── booking/
│       ├── payment/
│       ├── review/
│       └── admin/
├── generated/prisma/              # Generated Prisma client
├── dist/                          # Production build output
├── prisma.config.ts               # Prisma CLI config (v7)
├── tsup.config.ts
├── vercel.json
└── package.json
```

---

## ⚙️ Getting Started (Local Setup)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd b7Assignment4
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="Your PostgreSQL database URL"
PORT=3000
APP_URL="https://b7-assignment4.vercel.app"
BCRYPT_SALT_ROUNDS="Your password salt rounds"
JWT_ACCESS_SECRET="Your JWT access secret"
JWT_REFRESH_SECRET="Your JWT refresh secret"
JWT_ACCESS_EXPIRES_IN="Access token expiry (e.g. 7d)"
JWT_REFRESH_EXPIRES_IN="Refresh token expiry (e.g. 30d)"
STRIPE_SECRET_KEY="Your Stripe secret key"
STRIPE_WEBHOOK_SECRET="Your Stripe webhook secret"
```

### 3. Generate the Prisma client

```bash
npx prisma generate
```

### 4. Run migrations

```bash
npx prisma migrate dev
```

### 5. Run the dev server

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

### 6. Stripe webhook (local testing)

In a separate terminal:

```bash
npm run stripe:webhook
```

This forwards Stripe test events to your local `/api/payment/confirm` endpoint. Copy the `whsec_...` secret it prints into your `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 👥 Roles & Permissions

| Role | Capabilities |
|---|---|
| **Customer** | Browse services/technicians, book, pay via Stripe, cancel, review, view own bookings/payments |
| **Technician** | Manage profile & availability, create services, accept/decline/progress bookings, view own bookings |
| **Admin** | Manage categories, view all users/bookings, ban/unban users |

Role is selected at registration (`CUSTOMER` or `TECHNICIAN` only — `ADMIN` cannot self-register).

---

## 📡 API Endpoints

All endpoints are prefixed with the live URL: `https://b7-assignment4.vercel.app`

### Root

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Welcome message & author info |

### Auth (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as CUSTOMER or TECHNICIAN |
| POST | `/api/auth/login` | Public | Login, returns JWT tokens |
| GET | `/api/auth/me` | Authenticated | Get current user's profile |

### Technician (`/api/technician`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/technician/` | Public | List technicians (filter by skill, location, rating, category, search) |
| GET | `/api/technician/:id` | Public | Single technician profile with services & reviews |
| PATCH | `/api/technician/profile` | Technician | Update own profile |
| PUT | `/api/technician/availability` | Technician | Replace weekly availability schedule |

### Service (`/api/services`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/services/` | Technician | Create a new service |
| GET | `/api/services/` | Public | List services (filter by category, location, rating, price, search) |
| GET | `/api/services/:id` | Public | Single service detail |

### Category (`/api/category`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/category/` | Public | List service categories |

### Booking (`/api/bookings`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/bookings/create` | Customer | Create a booking (status → `REQUESTED`) |
| PATCH | `/api/bookings/status/:id` | Technician | Accept / decline / progress a booking |
| GET | `/api/bookings` | Customer, Technician | List own bookings |
| GET | `/api/bookings/:id` | Customer, Admin | Single booking detail |
| PATCH | `/api/bookings/:id/cancel` | Customer | Cancel booking (only before `IN_PROGRESS`) |

**Booking lifecycle:** `REQUESTED → ACCEPTED/DECLINED → PAID → IN_PROGRESS → COMPLETED` (or `CANCELLED` any time before `IN_PROGRESS`)

### Payment — Stripe (`/api/payment`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/payment/create` | Customer | Create a Stripe Checkout Session for an `ACCEPTED` booking |
| POST | `/api/payment/confirm` | Stripe webhook | Confirm payment, flip booking to `PAID` |
| GET | `/api/payment/` | Customer | Own payment history |
| GET | `/api/payment/:id` | Customer | Single payment detail |

Test with Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC.

### Review (`/api/review`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/review/` | Customer | Review a `COMPLETED` booking (one per booking) |

### Admin (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/admin/categories` | Admin | Create a category |
| GET | `/api/admin/categories` | Admin | List categories |
| GET | `/api/admin/allUsers` | Admin | List customers & technicians |
| GET | `/api/admin/bookings` | Admin | List all bookings (filter by status, dates, search) |
| PATCH | `/api/admin/user/:id` | Admin | Ban/unban a user |

---

## ✅ Error Response Format

Every error returns a consistent structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "errorDetails": {}
}
```

---

## 🚀 Deployment

Deployed on **Vercel** using `tsup` to bundle to `dist/server.js`.

```bash
npm run build   # runs `prisma generate && tsup`
```

Set the same environment variables in Vercel's project dashboard (Settings → Environment Variables) — `.env` is not deployed. Reconfigure the Stripe webhook to point at `https://b7-assignment4.vercel.app/api/payment/confirm`.

---

## 🔮 Known Limitations

- **No automatic refunds** — cancelling a `PAID` booking changes its status but does not trigger a Stripe refund.
- **Location matching is substring-based** — not geocoded, no real distance/radius filtering.
