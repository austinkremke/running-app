# Supabase Backend

> **Milestone:** 02  
> **Status:** In progress — Phase A + B + C shipped; Phase D next  
> **Depends on:** [01 Activity recording](./01-activity-recording.md)  
> **Unblocks:** [03 XP & rank](./03-xp-and-ranking.md), [04 Integrations](./04-third-party-integrations.md), [05 Matchmaking & feed](./05-matchmaking-and-feed.md)

---

## Decision

**Start with Supabase** for v1 backend: Postgres + Auth + Storage + Edge Functions (+ Realtime where needed).

This is not “because we’ve used Supabase before” — it’s because the product is **relational** (users, teams, matches, feed, ranks) and we want **fast MVP** with a standard SQL escape hatch. Alternatives considered below.

---

## What the backend must do

| Job | Notes |
|-----|--------|
| **Auth & identity** | Email / Apple / Google; sessions for mobile |
| **Relational core** | Users, profiles, teams, memberships, matches, feed posts |
| **Activity sync** | Upload completed activities from [01](./01-activity-recording.md) |
| **Files** | Photos, imported FIT/GPX blobs |
| **Server logic** | Webhooks, sync jobs, later XP/Elo validation |
| **Real-time (optional)** | Match chat, live scoreboard — Realtime or polling first |

---

## Why Supabase fits

| Strength | For Run Off |
|----------|-------------|
| **Postgres** | Natural fit for teams, matches, feed, leaderboards, foreign keys |
| **Auth** | Mobile-friendly; fewer moving parts than DIY |
| **Row Level Security** | “User sees only their team / match” in the database |
| **Storage** | FIT files, run photos, export blobs |
| **Edge Functions** | Strava webhooks, activity ingest, XP award hooks later |
| **Standard SQL** | Migration path: same schema on Neon/RDS if we outgrow the platform |
| **Familiarity** | Team has used it — lowers setup cost (not the only reason) |

---

