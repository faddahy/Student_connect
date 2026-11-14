# Student Connect 💘

A free, mobile-first dating & friendship web app for students of the **Federal University of Technology, Minna (FUT Minna)**, Niger State, Nigeria.

- Sign-up is limited to FUT Minna **student emails** (`@st.futminna.edu.ng`), enforced in the database.
- **18+ only** (date of birth checked in the browser *and* by a database trigger).
- Profiles with up to 4 compressed photos, bio, department, level, gender, who you're interested in, interests.
- Swipe-style **Discover** feed (like / pass) filtered by mutual preferences. Mutual like = **match**.
- **Real-time chat** between matches only.
- **Safety:** report, block, unmatch, delete account, plus an `/admin` page to review reports and ban users.
- **Terms of Use, Privacy Policy, Community Guidelines, About** pages (needed for AdSense approval).
- **Google AdSense** slots (hidden until you set your publisher ID) and an automatic `/ads.txt`.
- Installable **PWA** ("Add to Home screen").

Runs entirely on free tiers: **Vercel Hobby** (hosting) + **Supabase Free** (auth, Postgres, storage, realtime).

**Stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS v4), `@supabase/ssr`, Supabase Postgres with row-level security.

---

## How sign-up restriction works

| Layer | Where | What it does |
| --- | --- | --- |
| UI + server action | `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` env var | Friendly error before calling Supabase |
| **Database (authoritative)** | `public.allowed_email_domains` table + `enforce_email_domain` trigger on `auth.users` | Rejects any sign-up (or email change) from other domains, even via the raw API |
| Optional auth hook | `public.hook_before_user_created` | Same check as a Supabase "Before User Created" hook, with a clean 403 |

The FUT Minna student domain was verified from the university's own ePortal, which issues every student an address like `firstname.lastname@st.futminna.edu.ng` (Google Workspace / Gmail). Staff use `@futminna.edu.ng`, which is **not** allowed by default because this is a students-only app.

**To change the allowed domains** (do both):
1. Update the env var `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` in Vercel (comma-separated) and redeploy.
2. In Supabase SQL Editor:
   ```sql
   insert into public.allowed_email_domains (domain) values ('futminna.edu.ng');   -- add
   delete from public.allowed_email_domains where domain = 'futminna.edu.ng';      -- remove
   ```

---

## Deploy it (step by step, all free)

You need: a GitHub account (this repo), a Gmail account, and about 30–45 minutes.

### 1. Create the Supabase project
1. Go to <https://supabase.com> → **Start your project** → sign in with GitHub.
2. **New project**: name `student-connect`, set a strong database password (save it), region **closest to Nigeria** (e.g. *West EU (London)* or *Central EU (Frankfurt)*), plan **Free**.
3. Wait ~2 minutes for it to finish.

### 2. Run the database migration
1. Supabase → **SQL Editor** → **New query**.
2. Copy everything from [`supabase/migrations/20261114000000_init.sql`](supabase/migrations/20261114000000_init.sql), paste, click **Run**. It should say *Success. No rows returned*.
   - This creates all tables, RLS policies, triggers, the `photos` storage bucket, and turns on realtime for `messages`. It's safe to run again.
3. Check: **Table Editor** shows `profiles`, `swipes`, `matches`, `messages`, `blocks`, `reports`, `allowed_email_domains`. **Storage** shows a public bucket named `photos`.
   - If the `photos` bucket is missing, create it manually: Storage → New bucket → name `photos`, **Public** ON, file size limit 2 MB, allowed types `image/jpeg, image/png, image/webp`. Then re-run the migration (it adds the upload policies).
4. Check realtime: **Database → Publications → supabase_realtime** should include `messages`. If not, toggle it on.

### 3. Set up email sending (required!)
Supabase's built-in email only delivers to your own Supabase team members and only 2 emails/hour, so students would never get their confirmation link. Connect a free SMTP provider:

**Option A — Gmail (easiest, no domain needed, ~500 emails/day):**
1. On the Gmail account you'll send from, turn on **2-Step Verification** (myaccount.google.com → Security).
2. Create an **App password** (myaccount.google.com/apppasswords) → name it "Student Connect" → copy the 16-character password.
3. Supabase → **Authentication → Emails → SMTP Settings** → **Enable custom SMTP**:
   - Sender email: your Gmail address · Sender name: `Student Connect`
   - Host `smtp.gmail.com` · Port `587` · Username: your Gmail address · Password: the app password
