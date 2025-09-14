This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Persistence (Submissions History)

This app can persist user questions and model responses. It ships with a DB abstraction that:

- Uses Prisma + SQLite when available.
- Falls back to an in-memory store if Prisma deps aren’t installed (useful for quick trials).

API routes:
- `POST /api/analyze` — analyzes and automatically saves a submission; returns `submissionId`.
- `GET /api/submissions` — lists recent submissions.
- `GET /api/submissions/:id` — fetches a single submission.

Cloud database (recommended): Postgres

We configured Prisma for Postgres to support a reliable managed DB. Two easy options:

- Neon (serverless, free tier): https://neon.tech
- Supabase (managed Postgres): https://supabase.com

Steps (Neon example):

1) Create a Neon project and database (keep defaults).
2) Copy the connection string (use the “Prisma” format if offered), typically:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

3) Add it to your environment:
   - Local: put in `.env` (root) so Prisma can read it, and `.env.local` for Next.js if you want.
   - Deployment (e.g., Vercel): add the same `DATABASE_URL` as an env var in project settings.

4) Install Prisma deps (if not already):

```bash
npm install @prisma/client prisma
```

5) Push schema and generate the client:

```bash
npm run db:push
```

6) Optional: open Prisma Studio to inspect data

```bash
npm run db:studio
```

Supabase variant:
1) Create a new project, wait for provisioning.
2) Get the connection string from Database → Connection Info (ensure `sslmode=require`).
3) Set `DATABASE_URL` and run `npm run db:push`.

Notes
- In-memory mode has been removed. The app requires a real database (Postgres) for both local and cloud.
- We configured `prisma/schema.prisma` for `postgresql`.
- API routes and the UI use Prisma via `DATABASE_URL`. If unset, writes will fail with a clear error.

Local Postgres quick start

Option A — Docker Compose (recommended)

```bash
docker compose up -d

# In your .env or .env.local (already set in repo)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interview?sslmode=disable"

npm run db:push
```

Option B — Docker run (one-liner)

```bash
docker run --name interview-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=interview -p 5432:5432 -d postgres:15
npm run db:push
```

Health check (optional)

```bash
docker logs -f interview-db
# Wait for: "database system is ready to accept connections"
```
