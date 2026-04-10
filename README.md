# Scholars Profile

Next.js app for managing and publishing student scholar profiles.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

3. Set `POSTGRES_URL` and admin credentials.

4. Prisma:

```bash
npx prisma generate
npx prisma migrate dev
```

5. Import Excel data (optional):

```bash
npm run seed
```

6. Run:

```bash
npm run dev
```

## Deploy

Deploy to Vercel with the same env vars.
