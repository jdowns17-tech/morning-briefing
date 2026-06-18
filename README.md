# Morning Briefing

A daily command center for your inbox: scans the last 30 days of Gmail, flags interview/recruiter
emails as urgent, buries newsletters and promos in a collapsed "noise" section, and lets you drop
any email's action items straight onto a 7am–9pm time-block planner.

Stack: Next.js (App Router) + Tailwind, Auth.js (Google OAuth, `gmail.readonly` scope), Prisma +
Vercel Postgres, Anthropic (Claude Haiku) for email classification.

## 1. Local setup

### 1.1 Install dependencies

```bash
npm install
```

### 1.2 Create a Google OAuth client (for Gmail sign-in)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project
   (or pick an existing one).
2. **APIs & Services → Library** → search for "Gmail API" → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: External (unless you have a Google Workspace org you want to restrict to).
   - Add your own Google account under **Test users** (required while the app is unverified —
     Google will otherwise block sign-in).
   - Scopes: you don't need to add `gmail.readonly` here; the app requests it directly, but Google
     may ask you to justify it if you ever submit for verification. For personal use, test mode is fine.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs — add both (you'll add the production one after you deploy):
     - `http://localhost:3000/api/auth/callback/google`
     - `https://<your-vercel-domain>/api/auth/callback/google`
5. Copy the generated **Client ID** and **Client secret**.

### 1.3 Get an Anthropic API key

Create one at [console.anthropic.com](https://console.anthropic.com/) → API Keys. Used to classify
emails (interview/recruiter/newsletter/etc.) and extract action items via `claude-haiku-4-5`.

### 1.4 Create the database

This project uses Postgres via Vercel's Neon marketplace integration (Vercel no longer runs its
own Postgres product — new databases are provisioned through Neon, but Vercel still wires up the
env vars for you).

1. [vercel.com/new](https://vercel.com/new) or an existing project → **Storage** tab → **Create
   Database** → **Neon** (or **Marketplace → Neon** if you don't see it directly) → follow the
   prompts to create a database and connect it to your project.
2. Pull the env vars it just created into this project:
   ```bash
   npx vercel link      # links this directory to that Vercel project
   npx vercel env pull .env.local
   ```
   This writes `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, used for migrations)
   into `.env.local`, along with anything else configured on the Vercel project.

Then add the remaining variables to the same `.env.local` (copy from `.env.example` if you'd
rather start from scratch):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=        # generate with: openssl rand -base64 32
ANTHROPIC_API_KEY=
```

Create the tables:

```bash
npx prisma db push
```

### 1.5 Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, click **Sync Gmail**.

## 2. Deploying to Vercel

1. Push this repo to GitHub:
   ```bash
   git remote add origin <your-empty-github-repo-url>
   git push -u origin main
   ```
2. In the [Vercel dashboard](https://vercel.com/new), import the GitHub repo.
3. If you created the Neon database against this same Vercel project, `DATABASE_URL` /
   `DATABASE_URL_UNPOOLED` are already set. Otherwise add them (and `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`) under **Project Settings →
   Environment Variables**.
4. Deploy. Once you have your `*.vercel.app` URL, go back to the Google Cloud Console credential
   from step 1.2 and make sure `https://<that-domain>/api/auth/callback/google` is in the
   authorized redirect URIs.
5. Visit the deployed URL from any device and sign in.

## Notes / known limitations

- **30-day window, incremental sync**: "Sync Gmail" only fetches messages it hasn't cached yet, so
  re-syncing after the first run is fast and cheap.
- **"Today" is server-local**: the planner's default day boundary uses the server's clock, not your
  browser's timezone. If you're near midnight UTC this can be off by a few hours — navigate a day
  with the arrows if so.
- **No background sync**: syncing only happens when you click the button (or load the dashboard with
  zero cached emails). Wiring up a Vercel Cron job to auto-sync would need a stored refresh token
  decoupled from an active browser session — a reasonable next step, not built here.
- **Noise pre-filter**: emails Gmail itself already tags Promotions/Social/Forums skip the LLM call
  entirely and go straight to the noise section, to keep classification cost down.
