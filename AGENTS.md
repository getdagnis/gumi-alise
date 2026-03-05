# Omedeto-Alise Platform Roadmap and `AGENTS.md` Spec

## Summary

Build a phased migration from the current Vite single-page app into a production-ready social soundboard platform for anime/vocaloid-style characters, using **Next.js on Cloudflare** with a **Supabase-first backend**.  
MVP will ship: private-beta accounts, username/password auth, invite codes, one customizable preset character per user, 15 selectable sounds, saved mixes, visitor-submitted mixes, upvote ranking, public/unlisted profiles, basic moderation/reporting, and admin reset flow.

## Locked Decisions (from this planning session)

1. MVP scope: Profiles + Mixes + Voting.
2. Backend core: Supabase-first.
3. Auth: Username + password with server-side auth.
4. Frontend architecture: Early migration to Next.js.
5. Moderation: Auto filters + report queue.
6. Access policy: Private beta/invite-only.
7. Character MVP: One preset character + color/wallpaper tuning.
8. Mix rules: Up to 15 selected sounds, save named mixes.
9. Voting: One upvote per user per mix.
10. Invite system: Invite codes.
11. Password recovery: Admin reset only.
12. Deployment: Cloudflare Pages + Workers + Supabase.
13. AI future path: Provider-agnostic adapter.
14. Sound governance: Owned/approved assets only.
15. New profile default visibility: Unlisted.

## Architecture Blueprint

1. Frontend:
   - Next.js App Router (TypeScript), replacing Vite SPA.
   - UI keeps current visual identity/components; logic moved into modular feature folders.
   - Public profile routes are server-rendered for indexability.
2. Runtime:
   - Cloudflare Pages + Workers runtime for Next.js.
   - Edge middleware for session check and basic anti-abuse gates.
3. Backend:
   - Supabase Postgres for core data.
   - Supabase Storage for character/wallpaper/sound assets.
   - Server-only writes through Next route handlers using Supabase service role.
   - Public reads through controlled APIs and selective direct reads.
4. Auth (custom):
   - Username/password stored in custom tables, not social auth.
   - Password hashing/verification handled in Postgres (`pgcrypto` functions).
   - Opaque session token in secure HttpOnly cookie; hashed token in DB session table.
5. Moderation:
   - Server-side blocked-word/profanity checks.
   - Report queue table + admin moderation endpoints.
6. Future AI:
   - Internal `CharacterGenerationProvider` interface; no provider lock-in.

## Data Model (MVP, decision-complete)

1. `users`
   - `id uuid pk`, `username citext unique`, `display_name text`, `password_hash text`, `is_admin bool`, `status text`, `created_at`.
2. `user_profiles`
   - `user_id uuid pk fk users`, `bio text`, `visibility enum('private','unlisted','public') default 'unlisted'`, `wallpaper_asset_id uuid nullable`, `theme_title_color text`, `theme_primary_color text`, `theme_secondary_color text`, `theme_soundboard_color text`, `updated_at`.
3. `character_presets`
   - `id text pk`, `name text`, `image_asset_id uuid`, `is_active bool`.
4. `user_character_config`
   - `user_id uuid pk fk users`, `preset_id text fk character_presets`, `is_primary bool default true`.
5. `sound_assets`
   - `id uuid pk`, `slug text unique`, `name text`, `path text`, `duration_ms int`, `license_type text`, `license_notes text`, `is_active bool`, `category text`, `created_at`.
6. `user_sound_selection`
   - `user_id uuid`, `sound_id uuid`, `slot_index int`, `created_at`, unique `(user_id, sound_id)`, unique `(user_id, slot_index)`, max 15 enforced via trigger.
7. `mixes`
   - `id uuid pk`, `profile_user_id uuid fk users`, `author_user_id uuid fk users`, `type enum('owner','visitor')`, `name text`, `description text`, `is_published bool`, `created_at`, `updated_at`.
8. `mix_items`
   - `mix_id uuid fk mixes`, `sound_id uuid fk sound_assets`, `order_index int`, unique `(mix_id, sound_id)`.
9. `mix_votes`
   - `mix_id uuid fk mixes`, `voter_user_id uuid fk users`, `created_at`, unique `(mix_id, voter_user_id)`.
10. `invite_codes`
    - `id uuid pk`, `code text unique`, `created_by uuid fk users`, `max_uses int`, `used_count int`, `expires_at`, `is_active bool`.
11. `invite_redemptions`
    - `invite_code_id uuid fk invite_codes`, `redeemed_by uuid fk users`, `redeemed_at`.
12. `reports`
    - `id uuid pk`, `reporter_user_id uuid fk users`, `target_type enum('profile','mix','user')`, `target_id uuid`, `reason text`, `status enum('open','reviewing','resolved','dismissed')`, `created_at`.

## Important Public Interfaces and Type Changes

1. New shared contracts file: `src/lib/contracts.ts`.
2. Core exported interfaces:
   - `UserProfilePublic`
   - `CharacterPreset`
   - `UserCharacterConfig`
   - `SoundAsset`
   - `UserSoundSelection`
   - `MixSummary`
   - `MixDetail`
   - `VoteState`
3. API response envelope:
   - `ApiSuccess<T> = { ok: true; data: T }`
   - `ApiError = { ok: false; code: string; message: string }`
