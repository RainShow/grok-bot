# Grok City

> field notes › a content machine — from a trending post to your timeline

An interactive, simulated dashboard for a six-agent content machine. An isometric SVG city sits in the middle of a beige, monospaced field-notes layout. Agents hop between buildings, a story moves through the pipeline, and the city stops to ask you when it needs a decision.

No backend, no auth, no real integrations. Everything is simulated in the browser.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint     # oxlint
```

Append `?at=20` (any hour 0–23) to start the day at a given time. For example, `?at=20` previews night mode and `?at=14.6` previews rain.

## Click path

1. Open `/`. The city is centred, agents clock in, and the activity log and metrics start ticking.
2. Watch **scout** read the newsroom, then hand the story to **hook** in the writers' room.
3. When **needs you** shows the hook choice, click `hook A`, `hook B` or `hook C`. If nobody answers within 25 s, hook A is auto-picked.
4. The story moves on through edited → sponsored → rendered → reviewed → published → cross-post → hot take.
5. When **reply** asks about the hot take, click `approve` (or `skip`).
6. The pipeline dots advance and the bottom agent cards update. After six posts (or at 23:30, or when you press `wrap day`), the day-one summary modal opens.

Use `1x / 2x / 4x` in the header to speed things up. At 4x a full day takes about 80 seconds.

## What's in the city

| building | callout | agent |
| --- | --- | --- |
| newsroom | scout reads everything | scout |
| writers' room | three hooks, one wins | hook |
| post office | six posts a day | post |
| studio | 1080p, eventually | reel |
| bank | where ledger counts | ledger |
| reply café | sponsors drop by | reply |

There are also a few extras borrowed from the Khazix agent-city reference: a webhook dispatch hub with conveyor belts carrying packages from the studio and writers' room, translucent side panels, a top stats strip (running / queued / needs you / posted today), a clock and weather widget, camera controls (full view, rotate, zoom, labels), status pills on building callouts, and a day → rain → night ambience.

## Layout

```
src/
  game/        simulation (no React): iso projection, world map, agents/stages, Sim engine
  components/  dashboard chrome + city/ (SVG scene)
```

`Sim` is a plain mutable class advanced from a `requestAnimationFrame` loop. The panels subscribe at about 5 Hz and the agent layer subscribes every frame (`useSyncExternalStore`).