## Risks & mitigations

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| **GPS sample volume** | 1 Hz × many users × many runs = huge row counts if naive | **Summaries + simplified polyline in Postgres**; full tracks in **Storage** or bucketed samples; archive old detail |
| **Edge Function limits** | Cold starts, timeouts, not ideal for heavy FIT parsing | Keep functions thin; queue long jobs (Trigger.dev / Inngest / worker later) |
| **Realtime ≠ matchmaking** | Supabase won’t pair opponents for you | Postgres for match state; dedicated matching logic in functions or separate worker |
| **Vendor shape** | Auth/storage APIs are Supabase-flavored | **Core data in portable Postgres**; avoid exotic lock-in in schema |
| **Client-trusted runs** | Local GPS can be faked until server validates | Phase 1: trust + sync; Phase 2: server rules, caps, replay checks ([03](./03-xp-and-ranking.md)) |
| **Cost at scale** | Egress, storage, read-heavy leaderboards | Materialized rank snapshots; Redis later; lifecycle rules on Storage |
| **Offline-first sync** | Runs recorded without network | Queue uploads from app; idempotent `activity_id`; conflict = server wins on summary |
| **Schema / app drift** | AI and devs use stale column names; duplicate rank lists in TS vs DB | Migrations in git + `supabase gen types` → `src/types/database.ts`; see [Schema workflow](#schema-workflow-ai--humans) |
| **Display strings on user rows** | Rename tier (“Bronze” → “Wood”) requires per-user migrations | Store `competitive_rating` only; catalog in `rank_tiers`; derive/join for display |

---

## Alternatives considered (and why not first)

| Option | Pros | Why not v1 |
|--------|------|------------|
| **Firebase** | Great mobile SDK, realtime | Weak for relational matches/ranks/feed queries; costly read patterns; painful SQL migration later |
| **Custom API + Neon/Railway** | Full control | More auth/ops work before first match ships |
| **AWS full stack** | Scales forever | Overkill for current team size and timeline |
| **Convex / Appwrite** | Nice DX | Smaller ecosystem; less proven for geo + integration pipelines |

We can add a **thin Node API** later without throwing away Postgres.

---

## Activity storage strategy (critical)

Align with [01](./01-activity-recording.md) `ActivityRecord` model:

```
Postgres                         Storage (Supabase Storage)
────────                         ──────────────────────────
activities                       activities/{id}/track.json (optional full records)
  id, user_id, started_at,       activities/{id}/import.fit
  distance_m, duration_s,        feed photos
  summary_json, polyline,
  source, external_id

activity_samples (optional)      — only if we need queryable dense tracks in SQL
  bucketed / downsampled
```

**Do not** store unbounded 1 Hz samples in hot SQL tables without a retention plan.

---

## DB-first catalogs (reference data)

**Decision:** Put game catalogs (rank tiers, match types, achievement defs, etc.) in **Postgres reference tables** with **foreign keys** — not duplicated hardcoded lists in the app.

### Why

- Avoids app constants getting **out of sync** with DB as the product evolves.
- Rename tier display (“Bronze Runner” → “Wood Division”) = **one `UPDATE` on `rank_tiers`**, all users see it on next fetch.
- AI and humans share one source of truth: **migrations**.

### Rules

| Layer | What goes here |
|-------|----------------|
| **Reference tables** | `rank_tiers`, seeds for match types, etc. — stable `id`, mutable `display_name`, icons, thresholds |
| **User state tables** | `competitive_rating`, `total_xp`, FKs to users — **never** store display titles on the user row |
| **App config** | Level XP curve math, UI tokens, animations — until live ops needs DB tuning |

### Rank tier example

```sql
-- Reference (seed.sql) — one row per tier
rank_tiers (
  id            text primary key,      -- stable: 'bronze', not renamed casually
  display_name  text not null,         -- mutable: 'Bronze Runner' → 'Wood Division'
  subtitle      text,
  icon          text not null,
  min_rating    int not null,
  sort_order    int not null
);

-- User state — no tier title string
player_rank (
  user_id              uuid primary key references profiles(id),
  competitive_rating   int not null,
  season_wins          int default 0,
  season_losses        int default 0
  -- optional: tier_id uuid references rank_tiers(id) if caching; else derive from rating
);
```

**Rename display:** `UPDATE rank_tiers SET display_name = 'Wood Division' WHERE id = 'bronze';`  
**Do not:** store `rank_title text` on `profiles`.

---

## Schema workflow (AI + humans)

Keeps Cursor/agents aligned with the real database.

### Repo layout

```
supabase/
  migrations/          # SOURCE OF TRUTH — ordered SQL
  seed.sql             # rank_tiers, match_types, …
  SCHEMA.md            # Index + workflow (update when schema changes)
src/types/
  database.ts          # GENERATED — do not edit by hand
```

### Required loop (every schema change)

1. Add migration: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Apply locally: `supabase db reset` or `supabase migration up`
3. Regenerate types: `supabase gen types typescript --local > src/types/database.ts`
4. Commit **migration + database.ts** together (+ `seed.sql` / `SCHEMA.md` if needed)
5. App code uses `Database['public']['Tables'][...]` — no parallel hand-written table types

### For AI-assisted development

| Practice | Effect |
|----------|--------|
| Migrations in git | Agent reads real columns/FKs, not guesses |
| Generated `database.ts` | Autocomplete-safe queries; less hallucination |
| `supabase/SCHEMA.md` | Fast orientation before deep migration read |
| No duplicate catalogs in TS | Agent won’t “fix” UI with a second rank list |
| `AGENTS.md` + run-off skill | “Read migrations before DB work” |

**DB-first is easier for AI when schema is versioned.** It is **harder** when schema only exists in the Supabase dashboard and mocks drift.

### What not to duplicate in app code

- `rank_tiers` rows as `const RANK_TIERS = [...]` (fetch or join from DB)
- Match type labels, achievement catalog
- Enums that already exist as FK targets in Postgres

OK to keep in app: level curve constants, formatting helpers, `tierFromRating(rating, tiersFromApi)`.

---

## Suggested schema (v1 sketch)

```
profiles          — id → auth.users (display name, avatar, team_id, …)
activities        — synced from StoredActivity
teams             — name, tag, …
team_members      — user_id, team_id, role
matches           — type_id → match_types, status, started_at, …
match_types       — reference catalog (id, display_name, …)
match_participants
match_results
feed_posts        — activity_id, caption, …
feed_reactions    — later

-- Milestone 03 (reference + state):
rank_tiers        — id, display_name, subtitle, icon, min_rating, sort_order (SEED)
player_rank       — user_id, competitive_rating, season_wins, season_losses
player_progress   — user_id, total_xp
xp_ledger         — id, user_id, amount, source, breakdown_json, source_id, …
level_thresholds  — optional later if XP curve moves to DB; else app config
```

RLS: users read/write own rows; team/match visibility via membership policies.  
Reference tables (`rank_tiers`, `match_types`): read-all for authenticated users; write admin/service only.

See [supabase/SCHEMA.md](../supabase/SCHEMA.md) for the living index.

---

## Rollout phases

**Phase A is the gate for everything else.** No activity sync, teams, or matches until a real user exists in `auth.users` with a provisioned `profiles` row (and default progression rows). See [Phase A — Auth & user provisioning](#phase-a--auth--user-provisioning-first-step).

### Phase A — Auth & user provisioning (first step)

When someone installs the app and taps “Sign in with Apple” (or Google / email), Supabase Auth creates their identity; Postgres auto-creates their game rows. The app never inserts into `auth.users` directly.

#### End-to-end flow

```
OnboardingLoginScreen
        │
        ▼
AuthContext.signInWith*(provider)     ← @supabase/supabase-js
        │
        ▼
Supabase Auth: auth.users row         ← managed by Supabase (email, OAuth ids)
        │
        ▼ (AFTER INSERT trigger — server-side, not client)
handle_new_user()
        ├─ INSERT profiles            ← id = auth.users.id
        ├─ INSERT player_progress     ← total_xp = 0
        └─ INSERT player_rank         ← competitive_rating = default (e.g. 1000)
        │
        ▼
App: session persisted (SecureStore) + onAuthStateChange
        │
        ▼
App: fetch profiles (+ join rank/progress as needed)
        │
        ▼
Onboarding “How it works” → complete → AppShell (logged-in user)
```

**Why a DB trigger (not client `ensureProfile`)?** Sign-up must succeed even if the app crashes before the next line of JS runs. OAuth and magic-link flows may not return to the app immediately. One `SECURITY DEFINER` trigger keeps provisioning idempotent and centralized.

#### What gets created per new account

| Table | When | Notes |
|-------|------|--------|
| `auth.users` | Auth sign-up / OAuth | Supabase-managed; `id` is the canonical user id everywhere |
| `profiles` | Trigger on `auth.users` INSERT | `id` FK → `auth.users`; display name from OAuth metadata or email local-part |
| `player_progress` | Same trigger | `total_xp = 0` — level derived in app ([03](./03-xp-and-ranking.md)) |
| `player_rank` | Same trigger | `competitive_rating` = seed default; **no tier title string** |
| `rank_tiers` | `seed.sql` (once) | Reference catalog; not per-user |

`profiles` is the app’s **public user row**. All other user-owned tables FK to `profiles.id` (or `auth.users.id` — pick one; prefer `profiles.id` for game schema).

#### Implementation checklist

**1. Supabase project & repo**

- [x] Create Supabase project (dev); optional separate prod later
- [x] `supabase init` + link project; add `supabase/config.toml` to repo
- [x] Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` / `.env.example`
- [x] Enable auth providers in dashboard: **Email** (dev), **Apple** (iOS ship), **Google** (optional v1)

**2. First migration — users in Postgres**

- [x] `profiles` table + RLS (select/update own row; insert via trigger only)
- [x] `player_progress`, `player_rank` tables + RLS
- [x] `handle_new_user()` trigger on `auth.users` INSERT
- [x] `seed.sql`: `rank_tiers` rows (can land in same PR or immediately after)
- [x] `supabase db reset` locally; verify trigger creates all three rows on sign-up
- [x] `supabase gen types typescript --local > src/types/database.ts`; commit with migration

**3. App client**

- [x] Install `@supabase/supabase-js`; session storage via `expo-secure-store` (or AsyncStorage for dev-only — prefer SecureStore for prod)
- [x] `src/services/supabase.ts` — singleton client, `isSupabaseConfigured` guard
- [x] `src/context/AuthContext.tsx` — `session`, `profile`, `loading`, `signIn*` / `signOut`, `onAuthStateChange`
- [x] Split from `OnboardingContext`: onboarding = tutorial UX only; auth = identity
- [x] `RootNavigator`: `loading` → splash; `!session` → login; `session` → onboarding tutorial or `AppShell`
- [x] Replace `mockSignIn` in `OnboardingLoginScreen` with real provider calls
- [x] After sign-in: `select` from `profiles` where `id = session.user.id` (retry briefly if trigger is still running)

**4. Auth provider specifics (v1 order)**

| Provider | Phase A priority | App notes |
|----------|------------------|-----------|
| Email + password or magic link | **First** — fastest dev loop | Simplest to test trigger + RLS without Apple dev setup |
| Sign in with Apple | **Before App Store** | `expo-apple-authentication` + Supabase Apple provider; required for iOS if other social logins exist |
| Google | Optional v1 | `@react-native-google-signin/google-signin` + `signInWithIdToken` — see [docs/auth-setup.md](../docs/auth-setup.md) |

**5. Verify before Phase B**

- [x] New account in Supabase dashboard → `auth.users` + `profiles` + `player_*` rows exist
- [x] Kill and reopen app → session restores; profile loads
- [x] Sign out → back to login; no mock auth path left
- [x] RLS: user A cannot read/update user B’s `profiles` row

#### Suggested `profiles` columns (v1)

```sql
profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  avatar_url      text,
  team_id         uuid references teams(id),  -- null until teams ship (Phase C)
  onboarding_completed_at timestamptz,       -- optional: server-backed tutorial flag
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

`onboarding_completed_at` is optional: tutorial completion can stay **local** (`AsyncStorage`) for Phase A; move to server when multi-device matters.

#### Trigger sketch (reference — implement in migration)

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'runner'
    )
  );

  insert into public.player_progress (user_id, total_xp)
  values (new.id, 0);

  insert into public.player_rank (user_id, competitive_rating)
  values (new.id, 1000);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

