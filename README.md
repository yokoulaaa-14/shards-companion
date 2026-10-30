# Shards Companion

A two-player resource tracker for the board game *Shards of Infinity*, built for one phone laid flat between the players in landscape.

**Unofficial fan-made tool.** Not affiliated with or endorsed by Stone Blade Entertainment. No game content, card text or artwork is included in this repository.

## What it does

- Picks a Shard Master per player (or random), then a VS screen and **Fight**.
- Active player gets 80% of the screen: Health, Mastery, Gems, Power, **End turn**. The other player keeps a read-only strip.
- Quick taps on a resource merge into one gesture with an **Undo** that reverts exactly that gesture.
- **Buy +1 Mastery** for 1 gem, once per turn, with its own undo.
- **End turn** is a two-step attack: Power on champions (attacker's side), then shield (defender's side). Remaining damage is applied and the turn passes.
- **Infinity Shard** sets Power to ∞; ending the turn then wins the game.
- End game screen with the winner's hero and a restart.
- Installable PWA, works offline, keeps the screen awake during a game. State survives a refresh.

## Run it

```bash
npm install
npm run dev
```

Tests cover the game rules:

```bash
npx vitest run
```

## Hero art

Card photos are personal and git-ignored. See `public/art/README.md`. Without them the app uses one colour per hero.

## Stack

Vite · React · TypeScript · Tailwind CSS · Zustand · Framer Motion · vite-plugin-pwa · Vitest
