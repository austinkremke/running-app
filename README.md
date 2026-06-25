# Run Off

Expo 56 React Native running app — local GPS recording, Supabase backend, teams, activity feed, and progression (XP + rank).

## Docs

| Doc | Purpose |
|-----|---------|
| [milestones/README.md](milestones/README.md) | Roadmap (01 → 06) + status table |
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

## Env

Copy `.env.example` → `.env`. Required today:

- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `EXPO_PUBLIC_MOCK_GPS` — `1` in simulator, `0` on device
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (Google sign-in)

Social auth setup: [docs/auth-setup.md](docs/auth-setup.md)

## Run locally

```bash
npm install
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
| 03 XP & rank | Planned |
| 04 Garmin / Strava | Planned |
| 05 Matchmaking & feed | Planned (partial overlap with 02 Phase C) |

### Still mock / placeholder (honest)

| Area | State |
|------|--------|
| Match / matchmaking lineup UI | Mock (lineup tab); **active match screens from server** |
| Me tab profile, XP drawer on feed | Mock UI (XP not written to server) |
| Feed likes / comments | UI only (zeros) |
| Friends feed tab | Empty (no social graph yet) |
| Team stats / team activity feed | Placeholder sections |

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
2. Post-run → “Add to Activity Feed” creates `feed_posts` linked to synced `activities`.
3. Feed tabs load posts from Postgres (friends tab pending social graph).

**Matches (Phase D)**

1. Join **Road Warriors** → active team match vs Pacers loads on Team Match screen.
2. Open Solo Match → enrolls in demo solo match; home runner from your profile.
3. Runs started during an active match get `activities.match_id` on sync.

## Key services

| Area | Files |
|------|--------|
| Auth | `AuthContext.tsx`, `services/supabase.ts`, `services/profileService.ts` |
| Activities | `activitySync.ts`, `activityPolyline.ts`, `activitySyncQueue.ts` |
| Social | `feedService.ts`, `teamService.ts`, `socialMappers.ts` |
| Matches | `matchService.ts`, `matchMappers.ts`, `hooks/useActiveTeamMatch.ts`, `hooks/useActiveSoloMatch.ts` |
| Level (display stub) | `levelCurve.ts` — full XP in milestone 03 |

Details: [02-supabase-backend.md](milestones/02-supabase-backend.md).
