# Deploying to Vercel

## Why everything shows 0 on Vercel

MacroTrack uses a **SQLite database file** locally at `data/macro-tracking.db`.

That file:
- Is **gitignored** (never pushed to GitHub)
- **Cannot run on Vercel** — serverless functions have no persistent disk
- Gets wiped on every deploy / every cold start even if you tried to write one

**You cannot "push the db" to Vercel.** You need a hosted database.

## Solution: Supabase (free tier)

The app now supports **Supabase PostgreSQL** for production. Locally it still uses SQLite (no setup needed).

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **service_role** key (Settings → API)

### 2. Run the schema

In Supabase → **SQL Editor**, paste and run the contents of:

```
supabase/schema.sql
```

This creates all tables. On first API request, the app **auto-seeds** your profile, supplements, breakfast, InBody, and workout program.

### 3. Add env vars to Vercel

In Vercel → Project → Settings → Environment Variables, add **all** of these:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zttwerdfabsibnyezlfi.supabase.co` |
| `SUPABASE_URL` | same as above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon JWT |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | your publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role JWT |
| `SUPABASE_SECRET_KEY` | your secret key |

Copy values from your local `.env` file. **Never commit `.env` to git.**

Redeploy after adding these.

### 4. One-time local setup (optional)

```bash
npm run setup-supabase
```

This creates the `uploads` storage bucket and migrates local images to Supabase Storage.

---

## Photos & images

Images are stored in **Supabase Storage** bucket `uploads` (not local files):

- Avatars → `avatars/…`
- Progress/meal photos → `photos/…`

Public URLs: `https://zttwerdfabsibnyezlfi.supabase.co/storage/v1/object/public/uploads/…`

Your profile avatar and May 28 progress photos were uploaded to Supabase Storage. Local copies in `public/uploads/` were removed.

---

## No more static seed data

The app **no longer auto-seeds** demo data. Everything you log (meals, body, workouts, supplements) is saved directly to Supabase when env vars are set.

---

## Quick checklist

- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Run `npm run setup-supabase` (creates storage bucket)
- [ ] All Supabase env vars in Vercel
- [ ] Redeploy
- [ ] Log in and add today's data — it will persist
