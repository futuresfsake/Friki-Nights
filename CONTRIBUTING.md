# Contributing to Friki Nights

## Quick start

```bash
npm install          # installs client, server, and shared
npm run dev          # starts both Vite and the game server
```

The client runs on `http://localhost:5173` and the server on `:3000`.
The development access phrase is `hollowmere`.

## Project layout

```
client/    Vite + Three.js browser client
server/    Node.js + Express + Socket.IO game server
shared/    Code that runs on both sides (events, maps, state)
docs/      Design docs, milestone plans, tech notes
```

## Conventions

- **No art files or audio files.** All textures are canvas-generated; all sounds use the Web Audio API.
- **Zod schemas** in `shared/events.js` define every socket event payload.
- **Server-authoritative state.** The client renders; the server decides.
- Milestone stories live in `docs/plans/milestones/`. Check the current status in `docs/plans/milestone-status.md`.

## Running tests

```bash
npm test
```

## Branches

- `main` is the working branch.
- Feature work goes in topic branches off `main`.
