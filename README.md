# Run Off

Expo 56 React Native running app — local GPS recording, competitive matches, teams, and progression (XP + rank).

## Docs

| Doc | Purpose |
|-----|---------|
| [milestones/README.md](milestones/README.md) | Roadmap (01 → 05) |
| [milestones/02-supabase-backend.md](milestones/02-supabase-backend.md) | Backend plan — Phase A auth + Phase B activity sync |
| [supabase/SCHEMA.md](supabase/SCHEMA.md) | Database index + migration workflow |
| [AGENTS.md](AGENTS.md) | Agent / contributor quick rules |

## Stack

- **Expo 56** + custom navigation (`src/navigation/`)
- **Mapbox** — dev client build required (`npx expo run:ios`)
- **Supabase** — Auth, Postgres, Storage (activities sync on run stop)

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

Mapbox on device often needs a recent Xcode beta; see project notes in your shell history or team docs.

## Current status

| Milestone | Status |
|-----------|--------|
| 01 Activity recording (local) | Done |
| 02 Supabase — Phase A auth | Done |
| 02 Supabase — Phase B activity sync | Done |
| 02 Supabase — Phase C teams/feed | Next |
| 03 XP & rank | Planned |
| 04 Garmin / Strava | Planned |
| 05 Matchmaking & feed | Planned |

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

Details: [02-supabase-backend.md](milestones/02-supabase-backend.md).
