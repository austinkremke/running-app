# Run Off — Agent Guide

## Docs (read first for big tasks)

| Resource | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview, env, status, backend flows |
| [.cursor/skills/run-off/SKILL.md](.cursor/skills/run-off/SKILL.md) | Architecture, patterns, anti-patterns, pre-ship + **docs sync** checklist |
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
- **Milestone 02:** Phase A–C shipped (auth, activity sync, teams/feed); **Phase D matches** is next.
- Summaries in Postgres, bulky tracks in Storage.
- Feed + team screens read from Supabase (`feedService`, `teamService`); match/Me XP UI still mock.
- **Reference catalogs** (`rank_tiers`, etc.) live in **Postgres + seed.sql** — not duplicated TS lists.
- **User state** = numbers (`competitive_rating`, `total_xp`) — not rank title strings on profiles.
- **Schema changes:** migration → `supabase gen types` → commit `database.ts` with SQL → **update all READMEs** (see skill).
- Custom navigation in `src/navigation/` — not file-based Expo Router.

## Docs sync (required on ship)

When completing a milestone or backend phase, run the checklist in [SKILL.md § Docs sync](.cursor/skills/run-off/SKILL.md#docs-sync-on-ship-required) before commit.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.
