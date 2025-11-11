# Copilot Instructions for Woolzip

Use this file as your primary context when suggesting code, tests, and docs.

## Product Context (from PRD/AGENTS)
- Goal: Share minimal family status in ≤10s (signals, 5 one‑touch actions, meds, emotion). No automatic location. Privacy first.
- Stack: Next.js 15(App Router), React 19, TypeScript, Tailwind, Supabase (Auth/DB/Realtime/Edge Functions/Scheduler), PWA (SW/Offline/Push), Vercel.
- Core values: One‑touch, 10s, privacy, parent‑friendly UI.

## Architecture & Style (AGENTS)
- Prefer RSC; keep client components minimal. Mark with `'use client'` only when needed.
- TypeScript strict, explicit types, null‑safety.
- Tailwind with semantic tokens; keep accessibility (focus rings, color+icon redundancy, proper labels/aria).
- Parent mode via `html[data-font]`, `html[data-contrast]` toggles.
- Don’t add location tracking or excessive data collection.

## Components to Prefer (AGENTS §23)
- `SignalButton(type, tag?)`
- `UndoToast(onUndo)`
- `TimelineItem(kind)`
- `TodaySummaryCard(familyId)`
- `EmotionComposer()`
- `MedicationList()` and `TakePillButton(medicationId, time_slot)`
- `SOSButton()` and `SOSConfirmModal()`
- `SettingsForm()`

Place components under `components/` with PascalCase filenames.

## API Contracts (AGENTS §5, PRD §10)
- `POST /api/invite/accept` → `{ code }`
- `GET /api/family/:id/timeline?cursor=` → mixed feed
- `POST /api/signal` → `{ type: 'green'|'yellow'|'red', tag?, note? }`
- `POST /api/med/take` → `{ medicationId, time_slot }`
- `POST /api/emotion` → `{ emoji, text }`
- `POST /api/sos` → `{}`
- `POST /api/devices/register` → `{ pushToken, device_type }`
- Validate inputs (e.g., Zod). Use consistent response: `{ ok, id?, created_at?, error? }`.

## Data/RLS (PRD §8/§8.1)
- Enforce RLS. Users see only their family’s data; owners only for personal tables.
- Indices: timeline `(family_id, created_at desc)` etc.
- Enforce undo window ≤5 minutes server‑side and client‑side.

## Realtime/Offline/Push (AGENTS §7, PRD §9)
- Realtime channel: `family:{id}` subscribe to `signals`, `med_logs`, `emotions` INSERTs.
- Web Push via devices table + Edge Function/Node API.
- Offline: queue POSTs in IndexedDB; Background Sync tags `sync:signal`, `sync:med`.
- Cache: App shell, icons, fonts; API GETs use `stale-while-revalidate`.

## Performance Budgets (AGENTS §9, PRD §15)
- Timeline reflection p50 < 1.0s / p95 < 1.5s.
- Home first paint < 1.2s (cached), bundle < 200KB gz.
- 3 taps or fewer, total ≤ 10s.

## Accessibility & i18n
- Keep focus outlines; meet contrast; label everything. 
- UI copy via tokens; allow 2‑line buttons; avoid truncation.

## Security/Privacy Rules
- Minimal data: meds name/time/taken; no medical stats; no automatic location.
- TLS + at‑rest encryption. No admin backdoors bypassing RLS.
- Never log secrets or PII.

## GitHub Workflow (from GITHUB_CONVENTION)
- Branches: `type/scope/topic` (e.g., `feat/ui/signal-button`). Default `main` protected.
- Commits: Conventional Commits `type(scope): summary`.
- PRs: small, focused; include PRD references, tests, screenshots, performance/accessibility checks.
- Reviews: ≥1 approval (schema/PRD/AGENTS changes: 2 recommended).
- Releases: SemVer tags `vX.Y.Z`; release notes with highlights and migration guidance.
- CI must pass: typecheck, build, tests, lint. No secrets in commits.

## DO / DON’T
- DO split server/client boundaries cleanly; prefer RSC.
- DO validate inputs; handle errors with user feedback + logging hooks.
- DO instrument analytics events listed in AGENTS.
- DO write tests where state machines or RLS logic changes.
- DON’T bypass RLS, add auto‑location, or introduce heavy deps casually.
- DON’T remove focus rings or reduce contrast in parent mode.

## File/Folder Conventions
- `app/` (routes, API handlers), `components/`, `lib/` (server/client split), `workers/` (SW), `public/`, `styles/`.
- Keep client code minimal; colocate hooks and utilities under `lib/`.

## Default Scopes & Labels
- Scopes: `app`, `api`, `sw`, `db`, `ui`, `a11y`, `perf`, `sec`, `copy`, `i18n`.
- Labels: `feature`, `bug`, `a11y`, `performance`, `security`, `privacy`, `data`, `docs`, `design`.

When in doubt, prefer privacy, accessibility, and simplicity aligned with AGENTS and PRD.