4. **Authentication → Rate Limits** → raise *emails sent per hour* (e.g. 100).

**Option B — Brevo** (free 300 emails/day): create an account at brevo.com, get an SMTP key (SMTP & API page) and use host `smtp-relay.brevo.com`, port `587`.

### 4. Configure Supabase Auth
Supabase → **Authentication**:
1. **Sign In / Providers → Email**: Email provider **enabled**, **Confirm email ON**, minimum password length `8`.
2. **URL Configuration**:
   - **Site URL**: your live URL (after step 6), e.g. `https://student-connect.vercel.app`. Use `http://localhost:3000` for now.
   - **Redirect URLs** → add:
     - `http://localhost:3000/auth/callback`
     - `https://YOUR-VERCEL-URL/auth/callback` (add after step 6)
     - `https://YOUR-CUSTOM-DOMAIN/auth/callback` (if/when you add one)
3. *(Optional, nicer error message)* **Authentication → Hooks → Before User Created** → type *Postgres*, schema `public`, function `hook_before_user_created` → enable.
4. *(Optional)* **Emails → Templates → Confirm signup**: change the subject to "Confirm your Student Connect account".

### 5. Copy your API keys
Supabase → **Project Settings → API** (or **API Keys**):
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key (or the *publishable* key) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key (or a *secret* key) → `SUPABASE_SERVICE_ROLE_KEY` — **keep this secret**, never share it or put it in a `NEXT_PUBLIC_` variable.

### 6. Deploy to Vercel
1. Go to <https://vercel.com/signup> → **Continue with GitHub** (Hobby plan, free).
2. **Add New → Project** → import **`student-connect`** (grant Vercel access to the repo if asked).
3. Framework is auto-detected as Next.js. Open **Environment Variables** and add the variables from the table below.
4. Click **Deploy**. Your site will be at something like `https://student-connect.vercel.app` (or `student-connect-xxxx.vercel.app`).
5. Set `NEXT_PUBLIC_SITE_URL` to that exact URL (Settings → Environment Variables), then **Deployments → ⋯ → Redeploy**.
6. Back in Supabase (step 4.2) set **Site URL** to that URL and add `https://<that-url>/auth/callback` to Redirect URLs.

### 7. Make yourself admin and test
1. Open your site, sign up with **your** `@st.futminna.edu.ng` email, confirm it, finish your profile.
2. Make sure `ADMIN_EMAIL` in Vercel is that same email (redeploy if you change it). An **Admin** button appears in the header → `/admin`.
3. Test with a friend: sign up two accounts, like each other, chat.
4. On your phone, open the site in Chrome → menu → **Add to Home screen**.

### 8. Apply for Google AdSense (to earn from ads)
> ⚠️ AdSense only approves sites on a domain **you own**. A free `*.vercel.app` address will be rejected. You'll need a cheap custom domain (≈ $10/year for `.com`, or a `.com.ng` from a Nigerian registrar), connected in Vercel → Project → **Settings → Domains** (Vercel hosting itself stays free). After adding the domain, update `NEXT_PUBLIC_SITE_URL`, Supabase Site URL, and Redirect URLs to the new domain.

1. Get some real users and content first; AdSense reviews the public pages (home, About, Terms, Privacy, Guidelines are already there). Set `NEXT_PUBLIC_CONTACT_EMAIL` so those pages show a contact address.
2. Sign up at <https://adsense.google.com> with your Google account, enter your domain (e.g. `studentconnect.com.ng`), country **Nigeria**, and accept the terms.
3. AdSense shows your publisher ID like `ca-pub-1234567890123456`. Put it in Vercel as `NEXT_PUBLIC_ADSENSE_CLIENT` and **redeploy**. This automatically:
   - adds the AdSense script and the `google-adsense-account` meta tag to every page (site verification), and
   - serves `https://your-domain/ads.txt` with `google.com, pub-…, DIRECT, f08c47fec0942fa0`.
