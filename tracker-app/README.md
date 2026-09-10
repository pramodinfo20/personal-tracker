# Pramod's Tracker (v2 scaffold)

Rebuild of `pramod-2026-tracker.html` as a Vite + React + TypeScript app with
Tailwind CSS. This is a **Part A scaffold**: project setup and ported pure
logic only — no UI yet (that's Part B).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`, CSS-based `@theme` design tokens in
  `src/index.css` — v4 replaces `tailwind.config.js` color tokens with this
  approach)
- Vitest for unit tests

## Structure

```
src/
  lib/            pure logic ported as-is from pramod-2026-tracker.html
    types.ts        shared StatKey type
    leveling.ts      xpForLevel, applyXPGain
    gates.ts         GATE_TEMPLATES, checkGateUnlock, startGate, isGateExpired, resolveGateBonusXP
    quests.ts        LOG_XP_TIERS, DAILY_LOG_CAP, DAILY_QUESTS
    shadows.ts       SHADOW_MILESTONES
    hunterState.ts   Hunter type + DEFAULT_HUNTER (localStorage-backed state shape)
  hooks/
    useSaved.ts      typed localStorage-backed useState hook
  components/       (empty — Part B)
```

Every file in `lib/` has a co-located `*.test.ts` verifying it matches the
original HTML file's behavior.

## Commands

```
npm install
npm run dev       # dev server
npm run build     # typecheck + production build
npm run test      # run unit tests
npm run lint      # oxlint
```
