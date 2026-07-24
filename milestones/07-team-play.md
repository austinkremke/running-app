# Team Play — Creation, Management & Team Matchmaking

> **Milestone:** 07  
> **Status:** In progress — Phase 1–4 shipped (creation/management, team rating, matchmaking queue, real activity scoring + finalize/completion); Phase 5 (retire the demo match, full UX polish) next  
> **Depends on:** [02 Supabase](./02-supabase-backend.md) (Phase C teams + Phase D match shell), [03 XP & rank](./03-xp-and-ranking.md) (rank separation rules), [05 Matchmaking & feed](./05-matchmaking-and-feed.md) (solo queue/Elo/completion patterns to mirror), [06](./06-account-gating-and-cosmetics.md) Phase 4 (`feature_gates` — `create_team` reserved at L10)  
> **Unblocks:** team challenges, seasonal team leaderboards

---

## Goal

Replace the seeded demo team match and mock lineup with a real team lifecycle: **create → manage → queue → compete → team Elo**. Mirror the solo matchmaking architecture (05 Phase 4–6) wherever it fits; diverge only where teams are genuinely different (roles, roster scoring, shared rating).

**Already real today:** `teams` / `team_members` (roles: `leader` / `co-leader` / `member`, unique `tag`, `member_max 30`, one team per user), join/leave, `matches.home_team_id` / `away_team_id`, `team_3day` match type, team match chat (`match_messages`), Realtime refresh, match tab indicators.

**Still mock/demo:** team creation (does not exist), team management UI, lineup tab, team scoreboard (seeded `state_json` + live-member overlay), team rank card, top-teams ordering.

---

## Decided design (v1)

| Decision | Choice | Why |
|----------|--------|-----|
| **Match scoring** | **Top-N contributors** — everyone on the roster can run; only the top N point-earners per side count toward the team score (N from `match_types` config, default 5). **Planned add-on:** modest **balance bonus** (below) — does not replace top-N | Fair across roster sizes; no lineup management friction; internal competition for a scoring spot; bonus nudges depth without punishing stars |
| **Team rating** | **Separate team Elo** — `team_rank` mirrors `player_rank` (`competitive_rating`, season W/L); moves only from team match results | Survives roster churn; individual Elo untouched by team play; reuses the proven Elo RPC pattern |
| **Queue rights** | **Leader + co-leaders** enqueue/cancel (and accept future team challenges) | Matches existing role model; delegation via promotion; members see “ask your leader” state |
| **Creation access** | **Activate `create_team` gate at level 10** (`feature_gates` UPDATE — no code change); **joining stays free at any level** | Leading a team is an invested-user feature; social hook stays open for new users |
| **Roster snapshot** | Participants enrolled **at pairing time**; mid-match joiners don’t score, leavers keep their points on the board | Prevents mid-match ringers; matches solo’s fixed-participant model |

**Rank separation rules still apply ([03](./03-xp-and-ranking.md)):** runs during team matches earn normal personal XP and count toward team points; **personal `competitive_rating` never moves from team matches**; matchmaking pairs on `team_rank.competitive_rating` only.

### Planned — balance bonus (post–Phase 4)

**Intent:** encourage teams to spread contribution across members without making equality the win condition.

**Shape (agreed direction):**

