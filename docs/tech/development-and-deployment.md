# Development and Deployment

> How to run the game locally and put it online for free. Items marked **Proposed** are not decided yet.

## 1. Requirements

- Node.js 20
- npm
- VS Code (recommended), Git
- Latest desktop Chrome, Edge, or Firefox

## 2. Run locally

Client (Milestone 1, current):

```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

Server (from Milestone 3):

```bash
cd server
npm install
npm run dev      # Proposed: http://localhost:3000
```

To test two players on one computer, open two browser windows (or one normal + one private window) and join the same room code.

**Solo test mode (developers only):** the game is 2-player only, but a dev flag (e.g. `?solo=1`, only in dev builds) lets one person walk a night alone for testing. It is never available in the production build.

## 3. Scripts

| Package | Script | What it does |
| --- | --- | --- |
| client | `dev` | Vite dev server with instant reload |
| client | `build` | Production build into `dist/` |
| client | `preview` | Serve the production build locally |
| server | `dev` / `start` | Run the game server — **Proposed** |
| root | `test` | Run Vitest — **Proposed** |
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
