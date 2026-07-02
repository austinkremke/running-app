# Run Off

Expo 56 React Native running app — local GPS recording, Supabase backend, teams, activity feed, and progression (XP + rank).

## Docs

| Doc | Purpose |
|-----|---------|
| [milestones/README.md](milestones/README.md) | Roadmap (01 → 06) + status table |
| [milestones/06-account-gating-and-cosmetics.md](milestones/06-account-gating-and-cosmetics.md) | Account settings, achievements, gates, rank avatar borders |
| [milestones/02-supabase-backend.md](milestones/02-supabase-backend.md) | Backend phases A–E (auth, sync, teams, feed, matches) |
| [supabase/SCHEMA.md](supabase/SCHEMA.md) | Database index + migration workflow |
| [AGENTS.md](AGENTS.md) | Agent / contributor quick rules |
| [docs/auth-setup.md](docs/auth-setup.md) | Apple + Google OAuth setup |

**Agents:** after shipping a milestone phase, run the **docs sync checklist** in [.cursor/skills/run-off/SKILL.md](.cursor/skills/run-off/SKILL.md#docs-sync-on-ship-required).

## Stack

- **Expo 56** + custom navigation (`src/navigation/`)
- **Mapbox** — dev client build required (`npx expo run:ios`)
- **Supabase** — Auth, Postgres, Storage
  - Activities sync on run stop (Phase B)
  - Teams, memberships, feed posts (Phase C)
  - Match shell: `matches`, `match_participants` (Phase D)
  - RLS helpers for `match_participants` + `feed_posts` / `activities` (post–Phase D fixes)

## Env

Copy `.env.example` → `.env`. Required today:

- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `EXPO_PUBLIC_MOCK_GPS` — `1` in simulator, `0` on device
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (Google sign-in)
- `EXPO_PUBLIC_DEV_XP_USER_ID` — optional; `__DEV__` only: lowers XP min distance to 0.01 mi for your user UUID (see `.env.example`)

Social auth setup: [docs/auth-setup.md](docs/auth-setup.md)

## Run locally

```bash
npm install
npm test                # XP calculator unit tests (ts-jest)
npx expo start          # Metro
npx expo run:ios        # Mapbox dev client (device/simulator)
```

After pulling schema changes: `supabase db push` (remote) or `supabase db reset` (local), then regen types.

Mapbox on device often needs a recent Xcode beta; see project notes in your shell history or team docs.

## Current status

| Milestone | Status |
|-----------|--------|
| 01 Activity recording (local) | **Done** |
| 02 Supabase — Phase A auth | **Done** |
| 02 Supabase — Phase B activity sync | **Done** |
| 02 Supabase — Phase C teams/feed | **Done** |
| 02 Supabase — Phase D matches | **Done** |
| 02 Supabase — Phase E hardening | **Next** |
| 03 XP & rank | **In progress** — Phase 1–2 + Phase 4 server XP shipped |
| 04 Garmin / Strava | Planned |
| 05 Matchmaking & feed | **Done** — Phase 1–5 shipped ([05](./milestones/05-matchmaking-and-feed.md)) |
| 06 Account, gating & cosmetics | **In progress** — Phase 1 settings + Phase 2 achievements ([06](./milestones/06-account-gating-and-cosmetics.md)) |

### Still mock / placeholder (honest)

| Area | State |
|------|--------|
| Match / matchmaking lineup UI | Team lineup mock; **solo Find Match + paired 1v1 from server** |
| Solo match live scoreboard + chat | **Shipped** — Realtime score updates + `match_messages` ([05 Phase 5](./milestones/05-matchmaking-and-feed.md)) |
| Team match chat | **Shipped** — server-backed when on active team match ([05 Phase 5](./milestones/05-matchmaking-and-feed.md)) |
| Solo match / Elo on completion | **Shipped** — queue, activity points, finalize → Elo ([05 Phase 4](./milestones/05-matchmaking-and-feed.md)) |
| Me tab profile | Name/avatar from server; **level + XP bar real**; **rank tier + rating from server**; achievements/stats still mock |
| Post-run XP drawer | **Real** staged breakdown + segmented bar fill on “Lock in your run” |
| Achievements on Me tab | **Shipped** — server unlocks + Community actions ([06 Phase 2](./milestones/06-account-gating-and-cosmetics.md)) |
| Account settings | **Shipped** — profile edit, avatar upload, units, sign out, delete account ([06 Phase 1](./milestones/06-account-gating-and-cosmetics.md)) |
| Feed likes / comments | **Shipped** — toggle like + comments drawer ([05 Phase 1](./milestones/05-matchmaking-and-feed.md)) |
| Friends feed tab | **Shipped** — mutual friends graph + friends-audience posts ([05 Phase 3](./milestones/05-matchmaking-and-feed.md)) |
| Team stats / team activity feed | Placeholder sections |
| Team match roster names | Mix of seeded `state_json` + real `team_members` overlay |

## Backend flow

**Auth (Phase A)**

1. User signs in on onboarding (Apple / Google / email).
2. Supabase Auth creates `auth.users`.
3. Postgres trigger creates `profiles`, `player_progress`, `player_rank`.
4. App stores session and loads profile.

**Activity sync (Phase B)**

1. Run stops → saved locally (`activityStorage.ts`).
2. If logged in → `activities` row + downsampled `polyline` in Postgres; full track in Storage.
3. If offline or sync fails → queued locally; flushed on next login.

**Social (Phase C)**

1. Team tab → join a team (seeded **Road Warriors** for dev).
2. Post-run → “Add to Activity Feed” syncs the activity if needed, then creates `feed_posts` linked to `activities`.
3. Feed tabs load posts from Postgres; each card shows a **static route map** from the activity `polyline`. The **Friends** tab shows runs from mutual friends; cards include pace highlights and side-by-side photo layout when available.
4. Feed engagement: toggle like (`feed_reactions`) and comment thread (`feed_comments`) on visible posts ([05 Phase 1](./milestones/05-matchmaking-and-feed.md)).

**Matches (Phase D)**

1. Join **Road Warriors** → active team match vs Pacers loads on Team Match screen.
2. Open Solo Match → enrolls in demo solo match; home runner from your profile.
3. Runs started during an active match get `activities.match_id` on sync.

**Progression (03 — local UI + server awards)**

1. Post-run → “Lock in your run” → `award_run_xp` RPC recomputes XP on server from activity data.
2. `xpCalculator` scores distance, pace vs rolling avg, elevation, streak, first-run-today (same formula client + server).
3. Local cache in AsyncStorage (`progressionStorage.ts`) for Me tab + XP drawer; server `player_progress.total_xp` is authority after lock-in.
4. Feed cards show level from server `player_progress.total_xp` on post author profiles.

Details: [03-xp-and-ranking.md](milestones/03-xp-and-ranking.md).

## Key services

| Area | Files |
|------|--------|
| Auth | `AuthContext.tsx`, `services/supabase.ts`, `services/profileService.ts` |
| Activities | `activitySync.ts`, `activityPolyline.ts`, `activitySyncQueue.ts` |
| Social | `feedService.ts`, `feedEngagementService.ts`, `rankService.ts`, `teamService.ts`, `socialMappers.ts` |
| Feed route preview | `StaticRouteMapPreview.tsx`, `polylineToGpsPoints` in `activityAdapters.ts` |
| Matches | `matchService.ts`, `matchMappers.ts`, `hooks/useActiveTeamMatch.ts`, `hooks/useActiveSoloMatch.ts` |
| Progression | `PlayerProgressContext.tsx`, `services/progression/*`, `storage/progressionStorage.ts` |

Details: [02-supabase-backend.md](milestones/02-supabase-backend.md).
