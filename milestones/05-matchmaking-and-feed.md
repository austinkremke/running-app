# Matchmaking, Feed & Social Sync

> **Milestone:** 05  
> **Status:** **Done** — Phase 1–6 shipped  
> **Depends on:** [02 Supabase](./02-supabase-backend.md) (Phase A–D shipped; Phase C `feed_posts` required for Phase 1)  
> **Unblocks:** [07 Team play](./07-team-play.md) (solo queue/Elo/completion patterns to mirror)

---

## Goal

Replace remaining mock match/social data with server-backed state: real opponents, persisted results, competitive rank updates — while keeping **level (XP)** and **rank (Elo)** separate per [03](./03-xp-and-ranking.md).

**Partially done in milestone 02:** `feed_posts`, team join/list, community + team feed tabs, active match screens (Phase D), static route maps on feed cards. **Phase 1 shipped:** persisted likes & comments. **Phase 2 shipped:** Elo rank UI. **Phase 3 shipped:** friends graph + friends feed + richer cards. **Phase 4 shipped:** solo matchmaking queue + pairing, activity scoring, match completion → Elo. **Phase 5 shipped:** live solo scoreboard (Realtime + post-run refresh), live countdown, persisted match chat (solo + team). **Phase 6 shipped:** reliable match-completion drawer, friend solo challenges, match-tab indicators, solo streak highlights, mid-match forfeit, instant Match tab navigation.

---

## Scope

| Area | Today | Target |
|------|-------|--------|
| Solo / team matches | **Solo** queue + paired 1v1 from server; **friend challenges** send/accept; **forfeit** mid-match; team lineup still mock | **Active** match screens from Postgres; team lineup still mock |
| Match results | **Solo** runs credit match points; due matches finalize → Elo; **completion drawer** on end/forfeit; season record in payload | Runs linked to `activity_id`; Elo update |
| Match UX | **Tab indicators** (active match + incoming challenge); **streak highlights** on active solo screen; **instant** Match tab nav | Real-time polish |
| Feed | **Server** posts + **static route maps**; **persisted likes & comments**; **friends feed**; pace highlights + photo layout; **live solo scoreboard** | Real-time polish |
| Teams | **Server** (join, members, top list) — stats/activity mock | Full team stats, activity stream |
| Team chat | **Server** `match_messages` + Realtime | Realtime or polled messages ([02](./02-supabase-backend.md)) |
| Leaderboards | Top teams from DB; **solo Me rank from server**; team rank card still synthetic | `competitive_rating` aggregates + seasonal snapshots |

---

## Rollout phases

### Phase 1 — Feed likes & comments **shipped**

**Shipped:** `feed_reactions`, `feed_comments`, RLS via `can_view_feed_post`, `feedEngagementService.ts`, optimistic like toggle + `FeedCommentsDrawer` on `RunCard`.

**Out of scope for Phase 1**

- Friends tab, reply threads, notifications, emoji reactions beyond like

**Depends on:** [02 Phase C](./02-supabase-backend.md) `feed_posts` (shipped).

---

### Phase 2 — Elo & rank UI **shipped**

**Shipped:** `apply_elo_match_result` RPC (server Elo), revoked client `player_rank` updates, `rankService` + `tierFromRating`, `useRankDisplay` hook; Me tab RANK + Solo match tab profile/season record from `player_rank` + `rank_tiers`.

**Out of scope for Phase 2**

- Match completion auto-invoking Elo (wire when match results ship in Phase 4)
- Global percentile / leaderboard rank on active match screen
- Team rank card / top teams from real competitive aggregates

### Phase 3 — Friends feed & richer cards **shipped**

**Shipped:** `friendships` graph + `add_friend` RPC, friends feed tab (posts with `friends` audience from mutual friends), `Add Friend` on community cards, pace highlight chip + side-by-side map/photo layout, `add_friend` achievement active.

**Manual QA (needs two accounts):** Sign in as User A on one device/simulator and User B on another. From Community, B taps **Add Friend** on A’s post → B’s Friends tab should show A’s runs (new lock-ins include `friends` audience). Verify pace highlight on runs with chart data in `summary_json`.

*Note: “Feed from real activities” shipped in [02 Phase C](./02-supabase-backend.md) — create post + community/team tabs + route maps.*

### Phase 4 — Matchmaking **shipped**

**Shipped:** `match_queue` + `enqueue_solo_matchmaking` / `cancel_solo_matchmaking` / `get_solo_matchmaking_status` RPCs; rating-band pairing (±400); `credit_match_activity` on synced runs (≥0.1 mi); `finalize_solo_match` → `apply_elo_match_result_system`; solo tab Find Match UI; real opponent on active solo screen; `first_win` / `ten_wins` achievements active.

**Manual QA (needs two accounts):** User A and B both tap **Find Match** on Solo tab (or A waits, B joins) → both should land in the same active 1v1. Each logs a run ≥0.1 mi while matched → points update on scoreboard. After `ends_at` (or call finalize via opening match after window), winner gets Elo + season win.

- Queue / pairing worker (not in Supabase alone); power from rank, not level

### Phase 5 — Real-time polish **shipped**

