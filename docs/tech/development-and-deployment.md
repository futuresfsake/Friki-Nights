# Development and Deployment

> How to run the game locally and put it online for free. Items marked **Proposed** are not decided yet.

## 1. Requirements

- Node.js 20
- npm
- VS Code (recommended), Git
- Latest desktop Chrome, Edge, or Firefox

## 2. Run locally

The repo is one npm workspace (`client`, `server`, `shared`). Install once at the root:

```bash
npm install
npm run dev      # client: http://localhost:5173
npm test         # every workspace's tests
```

Server (from Milestone 3): `npm run dev --workspace server` (http://localhost:3000).

To test several players on one computer, open several browser windows (normal + private windows, or different browsers) and join the same room code. Up to 4.

**Solo:** solo is a normal game mode (create a room and start alone), so no special test flag is needed.

## 3. Scripts

| Package | Script | What it does |
| --- | --- | --- |
| client | `dev` | Vite dev server with instant reload |
| client | `build` | Production build into `dist/` |
| client | `preview` | Serve the production build locally |
| server | `dev` / `start` | Run the game server — **Proposed** |
| root | `test` | Run every workspace's Vitest suite |
| root | `dev` / `build` | Client dev server / production build |
| root | `lint` | ESLint + Prettier check — **Proposed** |

## 4. Environment variables — Proposed

Never commit real values; `.env` is in `.gitignore`.

| Where | Variable | Purpose |
| --- | --- | --- |
| Client (Netlify) | `VITE_SERVER_URL` | Game server URL, e.g. `https://friki-nights.onrender.com` |
| Server (Render) | `PORT` | Port to listen on (set by Render) |
| Server (Render) | `ACCESS_PHRASE` | Shared secret phrase; only people who know it can play (decided) |
| Server (Render) | `CLIENT_ORIGIN` | Allowed origin for CORS and Socket.IO (the Netlify URL) |
| Server (Render) | `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` | TURN server for voice, only if needed |

## 5. Deploy

**Client → Netlify**
- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `client/dist`
- Set `VITE_SERVER_URL`

**Server → Render (web service, free)**
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Region: Singapore or Frankfurt (decide after the M3 real-distance test)
- Set `ACCESS_PHRASE`, `CLIENT_ORIGIN`, and TURN variables if used

Render's free tier sleeps when idle, so the lobby pings the server on open and shows "Waking the house…".

## 6. CI (GitHub Actions)

On every push: install, lint, run tests, build the client, `npm audit`. Dependabot keeps dependencies updated.

## 7. Git workflow — Proposed

- `main` always builds and runs.
- One branch per milestone or feature, e.g. `m2-interactions`.
- Small commits with clear messages; merge when the milestone's "Done when" is met.
