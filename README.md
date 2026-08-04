# To-Let Backend (SD2)

## Prerequisites

- Node.js 22+
- PostgreSQL running with a database configured in `.env` (`DATABASE_URL`)

## Setup

```bash
npm install
npx prisma migrate dev   # create / sync database tables
npx prisma generate      # generate Prisma client
```

## Seed Database

Populates 4 users, 7 listings, 14 images, 4 favorites, and 3 inquiries:

```bash
npx prisma db seed
```

**Login credentials** for all seeded users: `password123`

| Name | Email | Role |
|------|-------|------|
| Rahim Khan | rahim@example.com | LANDLORD |
| Karim Uddin | karim@example.com | LANDLORD |
| Fatima Begum | fatima@example.com | TENANT |
| Hasan Ali | hasan@example.com | TENANT |

## Development

```bash
npm run dev
```

## Available Scripts

| Script | Command |
|--------|---------|
| `npm run dev` | `tsx watch src/server.ts` |
| `npm run build` | `tsc` |
| `npm test` | `jest --runInBand` |
| `npm run prisma:generate` | `prisma generate` |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:seed` | `tsx prisma/seed.ts` |
| `npm run prisma:studio` | `prisma studio` |
