# Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Language | JavaScript (ES modules) | One language for client and server |
| Build / dev server | Vite 5 | Instant reload, simple production build |
| 3D | Three.js (r169) | WebGL in the browser, lights, fog, materials built in |
| Controls | Three.js `PointerLockControls` | First-person mouse look |
| Textures | HTML Canvas at runtime | No image files |
| Audio | Web Audio API | All sounds generated in code |
| Game server | Node.js 20 + Express + Socket.IO 4 | Rooms, reconnection, real-time events |
| Validation | Zod | Reject malformed or oversized events |
| Voice | WebRTC (`simple-peer`), signalled over Socket.IO | Direct peer-to-peer audio |
| NAT traversal | Public STUN; free-tier TURN only if voice can't connect | Some networks block direct connections |
| Local save | `localStorage` | Unlocked nights, XP, settings — no accounts needed |
| Client hosting | Netlify (or Vercel) | Free static hosting with HTTPS |
| Server hosting | Render web service, Singapore or Frankfurt region | Free Node hosting with WebSockets |
| Tests | Vitest, socket.io-client, Playwright | Unit, server integration, end-to-end |
| Code quality | ESLint + Prettier | Consistent style |
| CI | GitHub Actions | Tests and build on every push |

Note: Render's free tier sleeps when idle; first join can take up to ~1 minute. Show a "Waking the house…" screen.