**Shipped:** Supabase Realtime on `match_participants`, `activities`, `matches`, `match_messages`; `useMatchRealtimeRefresh` + silent refresh on solo/team active match hooks; `notifyMatchRefresh` after `credit_match_activity`; live countdown via `useLiveCountdown`; `match_messages` table + `matchChatService` / `useMatchChat`; solo + team chat drawers wired to server.

**Manual QA (needs two accounts in solo match):** User A and B in active 1v1. A finishes a run → B’s scoreboard updates without leaving the screen. Either user sends match chat → other sees message in drawer.

**Out of scope:** team lineup mock; team scoreboard still reads demo `state_json` until team scoring ships.

**Match scoring (v1):** `match_points_for_activity` — base ~10 pts/mi (≥0.1 mi), pace multiplier vs fixed **10:00/mi** reference (0.85×–1.25×). See migration `20250625000001_match_pace_scoring.sql`.

### Phase 6 — Solo match UX, challenges & forfeit **shipped**

**Shipped:**

- **Match completion flow** — `get_my_solo_match_completions` RPC; `persist_solo_match_completions` on finalize; `evaluate_achievements_system` for cross-user finalize; `SoloMatchCompletionProvider` + result drawer with Elo/season record; centralized sync on mount, foreground, route change, and match-end events.
- **Friend solo challenges** — `solo_match_challenges` table; RPCs `send_solo_match_challenge`, `accept_solo_match_challenge`, `decline_solo_match_challenge`, `cancel_solo_match_challenge`, `get_solo_match_challenge_status`, `has_incoming_solo_match_challenge`; `ChallengeFriendDrawer` + `IncomingChallengeCard` + `ProposedChallengeCard` on Solo tab; accept creates live 1v1 via `create_solo_match_for_users`.
- **Match tab indicators** — red dot on bottom **Match** tab when user has a live solo/team match or an **incoming** friend challenge; red dot on **Solo** sub-tab when a challenge awaits accept (`useMatchTabIndicators`, `TabAppHeader` badges).
- **Active match highlights** — current run streak (`player_progress.streak_days`), best pace, longest run on solo match screen; best win streak on season record card (`fetchSoloBestWinStreak`).
- **Mid-match forfeit** — `forfeit_solo_match` RPC; ⋮ menu → Quit Match → confirmation; quitter loses, opponent wins, Elo + season record update; completion drawer for forfeiter.
- **Navigation perf** — Match tab navigates immediately; solo-match redirect and completion sync run in background (`fetchActiveSoloMatchId` with `skipFinalize` for lightweight checks).
- **Stale match hygiene** — active team/solo queries ignore expired `ends_at`; demo seed matches should not leave zombie `status = active` rows.
- **In-app notification drawer** — global `InAppNotificationProvider` + bottom drawer surfaces incoming friend challenges with accept/decline anywhere in the app (polls challenge status every 10s + on foreground; `InAppNotificationContext.tsx`, `InAppNotificationDrawer.tsx`).

**Manual QA (friend challenge, two accounts):** User A opens Solo tab → **Challenge Friend** → picks B → send. B sees red dots on Match + Solo tabs → opens Solo → **Accept** → both land in active 1v1. Decline/cancel clears pending state and indicators.

**Manual QA (forfeit):** User A in active solo match → ⋮ → **Quit Match** → confirm. A sees loss in completion drawer; B gets win on next app sync / completion poll.

**Key client files:** `challengeService.ts`, `useSoloMatchChallenges.ts`, `SoloMatchCompletionContext.tsx`, `soloMatchCompletionFlow.ts`, `useMatchTabIndicators.ts`, `SoloMatchOptionsDrawer.tsx`, `matchmakingService.ts` (`forfeitSoloMatch`).

**Migrations:** `20250625000002_match_finalize_results.sql`, `20250625000003_persist_match_completion.sql`, `20250625000004_solo_completion_sync.sql`, `20250625000005_fix_finalize_achievements.sql`, `20250625000006_solo_friend_challenges.sql`, `20250625000007_solo_match_forfeit.sql`.

### Future follow-ups (milestone 05 backlog)

- [ ] **Dynamic pace scoring** — replace the fixed 10:00/mi reference with a personalized or opponent-relative model (e.g. runner rolling avg pace, match-type config in `match_types`, or head-to-head pace bonus). Goal: same distance should reward faster effort without a single global benchmark. v1 clamp + reference constants live in `match_points_for_activity` / `matchScoring.ts`.

---

## Rules (from milestone 03)

- **Matchmaking uses `competitive_rating`**, not player level.
- **XP** may bonus on match win; **rank** moves only from match outcome.
- **Activities** must exist on server ([02](./02-supabase-backend.md)) before counting toward match points.

---

## Open decisions

1. ~~Feed likes: toggle per user or count-only?~~ **Decided (Phase 1):** per-user like row; toggle on tap.
2. Comments: edit/delete own only in v1?
3. Team matches before solo Elo, or parallel?
4. Seasonal rank reset?
5. Minimum activity validation before match points count?
6. **Dynamic pace scoring:** fixed 10:00/mi reference (v1 shipped) vs rolling avg / opponent-relative / `match_types` config — see [05 backlog](./05-matchmaking-and-feed.md#future-follow-ups-milestone-05-backlog).

---

## Summary

**Ship next:** [07 Team play](./07-team-play.md); then [02 Phase E — hardening](./02-supabase-backend.md) or [06 Phase 5 — paywall](./06-account-gating-and-cosmetics.md).
