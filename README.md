# TeamPulse

Live team sentiment surveys. Run a 10-question scored survey with up to 25 participants in under 5 minutes.

## What it does

- **Facilitator** creates a session, shares the room code (or link) with the team
- **Participants** join on their own device, score 10 questions 1–10 with optional comments — no login required
- **Auto-closes** when all participants submit; facilitator can also close manually
- **Results screen** shows averages and score distribution per question; click any question for the drill-down with all anonymous comments
- **CSV export** for every session

---

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. In the SQL editor, run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon/public key** from Project Settings → API

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_PASSWORD=choose-a-strong-password
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import into [vercel.com](https://vercel.com) — it auto-detects Next.js
3. Add the three environment variables in the Vercel project settings
4. Deploy

---

## Routes

| Route | Who | What |
|---|---|---|
| `/` | Participants | Enter room code to join |
| `/join/[code]` | Participants | Complete the 10-question survey |
| `/admin` | Facilitator | Login, create/monitor sessions, export CSV |
| `/results/[sessionId]` | Facilitator | View results overview and drill-down |

---

## Questions (v1 fixed set)

1. I feel energised and motivated in my work right now.
2. I have the clarity I need to do my job well.
3. I feel supported by my team and manager.
4. My workload feels sustainable and manageable.
5. I feel psychologically safe to speak up and share ideas.
6. I understand how my work connects to the team's goals.
7. I feel recognised for the contributions I make.
8. Communication across the team is working well.
9. I feel like I'm learning and growing in my role.
10. Overall, I feel positive about where we're headed as a team.

---

## CSV export format

`Session ID, Session Code, Session Date, Submission ID, Submitted At, Question Index, Question Text, Score, Comment`

One row per answer. 10 rows per participant submission.

---

## Architecture

- **Next.js 14** (App Router) — frontend + API routes
- **Supabase** — Postgres database + real-time subscriptions
- **Tailwind CSS** — styling
- **No auth library** — admin protected by a simple env-var password + httpOnly cookie
- **Fully anonymous** — no participant names, no cookies, no tracking

## Security notes

- Participant join is fully anonymous — no names, no identifiers stored beyond a UUID submission ID
- Admin password is compared server-side; the cookie is httpOnly and never readable from JS
- RLS policies on Supabase allow public reads/writes (needed for anonymous participants). If you want stricter control, use the Supabase service role key in your API routes and tighten RLS to deny public writes.
# teampulse
# teampulse
