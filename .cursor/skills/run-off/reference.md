# Run Off — Risks & Deep Reference

Companion to [SKILL.md](SKILL.md). Read when implementing backend, progression, matches, or integrations.

---

## Data & activity risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **GPS sample volume** | DB cost, slow sync, app bloat | Summary + polyline in SQL; full tracks in Storage; downsample/archive |
| **Second activity model** | Import/sync bugs, duplicate logic | Single `ActivityRecord`; adapters at boundaries only |
| **Chart/grid mismatch** | Wrong x-axis, user distrust | One `buildDistanceGrid` for axis + `activityStreams` |
| **Cumulative distance drift** | Pace/XP wrong | Prefer device distance on import; recompute only when missing |
| **Short-run edge cases** | Empty charts, duplicate ticks | Grid decimals scale with distance; always include 0 and max |
| **GPS spoofing / cheating** | Fake match results | Server validation (02+); caps; speed/accuracy filters; later replay checks |
| **Foreground-only GPS** | Gaps when backgrounded | Document UX; pause or segment runs; background is a future milestone |

---

## Backend & Supabase risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Docs / milestone drift** | README says “planned”; agents ship wrong phase | [Docs sync checklist](SKILL.md#docs-sync-on-ship-required) on every phase ship |
| **Schema / app drift** | AI writes wrong columns; TS types lie | Migrations in git; `supabase gen types` → `database.ts`; commit together |
| **Duplicate catalogs** | `rank_tiers` in DB + `RANK_TIERS` in TS out of sync | DB only for reference data; fetch or join; no parallel lists |
| **Display strings on users** | Rename tier requires updating every profile | Store `competitive_rating`; join `rank_tiers` for labels |
| **Client-only profile creation** | OAuth redirect crash leaves user without `profiles` row | `handle_new_user` trigger on `auth.users` INSERT |
| **RLS gaps** | Data leaks between users/teams | RLS on every table; test policies per role |
| **Edge Function limits** | Timeouts on FIT parse / webhooks | Thin functions; async job queue for heavy work |
| **Offline sync conflicts** | Duplicate or lost runs | Idempotent upload keys; server wins on summary |
| **Token storage** | Strava/Garmin account compromise | Encrypt OAuth tokens; server-side only |
| **Vendor lock-in** | Hard migration | Portable Postgres schema; avoid Supabase-only SQL where possible |
| **Egress / storage cost** | Bill shock | Lifecycle rules on buckets; don’t sync full tracks by default |

---

## Progression (XP) risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Level ↔ rank coupling** | Pay-to-win feel, wrong matchmaking | Separate services and tables; enforce in code review |
| **Client-trusted XP** | Farming | `award_run_xp` RPC recomputes on server (03 Phase 4 shipped); local cache is display/offline only |
| **Inflation** | Level 50 in a week | Tune `levelCurve`; min distance; per-run cap; spreadsheet sims |
| **Level 99 reachable** | No long-term aspiration | Exponential curve; 99 practically unreachable by design |
| **Unclear earnings** | Users don’t trust system | `XpBreakdownLine[]` in ledger and drawer UI |

---

## Competition & match risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Level-based matchmaking** | Smurf / mismatch | Use `competitiveRating` only |
| **Unvalidated activities in matches** | Cheating | Activity must exist on server before match points |
| **Realtime complexity** | Flaky chat/scoreboard | Polling first; Supabase Realtime when stable |
| **Season reset anger** | Player churn | Optional soft decay; communicate seasons clearly |

---

## Mobile & UX risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Native module drift** | Crash after JS-only update | Document rebuild for AsyncStorage, Mapbox, Supabase |
| **Map camera bugs** | Auto-recenter, wrong zoom | `followRoute` vs `showRouteEndpoints`; fitBounds on post-run |
| **Mock data in prod paths** | Fake XP/stats | `__DEV__` gates; replace with context when milestone lands |
| **Xcode / iOS version** | Build failures | Expo 56 needs recent Xcode; see project dev notes |

---

## Security & privacy

| Risk | Mitigation |
|------|------------|
| Secrets in repo | `.env` gitignored; `EXPO_PUBLIC_*` only for anon keys |
| Location privacy | When-in-use permission; explain in copy |
| PII in logs | No full GPS tracks in console in production |
| Feed visibility | RLS + explicit audience (team/friends/public) when built |

---

## Testing mindset

| Area | Minimum bar |
|------|-------------|
| Recording | Start/stop; 0.05 mi walk; chart ticks align with distance |
| Maps | Live route color; post-run full route + endpoints; locked gestures |
| Storage | Relaunch app; activity still listed |
| XP (when live) | Breakdown sums to total; level-up animation; no rank change |
| Sync (when live) | Airplane mode record → upload when online |

---

## Terminology (use consistently)

| Term | Meaning |
|------|---------|
| **Activity / run** | Completed session with records |
| **ActivityRecord** | One GPS/sensor sample with cumulative distance |
| **StoredActivity** | Session + records + derived summary (local or synced) |
| **Level** | Derived from lifetime `totalXp` |
| **Rank / tier** | Competitive standing (Elo, percentile) |
| **Rank tier** | Row in `rank_tiers` catalog (display metadata) |
| **Progression** | XP + level systems |
| **Feed post** | `feed_posts` row linked to `activities` |
| **Audience** | `feed_posts.audiences[]` — which tabs show the post |
| **Match** | Solo or team competitive event (not a casual run) |

---

## Related docs

- [milestones/README.md](../../milestones/README.md) — chronological roadmap
- [01-activity-recording.md](../../milestones/01-activity-recording.md)
- [02-supabase-backend.md](../../milestones/02-supabase-backend.md)
- [supabase/SCHEMA.md](../../supabase/SCHEMA.md)
- [03-xp-and-ranking.md](../../milestones/03-xp-and-ranking.md)
- [04-third-party-integrations.md](../../milestones/04-third-party-integrations.md)
- [05-matchmaking-and-feed.md](../../milestones/05-matchmaking-and-feed.md)
