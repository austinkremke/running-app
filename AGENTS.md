# Run Off — Agent Guide

## Docs (read first for big tasks)

| Resource | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview, env, status, backend flows |
| [.cursor/skills/run-off/SKILL.md](.cursor/skills/run-off/SKILL.md) | Architecture, patterns, anti-patterns, pre-ship + **docs sync** checklist |
| [.cursor/skills/run-off/reference.md](.cursor/skills/run-off/reference.md) | Full risk catalog, terminology |
| [milestones/README.md](milestones/README.md) | Chronological roadmap (01 → 06) |
| [milestones/03-xp-and-ranking.md](milestones/03-xp-and-ranking.md) | XP formula, phases, unit tests |
| [milestones/06-account-gating-and-cosmetics.md](milestones/06-account-gating-and-cosmetics.md) | Account settings, achievements, gates, cosmetics |
| [supabase/SCHEMA.md](supabase/SCHEMA.md) | DB index + migration/types workflow |

The **run-off** Cursor skill and `.cursor/rules/run-off.mdc` keep work consistent across tasks in this repo.

## Platform

Expo **56** — read https://docs.expo.dev/versions/v56.0.0/ before using platform APIs.

Mapbox requires a **dev client** build (`npx expo run:ios`), not Expo Go.

## Quick rules

- `ActivityRecord[]` is the source of truth for runs; maps/charts are derived.
- XP/level and competitive rank are **separate** (see milestone 03). XP awards are **server-authoritative** via `award_run_xp` RPC; local AsyncStorage cache for offline UX.
- **Milestone 02:** Phase A–D shipped; **Phase E hardening** is next.
- **Milestone 05:** Phase 1–6 shipped (feed engagement, Elo UI, friends feed, solo matchmaking, live scoreboard + chat, completion drawer, friend challenges, forfeit, tab indicators, in-app challenge notification drawer).
- **Milestone 06:** Phase 1–4 shipped (account settings, achievements, rank avatar borders, level gates); Phase 5 paywall next. Level gates: `feature_gates` catalog in DB, server triggers + `useFeatureGate` locked UI — never hardcode thresholds in TS.
- **Milestone 08 (shipped v1):** run detail screen — tap any feed run → hero route map (tap → fullscreen `interactive` map modal), primary stats, pace/elevation/HR charts, mile splits (`computeMileSplits` → `summary_json.splits`, null-safe), match badge, likes/comments, and delete own run (`delete_activity` RPC). `RunDetailScreen` + `activityDetailService`. See [milestones/08-run-detail.md](milestones/08-run-detail.md).
- **Milestone 07 (in progress):** team play — Phase 1–4 shipped: creation/management (`create_team` L10-gated, role-checked RPCs, leader auto-succession), `team_rank` + real Team tab stats (`get_team_overview` / `list_top_teams`), team matchmaking queue (`enqueue_team_matchmaking`, leader/co-leader only; `TeamMatchTab` de-mocked), and real top-N scoring + finalize (`finalize_team_match` sums top-5 point-earners' synced activities per side, applies team Elo via `apply_team_elo_match_result_system`, persists per-team completion; `TeamMatchCompletionProvider`/`TeamMatchResultDrawer` mirror the solo win/loss/tie notification). **Invites & join requests** shipped (`team_membership_requests`; feed-bell notification center + in-app popups + bell/feed-tab badges). Next: Phase 5 — retire the seeded demo match, team season record card. See [milestones/07-team-play.md](milestones/07-team-play.md).
- Summaries in Postgres, bulky tracks in Storage.
- Feed + team screens read from Supabase (`feedService`, `teamService`); feed cards show static route maps from `activities.polyline`; likes/comments persisted on `feed_posts`.
- Post-run “Add to feed” uses `publishActivityToFeed` (sync activity, then `feed_posts` insert).
- XP awards on “Lock in your run” via `award_run_xp` RPC (server recompute); local cache in AsyncStorage; run `npm test` after XP formula changes.
- **Reference catalogs** (`rank_tiers`, etc.) live in **Postgres + seed.sql** — not duplicated TS lists.
- **User state** = numbers (`competitive_rating`, `total_xp`) — not rank title strings on profiles.
- **Schema changes:** migration → `supabase gen types` → commit `database.ts` with SQL → **update all READMEs** (see skill).
- Custom navigation in `src/navigation/` — not file-based Expo Router.

## Docs sync (required on ship)

When completing a milestone or backend phase, run the checklist in [SKILL.md § Docs sync](.cursor/skills/run-off/SKILL.md#docs-sync-on-ship-required) before commit.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.
