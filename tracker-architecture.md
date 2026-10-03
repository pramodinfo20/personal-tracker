# Personal Leveling Tracker — Architecture Plan

*One-person build, sequenced for validation-before-investment. Not legal advice — flag items to a lawyer before commercial launch, marked with ⚠️.*

---

## 1. Core Concept (Engine, Not IP)

The product is a **generic gamified achievement engine** with swappable "theme packs." Never hardcode anime IP names, logos, or art into the core logic — themes are just a JSON config + asset pack layered on top.

**Core data objects:**

| Object | Fields |
|---|---|
| `User` | id, xp_total, level, current_theme_id, created_at |
| `Quest` | id, title, category (physical/intellectual/creative), xp_value, recurrence, proof_type |
| `Gate` | id, tier (E–S / red/blue/purple), unlock_level, bundled_quest_ids[], deadline_hours, xp_multiplier, status |
| `Achievement` | id, title, unlocked_at, badge_asset_id |
| `Theme` | id, name, terminology_map (e.g. "Gate"→"Trial", "Shadow"→"Companion"), color_palette, icon_set |
| `ProofSubmission` | id, quest_id, type (photo/link/manual), file_ref, trust_score_delta |

**XP curve:** exponential (`xp_needed = base * level^1.5`) so early levels feel fast, later ones meaningful. Gates give 2–3x normal XP but expire — creates urgency without pay-to-win.

⚠️ **Legal guardrail #1:** Ship your *first* theme as an original name/aesthetic inspired by the genre (e.g. "Ascension," "Rank Climber") rather than "Solo Leveling" branding, art, or terms like "Shadow Monarch." Use it privately under any name you like — the moment it's public or monetized, names/art tied to an existing copyrighted franchise are a takedown/lawsuit risk regardless of how transformative you think it is. The theme-pack architecture lets you offer anime-*inspired* aesthetics (color palettes, power-fantasy tone) without reproducing protected characters, logos, or exact terminology.

---

## 2. Phase 1 — HTML MVP (validate before building native)

**Goal:** prove people use gates/quests for 2+ weeks before writing a single line of Android code.

**Stack:**
- Single-page HTML/CSS/vanilla JS (or lightweight framework if you want reactivity — Alpine.js is enough, no need for React here)
- `localStorage` for state (no backend yet)
- Export/import JSON button so users don't lose data between devices

**Structure:**
```
/tracker-mvp
  index.html          → shell + theme switcher
  /js
    engine.js          → XP math, level-up logic, gate unlock rules
    quests.js           → quest CRUD, proof attachment (base64 image → localStorage)
    themes.js            → theme JSON loader, terminology remapping
  /themes
    ascension.json        → default theme (safe branding)
  /assets
    /ascension           → icons, badge SVGs
```

**What to build first:**
1. XP engine + level-up animation (this is the dopamine hook — get it right before anything else)
2. Daily quest CRUD with manual "mark done"
3. Gate system: unlocks at level thresholds, bundles 2–3 quests, countdown timer, bonus XP on completion, penalty/expiry state
4. Proof upload (just a photo attached to a quest, stored locally — no verification logic yet)
5. Single theme, fully working, before you touch a second one

**Validation signal to watch for:** do people open it daily without being reminded? That's the only metric that matters before you build native.

---

## 3. Phase 2 — Native Android

**Only start this once Phase 1 shows real retention.**

**Stack:**
- Kotlin + Jetpack Compose (modern, less boilerplate than XML views)
- Room (local SQLite) as source of truth — app must work fully offline
- Backend: FastAPI (matches your existing skills) for account sync, leaderboards, theme marketplace — Postgres for storage
- Auth: Firebase Auth or Supabase Auth (don't roll your own)
- Hosting: Railway/Render/Fly.io for the FastAPI backend to start — cheap, scales later

**High-level architecture:**
```
[Compose UI]
   │
[ViewModel layer]  ── local business logic (XP calc, gate state machine)
   │
[Room DB] ←── offline-first source of truth
   │
[Sync Worker (WorkManager)] ── background sync to backend when online
   │
[FastAPI backend] ── auth, cross-device sync, theme store, leaderboards
   │
[Postgres]
```

**Why offline-first matters here:** habit trackers die when they require connectivity to log a habit. Log locally, sync in background, never block the UI on network.

**Build order:**
1. Port the Phase-1 engine logic into Kotlin (XP math, gate state machine) — it's the same logic, different language
2. Local-only app first (Room, no backend) — ship to a handful of testers via Play internal testing track
3. Add backend + auth once local version is stable — this is when cross-device sync and the theme marketplace become possible
4. Theme marketplace as in-app purchases (Google Play Billing) — this is your monetization surface

---

## 4. Phase 3 — Strava Integration (after retention is proven, not before)

**Why last:** it's an engagement multiplier, not a core loop driver. Building it early is a classic solo-founder trap — polishing an integration nobody's asked for yet.

**Flow:**
1. OAuth2 against Strava's API (user grants read access to activities)
2. Webhook subscription to Strava's activity-created events (avoid polling)
3. Map activity type → quest category (Run → physical quest, auto-complete matching gate requirements)
4. Auto-award XP + mark proof as "verified" (higher trust score than manual upload)

This also solves your proof-of-completion problem for fitness quests specifically — Strava data is much harder to fake than a screenshot, so lean on it once it's live.

**Later integrations, same pattern:** GitHub (commits → intellectual quests), Duolingo/Coursera (learning quests), Google Fit as a Strava alternative for Android users.

---

## 5. Monetization Checklist (once Phase 2 backend exists)

- Free tier: 1 default theme, core gate/quest engine, unlimited local quests
- Paid: additional theme packs (this is your main revenue lever), cosmetic unlocks, cloud sync/multi-device
- Avoid: paying to skip gates or buy XP directly — undermines the achievement mechanic that makes the app worth using
- ⚠️ **Legal guardrail #2:** before selling any theme pack, run its name/art past a quick trademark search (USPTO TESS + a plain Google check) — this applies to every future anime-adjacent theme, not just the first one.

---

## 6. Immediate Next Step

Given you're time-constrained right now: the highest-leverage single task is finishing the **gate/quest engine in the existing HTML tracker** (Phase 1, items 1–4 above). Everything else — native app, Strava, monetization — is wasted effort if that core loop doesn't hold your own attention for two weeks first.

I can start on the `engine.js` gate/quest logic directly if you want to hand this off — just confirm and I'll build it against your existing tracker file.
