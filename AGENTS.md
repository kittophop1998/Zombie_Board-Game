# AGENTS.md

Guidance for AI coding agents working in this repository. Human-oriented docs live in
`README.md`; game-rule details live in `GAME_RULES_FIX.md`, `BATTLE_SYSTEM_UPDATE.md`, and
`SHOTGUN_CHOICE_FEATURE.md`; the visual design system lives in `DESIGN.md`.

## What this is

**Zombie Card Game** — a real-time multiplayer card/battle game played over a local network.
Players create/join a room, get dealt cards, and fight 1-on-1 battles. Some players are secretly
zombies; special cards (Zombie, Shotgun, Vaccine) change the game state. Win conditions and card
rules are documented in the `*_FIX.md` / `*_UPDATE.md` / `*_FEATURE.md` files — **read them before
changing game logic.**

## Tech stack

- **Next.js 16** (App Router in `app/`, plus a Pages-router API route in `pages/api/socket.ts`)
- **React 19** + **TypeScript**
- **Material UI (MUI) v7** with Emotion — themed in `components/ClientThemeProvider.tsx`
- **Socket.IO** (`socket.io` server + `socket.io-client`) for real-time play
- Card art is static PNGs in `public/`

## Commands

```bash
npm install       # install deps
npm run dev       # dev server on http://localhost:3003 (note: port 3003, not 3000)
npm run build     # production build — run this to verify changes compile
npm run start     # serve the production build
npm run lint      # eslint (eslint-config-next)
```

There is **no test suite**. Verify changes with `npm run build` and, when touching gameplay, by
running `npm run dev` and exercising the flow (create room → join in a second tab → ready → battle).

## Project layout

```
app/                     App Router entry
  layout.tsx             Root layout; wires MUI cache + ClientThemeProvider
  page.tsx               Renders <GameBoard/>
  globals.css            Global styles + design tokens (CSS custom properties)
components/
  GameBoard.tsx          Main UI + all client socket handling (largest file; 3 views:
                         no-room lobby, room lobby, in-game)
  CardComponent.tsx      A hand card (renders PNG by suit/value/type)
  BattleCard.tsx         A card slot on the battle table
  PlayerCard.tsx         Reusable player tile
  ShotgunChoiceModal.*   Plain-CSS-module modal for the shotgun steal/kill choice
  ClientThemeProvider.tsx  MUI theme (colors, radius, component overrides)
lib/
  gameLogic.ts           Pure-ish game logic (dealing, battle resolution, win checks)
  socket.ts              Socket.IO server logic (room/battle event handlers)
types/game.ts            Shared TypeScript types (Card, Player, Battle, GameRoom, enums)
pages/api/socket.ts      Next API route that boots the Socket.IO server
public/                  Card face PNGs (e.g. `KRed1.png`, `Zombie.png`, `Gun.png`, `Vaccine.png`)
```

Client and server communicate by Socket.IO events (e.g. `create-room`, `join-room`,
`player-ready`, `start-battle`, `play-card`, `confirm-cards`, `use-vaccine`,
`choose-shotgun-action`; server emits `room-updated`, `game-started`, `game-ended`, `message`,
`error`, `shotgun-choice-required`). When adding an event, update **both** `lib/socket.ts` and the
handlers in `components/GameBoard.tsx`, and keep `types/game.ts` in sync.

## Design system (UI work)

The UI follows **`DESIGN.md` — "Neon Survival Playground"**: a bright, playful, mobile-first look
(not horror, not an admin dashboard). Key rules for any UI change:

- **Use the design tokens.** They are defined as CSS custom properties in `app/globals.css`
  (`--color-primary: #7C5CFF`, `--color-secondary: #00D9C0`, `--color-danger: #FF4D6D`,
  `--color-bg: #F8F7FF`, radii `--radius-*`, shadows `--shadow-*`, spacing `--space-*`, etc.) and
  mirrored in the MUI theme in `components/ClientThemeProvider.tsx`. Prefer theme colors
  (`primary`, `secondary`, `error`, `warning`) over hardcoded hex; when a raw color is unavoidable,
  use a value from `DESIGN.md`, not an arbitrary one.
- **Palette:** purple primary `#7C5CFF`, teal/mint secondary `#00D9C0`, danger pink-red `#FF4D6D`,
  accent yellow `#FFD166`. Light backgrounds (`#F8F7FF` / white cards). No all-dark screens.
- **Rounded & friendly:** generous border-radius (cards `20px`, dialogs `28px`, buttons `16px`,
  pills `999px`) and soft shadows; a purple glow (`--shadow-glow`) for active/selected states only.
- **Accessibility (DESIGN.md §15):** never signal status by color alone — always include text/icon;
  tap targets ≥ 44px (the MUI Button override enforces this); respect `prefers-reduced-motion`
  (handled globally in `globals.css`).
- **Tone:** in-game copy is Thai and upbeat (e.g. "ถึงตาคุณแล้ว!", "ทอยลูกเต๋า"). Match the existing
  bilingual, playful voice. Avoid gore/horror imagery; zombies are cute/goofy.

If you add a component, name it per `DESIGN.md §17` where one fits.

## Conventions

- TypeScript throughout; keep `types/game.ts` as the single source of truth for shared shapes.
- Comments and user-facing strings are frequently in Thai — that is intentional; keep it consistent.
- `'use client'` is required on any component using hooks, MUI, or browser APIs.
- Match the surrounding style: MUI `sx` props for styling in `.tsx`, CSS modules only where already
  used (`ShotgunChoiceModal.module.css`).

## Guardrails

- Don't commit, push, or open PRs unless the user explicitly asks.
- Don't change game rules or battle resolution without reading the relevant `*.md` rule docs first —
  the logic is intricate (hidden zombie status, shotgun steal-vs-kill, vaccine constraints).
- Keep client and server state in sync; a change to one socket side usually needs the other.
- Run `npm run build` before declaring UI/logic work done.