4. In AdSense → **Sites** → your site → choose verification by *AdSense code snippet* or *ads.txt* → **Request review**. Approval can take a few days to 2–4 weeks.
5. Payment setup: AdSense → **Payments** → add your bank account (Nigerian banks are supported for wire transfer). Payouts happen when your balance reaches the threshold (US$100).
6. *(Optional, after approval)* Create **Display ad units** (Ads → By ad unit) and put their slot IDs in `NEXT_PUBLIC_ADSENSE_SLOT_FEED` and `NEXT_PUBLIC_ADSENSE_SLOT_MATCHES`. Until then, ads show with AdSense's automatic sizing.

Where ads appear: a full card in the Discover feed after every *N* swipes (`NEXT_PUBLIC_AD_EVERY_N_CARDS`, default 6) and one banner on the Matches list. No ads inside chats. All ad slots are hidden while `NEXT_PUBLIC_ADSENSE_CLIENT` is empty.

> Keep the app clean: AdSense does not allow ads on pages with sexual content. Enforce the Community Guidelines and act on reports, or you risk losing your AdSense account.

---

## Environment variables

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://abcd1234.supabase.co` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `eyJhbGciOi…` | anon / publishable key (safe in browser; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | `eyJhbGciOi…` | **Server-only secret.** Used by `/admin` and account deletion |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://student-connect.vercel.app` | No trailing slash. Used in email links |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` | ✅ | `st.futminna.edu.ng` | Comma-separated; keep in sync with the DB table |
| `ADMIN_EMAIL` | ✅ | `you@st.futminna.edu.ng` | Comma-separated list of admin accounts |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommended | `studentconnect.help@gmail.com` | Shown on About / Terms / Privacy |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | later | `ca-pub-1234567890123456` | Empty = no ads, ads.txt shows a placeholder |
| `NEXT_PUBLIC_ADSENSE_SLOT_FEED` | optional | `1234567890` | Ad unit slot for the Discover feed |
| `NEXT_PUBLIC_ADSENSE_SLOT_MATCHES` | optional | `0987654321` | Ad unit slot for the Matches page |
| `NEXT_PUBLIC_AD_EVERY_N_CARDS` | optional | `6` | Ad after every N swipes (min 2) |

`NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after changing them**.

---

## Run locally

```bash
cp .env.example .env.local   # fill in your Supabase values
npm install
npm run dev                  # http://localhost:3000
npm run build                # production build check
```

---

## Project structure

```
supabase/migrations/   SQL schema, RLS, triggers, storage bucket, realtime
src/app/
  page.tsx             landing page
  (auth)/              login, signup, forgot/reset password + server actions
  auth/callback        email confirmation & password-reset link handler
  onboarding/          first-time profile setup (18+ check)
  (app)/discover       swipe feed (+ ads every N cards)
  (app)/matches        matches & conversations (+ banner ad)
  (app)/chat/[id]      realtime chat
  (app)/profile        edit profile, sign out, delete account
  admin/               reports review, ban/unban (ADMIN_EMAIL only)
  terms, privacy, guidelines, about
  ads.txt/, manifest.ts, icons/[size], robots.ts, sitemap.ts
src/components/        AdSlot, ProfileCard, ProfileEditor, SafetyMenu, …
src/lib/               config, Supabase clients, types
public/sw.js           minimal service worker (PWA + offline page)
```

## Security model (summary)
- Every table has **row-level security**. Users can only read their **own** profile row; other students are visible only through `get_discover_feed()` and `get_matches()`, which never return email or exact date of birth.
- Users can't change their email domain, ban flag, or anyone else's data (column-level grants + RLS).
- Swipes, matches, and messages are checked server-side: you can only message inside your own match, and blocking deletes the match and its messages.
- Photos are stored at `photos/<user-id>/…`; users can only upload/delete in their own folder.
- Banned users are hidden from everyone, can't send messages, and are banned in Supabase Auth.

## Free-tier notes
- **Supabase Free** pauses a project after ~1 week with no activity; open the dashboard and click *Restore* if that happens. 500 MB database, 1 GB file storage, 50k monthly active users. Photos are compressed to ~100–350 KB each, so 1 GB holds thousands of photos.
- **Vercel Hobby** is for non-commercial use per Vercel's terms; if the app starts earning meaningful ad revenue, consider Vercel Pro or moving to Cloudflare Pages / Netlify.
- Images are served directly from Supabase Storage (no Vercel image optimisation) to stay within free limits.

## Disclaimer
Student Connect is an independent student project and is not affiliated with or endorsed by the Federal University of Technology, Minna.