#### App integration (current → Phase A)

| Current | After Phase A |
|---------|----------------|
| `OnboardingContext.mockSignIn` | `AuthContext.signInWithApple` / `signInWithOAuth` / `signInWithPassword` |
| `hasCompletedOnboarding` in memory only | Session from Supabase; tutorial flag local or `profiles.onboarding_completed_at` |
| No `user_id` on activities | `session.user.id` used for activity sync (Phase B) |
| Mock profile / XP UI | Can load real `profiles` + `player_progress` + `player_rank` (display still mock until 03) |

#### Open decisions (Phase A)

1. **Email-only first** vs Apple from day one? (Recommend email for dev, Apple before TestFlight.)
2. **Onboarding flag:** local AsyncStorage vs `profiles.onboarding_completed_at`?
3. **Username uniqueness:** display name only vs unique `username` column + constraint?
4. **Default `competitive_rating`:** fixed 1000 vs placement match later ([05](./05-matchmaking-and-feed.md))?

---

### Phase B — Activity sync

- `activities` table matching `StoredActivity` (summary + polyline in Postgres)
- **Sync on run stop** when logged in; queue locally if offline or sync fails
- Full `ActivityRecord[]` in Storage: `activities/{user_id}/{activity_id}/track.json`
- `listServerActivities` for future feed/history hydration

