# Run Off — Agent Guide

## Docs (read first for big tasks)

| Resource | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview, env, backend Phase A summary |
| [.cursor/skills/run-off/SKILL.md](.cursor/skills/run-off/SKILL.md) | Architecture, patterns, anti-patterns, pre-ship checklist |
| [.cursor/skills/run-off/reference.md](.cursor/skills/run-off/reference.md) | Full risk catalog, terminology |
| [milestones/README.md](milestones/README.md) | Chronological roadmap (01 → 05) |
| [supabase/SCHEMA.md](supabase/SCHEMA.md) | DB index + migration/types workflow |

The **run-off** Cursor skill and `.cursor/rules/run-off.mdc` keep work consistent across tasks in this repo.

## Platform

Expo **56** — read https://docs.expo.dev/versions/v56.0.0/ before using platform APIs.

Mapbox requires a **dev client** build (`npx expo run:ios`), not Expo Go.

## Quick rules

- `ActivityRecord[]` is the source of truth for runs; maps/charts are derived.
- XP/level and competitive rank are **separate** (see milestone 03).
- Next backend: **Supabase** (milestone 02) — **Phase A first:** Auth → `auth.users` → trigger → `profiles` + progression rows.
- Summaries in Postgres, bulky tracks in Storage (Phase B+).
- **Reference catalogs** (`rank_tiers`, etc.) live in **Postgres + seed.sql** — not duplicated TS lists.
- **User state** = numbers (`competitive_rating`, `total_xp`) — not rank title strings on profiles.
- **Schema changes:** migration → `supabase gen types` → commit `database.ts` with SQL.
- Custom navigation in `src/navigation/` — not file-based Expo Router.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.