- Keep **top-N raw points** as the primary team score (stars still matter).
- Apply a **modest multiplier** (target band ~0–15%) when the top-N scorers’ contributions are more even.
- Prefer a tolerant similarity metric (e.g. share-of-points from #1, or CV/Gini across the top-N) — **not** “everyone within 5%,” which wrecks real-life variance (injury, travel, fitness gaps).
- Surface clearly on the scoreboard (“Balance bonus +12%”) so mid-match trust stays high.
- **Do not** replace top-N, and **do not** make balance so strong that stars sandbag or pad equal junk miles.

**Out of scope for this bonus:** participation cosmetics / XP-only rewards (still a fine separate lever later); hard min-contributor floors (simpler cousin — can ship first if the curve feels too gameable).

---

## Rollout phases

### Phase 1 — Team creation & management **shipped**

**Shipped (migration `20250703000001_team_management.sql`):**

- `create_team` RPC — `assert_feature_gate('create_team')`, tag/name/motto validation, team + leader membership in one transaction; **gate activated** (`is_active = true`, L10)
- Management RPCs (security definer, role-checked): `update_team` (leader/co; tag immutable), `promote_member` / `demote_member` / `transfer_leadership` (leader), `kick_member` (leader any non-leader; co-leader members only), `disband_team` (leader; blocked during active team match)
- **Leave rules (revised from plan):** leader departure **auto-promotes a successor** (longest-tenured co-leader, else member) via row trigger — covers `delete_own_account` cascade so a leader deleting their account never blocks or bricks the team; explicit `transfer_leadership` remains the in-app path. Last member out auto-disbands (trigger).
- UI: **Create a Team** button on the join prompt (locked “Reach level 10” below gate via `useFeatureGate('create_team')`); `TeamFormDrawer` (create + edit modes: name, tag, motto, logo icon/accent with live preview); roster row **⋮ menu** (promote/demote/transfer/remove with confirmations); `TeamManageSection` (Edit Team, Disband, Leave)

**Known v1 limits:** member ⋮ menu uses `Alert` (iOS-first; Android caps at 3 buttons).

**Post-ship additions:** join prompt is now a **real team browser** (`list_top_teams` → join any non-full team; hardcoded Road Warriors join removed); Me tab shows the user's **real team name** (hidden when teamless); team XP bar removed (level badge only — combined-XP level is a snapshot, not a progression; clan points bar is backlog); Match tab shows a **“No active team match” empty state** instead of the mock Road Warriors vs Pacers fallback.

**Key files:** `teamService.ts` (create/update/promote/demote/kick/transfer/disband), `TeamFormDrawer.tsx`, `TeamManageSection.tsx`, `TeamScreen.tsx`.

### Phase 2 — Team rating & top teams **shipped**

**Shipped (migration `20250703000002_team_rank_and_stats.sql`):**

- `team_rank` (`team_id` PK, `competitive_rating` default 1000, season W/L); provisioned by trigger on `teams` insert + backfill; read-all RLS, system-only writes
- `apply_team_elo_match_result_system` — team mirror of the solo Elo RPC (wired to finalize in Phase 4)
- `get_team_overview` RPC (security definer — teammates' activities are RLS-protected): rating, season record, rank position + team count, 7-day + lifetime team distance, per-member 7-day distance
- `list_top_teams` RPC: one round-trip, ordered by real rating, includes member count + combined member XP
- **Team tab de-mocked:** team level/XP = combined member lifetime XP on the shared curve; rank card = real position (`#N`, `Top X% of N teams`, `—` offline); stats = members / 7-day miles / season record; member rows show real 7-day distance + `Joined <date>` instead of fake presence
- **Top Teams de-mocked:** ordered by rating; points column = `competitive_rating`; level = combined member XP

### Phase 3 — Team matchmaking queue **shipped**

**Shipped (migration `20250703000003_team_matchmaking.sql`):**

- `team_match_queue` (`team_id`, `match_type_id`, `competitive_rating`, `status`, `enqueued_by`); RLS: own-team members can read the queue row (drives searching state)
- RPCs mirroring solo: `enqueue_team_matchmaking` / `cancel_team_matchmaking` / `get_team_matchmaking_status` — leader/co-leader role check inside; min roster (`team_min_roster_to_queue` = 2); team rating from `team_rank`
- `try_pair_team_queue` mirrors `try_pair_solo_queue`: rating band ±400, same match type, different teams; creates `matches` row (`kind = 'team'`, both `*_team_id`) and `enroll_team_roster` enrolls **all current members of both teams** as `match_participants` with `team_id` + side (roster snapshot at pairing)
- **Team tab de-mocked** (`TeamMatchTab`): real team summary (name, level, `competitive_rating`) from `useMyTeam`; real match format from `match_types`; **Find Match** via `useTeamMatchmaking` (`teamMatchmakingService`) with searching state + poll; leader/co-leader gating with "only leaders" notice; roster-too-small + no-team empty states. `MOCK_MATCHMAKING` and the lineup picker (`LineupSection` / `AvailableRunnersSection`) removed — top-N scoring needs no pre-match lineup.

**Post-ship fix (`20250705000001_team_3day_top_n_copy.sql`):** the `team_3day` match_types row still had pre-decision copy describing a "lineup" ("Your lineup has 3 days...", "the more miles your lineup covers"), left over from before the top-N scoring decision. Updated `overview` / `scoring_details` to describe the actual rule: everyone on the roster can run, no pre-match lineup, only the team's top 5 point-earners count toward the score. No client change needed — `TeamMatchTab` already renders this row's text dynamically via `fetchTeamMatchType`.

**Post-ship fix (`20250706000001_temp_team_min_roster_1.sql` / rollback):** `team_min_roster_to_queue` temporarily lowered 2 → 1 for 2-phone live testing (paired client-side `TeamMatchTab.MIN_ROSTER`); revert together once testing wraps.

**Post-ship fix (`20250707000001_activities_select_team_match.sql`):** the active team match screen showed only the viewer's own side (or nothing) — `overlayLiveHomeMembers` in `matchMappers.ts` only overlaid live roster data onto the home side, and RLS (`activities_select_own`) blocked reading teammates'/opponents' `activities` rows entirely. Fixed by generalizing the overlay to both sides (`overlayLiveMembers`, fed by `fetchLiveTeamMembers` for both `home_team_id`/`away_team_id`) and adding a permissive `activities_select_team_match_participants` RLS policy so any match participant can read both rosters' synced runs. Also fixed the scoreboard header (tiny unbordered logos, "LEAD BY 0 PTS" instead of tied, team-name wrap) to reuse `TeamAvatar` with a real `rankTierId` and mirror the solo scoreboard's vertical layout.

### Phase 4 — Scoring, finalize & completion **shipped**

**Shipped (migration `20250707000003_team_match_finalize.sql`):**

- `finalize_team_match(match_id)`: for each side, sums `match_points_for_activity` per teammate over synced `activities` in the match window (`matches.created_at` → `ends_at`), keeps the **top 5 point-earners** (hardcoded N=5, matching the `team_3day` copy — no separate `scoring_top_n` column), and totals those into the team score. Decides win/loss/tie, calls the existing (system-only) `apply_team_elo_match_result_system` on a non-tie, marks the match `completed`, and persists a per-team completion payload (outcome, points, opponent name, rating delta/new rating, season record) into `state_json.completions` keyed by `team_id` — so **either** team's client can read its own result even if it wasn't the device that triggered finalize.
- `finalize_due_team_matches_for_user(user_id)`: finds the caller's team's active-but-past-`ends_at` matches, finalizes each, and returns the caller's team's completion. Client-only entry point (mirrors `finalize_due_solo_matches_for_user`); `finalize_team_match` itself is not granted to `authenticated`.
- `get_my_team_match_completions(user_id, limit)`: reads persisted completions from `state_json` for the caller's team, so a device that missed the live finalize (e.g. the losing race in a 2-device test) still sees the drawer next time it polls.
- Client mirrors the solo stack file-for-file: `teamMatchCompletionBus.ts` / `teamMatchCompletionFlow.ts` / `storage/teamMatchResultStorage.ts` (seen-tracking) / `TeamMatchCompletionContext.tsx` (3s poll + AppState-active + route-visit triggers) / `TeamMatchResultDrawer.tsx` (win/loss/tie, rating delta, season record). Provider mounted in `RootNavigator` alongside `SoloMatchCompletionProvider`.
- Team forfeit (leader/co-leader, mirror `forfeit_solo_match`) — not shipped, backlog.

**Also shipped alongside (`matchService.ts`):** real scoring/pace/activity feed on the active match screen itself (previously always 0) — computed from the same synced `activities` window, with a "View All" full match activity screen and tap-through to the run detail screen.

**Post-ship fix (`20250707000006_fix_finalize_team_match_cast.sql`):** `finalize_team_match` never actually finalized any match — `match_points_for_activity(numeric, numeric)` was called with `activities.distance_meters` (`double precision`) and `duration_seconds` (`integer`) with no cast; Postgres only allows an *assignment* cast float8→numeric, not an *implicit* one, so the call threw `function does not exist` every time, silently rolling back the whole transaction (status, Elo, completion) and leaving the match `active` forever with no drawer and no rating change. Looked like a permissions bug (mirroring an old solo-match issue) but wasn't — fixed with explicit `::numeric` casts, verified read-only against a live stuck match before shipping.

**Also shipped:** completed team matches now show up as rows in the Team Activity section on the Team screen (`fetchTeamMatchHistory` in `matchService.ts` + `TeamActivityMatchRow.tsx`) — both teams' logos, names, final score, and a win/loss/tie badge relative to the viewer's team, read directly from `matches` (RLS already allowed team members to read any match, completed or not, via `can_view_match`) rather than the per-team `state_json.completions` payload.

**Also shipped (`20250708000001_team_match_feed_posts.sql`):** completed team matches now post to the main app feed as their own card (`TeamMatchFeedCard.tsx`), reusing `feed_posts`/`feed_reactions`/`feed_comments` so likes and comments work identically to a run post. `feed_posts.activity_id`/`user_id` are now nullable and a new nullable `match_id` column was added (exactly one of activity_id/match_id must be set, enforced by a check constraint); `finalize_team_match` inserts the post itself when a match completes (existing matches backfilled in the same migration). Visibility is a dedicated additive RLS policy (`feed_posts_select_team_match`) — viewer must be on one of the two teams, or friends with someone on either team — never audience-tagged as `community`/`friends`/`team`, so the existing author-scoped policies never match these rows. `can_view_feed_post` (gates `feed_reactions`/`feed_comments`) got the same rule added so engagement works. Client: `fetchTeamMatchFeedPosts` in `matchService.ts` merges match posts into the same feed alongside runs (`useFeed`'s `FeedItem` discriminated union, sorted by a shared raw-ISO `sortKey` — `Run` gained an optional `postedAtIso` for this). Card headline reads "{Winner} Defeated {Loser}" (or "{Home} Tied {Away}").

**Also shipped (`20250708000002_team_logo_upload.sql`, `20250708000003_list_top_teams_logo_url.sql`):** teams can use a custom uploaded logo image instead of the icon/accent combo — leader/co-leader-only, edit mode. New nullable `teams.logo_url`; `update_team` gained `p_logo_url` (`null` = unchanged, `''` = clear back to icon/accent, else the new URL). Reuses the existing public `avatars` storage bucket (already scoped to `auth.uid()`-prefixed paths) rather than a new bucket — team-logo write access is gated at the RPC/role layer, not storage path ownership. Client: `teamLogoUpload.ts` (`pickTeamLogoUri` — same `allowsEditing`/`aspect:[1,1]` square-crop UX as the existing profile-avatar picker — + `uploadTeamLogo`), `TeamFormDrawer.tsx` photo picker with a "Remove photo" fallback to icon/accent. `TeamAvatar.tsx` gained an `imageUrl` prop (renders the custom logo, still wrapped in the same rank-tier border ring); threaded through every `Team`/`TopTeamListing`/`TeamMatchTeam`/`TeamMatchHistorySide` consumer (team header, top teams list, active match scoreboard, match history rows, match feed cards) — not yet threaded into `NotificationCenterDrawer`/`TeamJoinPrompt`/the team-browser "join" list, which still show icon/accent only (their underlying RPCs don't return `logo_url` yet).

### Phase 5 — Team match UX (retire the demo)

- Both rosters real, live contributor scoreboard/scoring, and win/loss/tie completion **shipped ahead of schedule** in Phase 4's post-ship fixes (above) — this phase is now just the remaining cleanup items below.
- Migration: complete/cancel the seeded Road Warriors vs Pacers demo match (teams remain as real teams); confirm `MOCK_ACTIVE_TEAM_MATCH` fallback in `matchService.ts` is dead code and remove it
- Team season record card from `team_rank`
- Tab indicators: `useMatchTabIndicators` already covers active team matches — extend for team queue "searching" state

### Invites & join requests **shipped**

**Shipped (migration `20250703000004_team_membership_requests.sql`):** unified `team_membership_requests` table (`kind` invite|request; `user_id` = prospective member; `created_by` = initiator; one pending per team+user).

- **Invite** (leader/co-leader → user): `invite_to_team`; recipient accepts/declines via `respond_to_team_invite`.
- **Request** (user → team): `request_to_join_team`; leaders/co-leaders accept/decline via `respond_to_join_request`. The team browser’s **JOIN button is now REQUEST** — joins go through approval.
- **Auto-accept shortcut:** inviting a user who already requested (or requesting a team that already invited you) joins immediately.
- **Notifications:** `get_team_notifications` returns the caller’s relevant pending items (invites to me + requests for teams I lead); `has_team_notifications` drives indicators. Delivered two ways, mirroring solo challenges:
  1. **Feed bell** (top-left) → `NotificationCenterDrawer` lists all pending items with accept/decline; badge on the bell **and** the Feed bottom-tab icon (like the active-match dot).
  2. **In-app auto-popup** via `InAppNotificationContext` (generic accept/decline drawer) when a new invite/request arrives.
- **Invite picker** (`InviteToTeamDrawer`, leaders/co-leaders from the roster): friends **not on a team** first, plus search across all teamless users; per-row Invite. `fetchInvitableFriends` / `searchInvitableUsers` filter `team_id is null`.

**Key files:** `teamMembershipService.ts`, `useTeamNotifications.ts`, `teamNotificationBus.ts`, `NotificationCenterDrawer.tsx`, `InviteToTeamDrawer.tsx`, `InAppNotificationContext.tsx`.

**Known v1 limits:** "unread" = any pending item (no per-item read state); notifications poll every 10–15s (no Realtime yet); accept/decline is honor of first responder for join requests (any leader can act).

### Backlog (not v1)

- [ ] Realtime delivery for invites/requests (replace polling)
- [ ] Team challenges (directed team-vs-team invites — mirror `solo_match_challenges`)
- [ ] Seasonal resets + team leaderboard snapshots
- [ ] Leader-picked lineup as an alternative match type (uses existing lineup UI concepts)
- [x] ~~Team stats / team activity stream~~ **shipped** — real `team_rank` stats (Phase 2) + Team Activity showing the team's 5 latest runs (`TeamActivitySection` → `fetchFeedPosts('team', …)`), same data the Feed's Team tab shows.
- [ ] Dynamic pace scoring shared with [05 backlog](./05-matchmaking-and-feed.md#future-follow-ups-milestone-05-backlog)
- [ ] **Balance bonus** on team match finalize — modest multiplier when top-N contributions are more even (see [Planned — balance bonus](#planned--balance-bonus-postphase-4)); scoreboard copy + `finalize_team_match` change

### Bug fix — Team tab leaked non-teammates' runs

**Found:** after leaving a team and creating a new one, a user could still see the old team's runs in Team Activity / the Feed's Team tab.

**Root cause:** `feed_posts` RLS policies are permissive (OR'd, not AND'd). Every run posts with `audiences` including `'community'` alongside `'team'`/`'friends'` — so `feed_posts_select_community` (no restriction at all) independently grants read access to a row, regardless of what the narrower `feed_posts_select_team` policy would otherwise deny. The Team tab's query relied entirely on RLS to scope by team and had no client-side restriction — unlike the Friends tab, which already restricts client-side via `fetchFriendIds` + `.in('user_id', …)`.

**Fix:** added `teamService.fetchTeammateIds` (mirrors `fetchFriendIds`) and wired it into `feedService.fetchFeedPosts` for `tab === 'team'`, restricting the query to current teammates' ids the same way the Friends tab already does. See [reference.md § Security & privacy](../.cursor/skills/run-off/reference.md) for the general RLS-OR'ing gotcha — this pattern (audience-scoped read + no client-side id restriction) is worth checking before adding any new audience type.

---

## Open decisions

1. **Top-N value:** 5 for `team_3day` (tunable per match type via `match_types.scoring_top_n`) — confirm after first real matches.
2. **Min roster to queue:** 2 vs 3 (v1: 2; revisit when teams fill out).
3. **Disband/kick mid-match:** blocked outright (v1 recommendation) vs treated as forfeit.
4. **Team forfeit in v1** or backlog.
5. **`member_max`:** stays 30, or tighten once top-N makes large rosters less decisive.
6. **Balance bonus curve:** exact metric + cap (e.g. max +10% vs +15%); compute over all roster runners or only the top-N who already score?; ship a min-contributor floor first?

---

## Manual QA (needs two teams, multiple accounts)

1. Level-10 user creates a team; sub-level-10 user sees locked create CTA but can request to join.
7. Leader opens roster → Invite → sees teamless friends first, searches a non-friend by name, taps Invite. Invitee gets a bell badge + feed-tab dot + auto-popup; accepting joins the team.
8. Teamless user taps REQUEST on a team in the browser; that team’s leaders get a notification and approve; requester joins.
2. Leader promotes a co-leader; co-leader queues the team; member sees searching state but no cancel rights.
3. Two queued teams within ±400 rating pair into an active match; both rosters render from server.
4. Members run ≥0.1 mi → personal points on scoreboard; team total = top-N sum; a 6th contributor doesn’t raise the total (N=5).
5. After `ends_at`, finalize → `team_rank` Elo + W/L update; every member gets the completion drawer.
6. New member joining mid-match does not appear in participants; demo match no longer surfaces.