4. New auth/session types:
   - `SessionUser { id: string; username: string; isAdmin: boolean }`
   - `SessionContext { user: SessionUser | null }`
5. Existing character config in frontend migrates from static-only `config.ts` to DB-driven presets plus local fallback seed data.

## Route and API Plan (MVP)

1. Web routes:
   - `/` landing/discovery preview.
   - `/auth/login`
   - `/auth/signup`
   - `/me` profile editor + sound selection + mix manager.
   - `/u/[username]` public/unlisted profile page.
   - `/admin` moderation + invite controls (admin only).
2. API routes:
   - `POST /api/auth/signup` (username, password, inviteCode)
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `POST /api/auth/reset-password` (admin action)
   - `GET /api/me`
   - `PATCH /api/me/profile`
   - `PUT /api/me/character`
   - `PUT /api/me/sounds` (exactly 15 IDs)
   - `POST /api/mixes`
   - `PATCH /api/mixes/:id`
   - `POST /api/mixes/:id/vote`
   - `DELETE /api/mixes/:id/vote`
   - `GET /api/users/:username/profile`
   - `GET /api/users/:username/mixes`
   - `POST /api/reports`
   - `POST /api/admin/invites`
   - `GET /api/admin/reports`
   - `PATCH /api/admin/reports/:id`

## Implementation Phases

1. Phase 0: Platform migration and foundation.
   - Create Next.js app structure in current repo.
   - Port current interactive soundboard UI into feature modules.
   - Configure Cloudflare deployment target.
   - Add Supabase client/server utilities and env validation.
2. Phase 1: Auth + account bootstrap.
   - Implement invite code issuance and redemption flow.
   - Build signup/login/logout with custom username/password auth.
   - Implement secure session cookie lifecycle and session revocation.
   - Build admin reset-password endpoint and admin UI action.
3. Phase 2: Character/profile customization.
   - Implement profile editor: colors, wallpaper, visibility.
   - Implement one preset character selection and primary flag.
   - Implement 15-sound library selection with validation.
4. Phase 3: Mixes and social interaction.
   - Implement owner mixes and visitor mixes.
   - Implement upvote constraints and counters.
   - Build public profile with tabs: owner mixes / visitor mixes.
5. Phase 4: Moderation and discovery.
   - Add server-side content filters.
   - Add report queue and admin moderation actions.
   - Add discovery feeds for beta: New, Top, Trending (initial simple ranking).
6. Phase 5: Future-proof extensions.
   - Add multi-character schema compatibility migration.
   - Add AI provider adapter scaffolding and job table.
   - Keep current MVP behavior unchanged while enabling extension points.

## `AGENTS.md` File Plan (to create at repo root)

1. Purpose:
   - Define product intent and strict engineering rules for all future agents.
2. Required sections:
   - Project vision and MVP boundaries.
   - Canonical architecture and deployment topology.
   - Data ownership map (frontend, API layer, DB, storage).
   - Auth/session invariants and security requirements.
   - Moderation and child-safety constraints.
   - API contract conventions and error code taxonomy.
   - DB migration and rollback policy.
   - Test strategy and required checks before merge.
   - Release checklist and incident response basics.
3. Non-negotiable guardrails:
   - No plaintext passwords or reversible secrets.
   - No direct client writes to sensitive tables.
   - No public profile indexing unless visibility is `public`.
   - Sound assets must include license metadata.
   - Invite-only gate must stay enforceable in MVP.

## Testing and Acceptance Scenarios

1. Auth:
   - Signup fails without valid invite code.
   - Duplicate username rejected.
   - Login success creates secure session cookie.
   - Invalid password attempts trigger rate limit lock.
2. Profile/character:
   - User can save colors + wallpaper + visibility.
   - User can select exactly 15 sounds; 14/16 rejected.
   - Public profile returns data only when visibility rules allow.
3. Mixes:
   - Owner can create/update own mixes.
   - Visitor can propose mix on another profile.
   - One user can upvote a mix only once.
4. Moderation:
   - Profanity filter blocks disallowed mix/profile text.
   - Reports can be created by authenticated users.
   - Admin can resolve/dismiss reports.
5. Security:
   - Session invalid after logout.
   - Admin endpoints reject non-admin users.
   - Service role key never exposed to client bundle.
6. Performance:
   - Profile page server-render latency within target budget.
   - Mix listing paginates correctly under load.
7. E2E beta flow:
   - Invite -> signup -> configure profile -> save mix -> share link -> visitor vote/report.

## Rollout and Operations

1. Environments:
   - `dev`, `staging`, `prod` with separate Supabase projects.
2. CI gates:
   - typecheck, lint, unit tests, integration tests, e2e smoke.
3. Observability:
   - Structured logs for auth, mix writes, moderation actions.
   - Error tracking with route and user context redaction.
4. Beta controls:
   - Feature flags for discovery feeds and visitor mix submission.
   - Ability to disable registration globally while keeping login active.

## Assumptions and Defaults Chosen

1. Private beta remains invite-only until explicitly changed.
2. New profiles default to `unlisted`.
3. Visitor mix submission requires authenticated account.
4. Password reset is admin-managed only in MVP.
5. Discovery pages include only `public` profiles.
6. AI generation and advanced character customization are explicitly post-MVP.
7. Current visual design/language direction is preserved during migration.