**Shipped in app:** `activitySync.ts`, `activityPolyline.ts`, `activitySyncQueue.ts`, wired in `RunContext` + `AuthContext` flush on login.

**Phase B checklist**

- [x] `activities` migration + RLS + `activities` Storage bucket
- [x] Sync on run stop when logged in; offline queue + flush on login
- [x] `supabase gen types` includes `activities` table
- [ ] Verify on device: row in `activities` + `track.json` in Storage after a run

### Phase C — Social & teams (read-heavy)

- `teams`, `team_members`, `profiles.team_id`
- Feed posts linked to `activities` (`feed_posts` with `audiences[]`)
- **Shipped in app:** `teamService.ts`, `feedService.ts`, `socialMappers.ts`; Feed / Team / Top Teams screens load from Supabase; “Add to feed” creates `feed_posts`

**Phase C checklist**

- [x] `teams` + `team_members` + `feed_posts` migration + RLS
- [x] Seed demo team (`Road Warriors`) in `seed.sql`
- [x] Feed tabs query server posts (friends tab empty until social graph ships)
- [x] Team tab join prompt → `joinTeam`
- [ ] Apply migration to remote + verify feed post after run

### Phase D — Match shell on server

- `matches`, `match_participants` — persist mock match state
- Realtime optional for chat ([05](./05-matchmaking-and-feed.md))

### Phase E — Hardening

- Edge Functions: ingest webhooks, validate activities
- Rate limits, idempotency keys
- Staging / prod projects

---

## App integration points

| Current | After 02 |
|---------|----------|
| `OnboardingContext` mock auth | Supabase Auth + `AuthContext` (Phase A — done) |
| No user in database | `auth.users` + trigger → `profiles`, `player_progress`, `player_rank` |
| `activityStorage.ts` only | Local cache + sync on stop → Supabase `activities` + Storage (Phase B — done) |
| Mock feed / teams | Postgres + RLS (Phase C — done) |
| `activityExchange` stubs | Edge Functions + Storage (Phase E / [04](./04-third-party-integrations.md)) |

---

## Open decisions

1. ~~**Sync trigger:** on stop vs on “Add to feed” only?~~ **Decided:** sync on run stop (Phase B).
2. **Polyline format:** encoded polyline in column vs GeoJSON JSONB vs PostGIS later?
3. **One Supabase project** for dev+prod or separate from day one?
4. **Email-only auth first** or Apple Sign In required for iOS launch? (Phase A — see [checklist](#implementation-checklist))
5. **Cache `tier_id` on `player_rank`** vs derive tier from `competitive_rating` only on every read?
6. **Onboarding completion:** local flag vs `profiles.onboarding_completed_at`? (Phase A)

---

## Summary

**Supabase is the right v1 backend** for auth, relational game data, and files — provided we **split activity summaries (SQL) from bulky GPS/FIT (Storage)**, use **reference tables + FKs** for catalogs (not duplicated TS lists), and follow the **migration → gen types → commit** workflow so AI and app stay in sync.

**First implementation step:** Phase A — Supabase Auth sign-up creates `auth.users`; a Postgres trigger provisions `profiles` + default progression rows; the app replaces mock onboarding auth with a real session and profile fetch. **Shipped.**

**Current step:** Phase D — matches, `match_participants`, persist mock match state on server.
