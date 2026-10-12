# Security (No Accounts)

The room code is the only key to a room, so the server must protect it and trust nothing the client sends.

| Threat | Mitigation |
| --- | --- |
| Stranger guesses a room code | 6 chars from a 32-char alphabet (~1 billion combos); join attempts rate-limited to 5/min per IP; max 2 players; rooms expire 5 min after empty |
| Someone takes a dropped player's slot | Rejoin requires the `playerToken` (random, issued at join, kept in sessionStorage) |
| Cheating (speed, teleport, far pickups) | Server checks speed per move and distance per interaction; shared state changes only on the server |
| Event flooding / huge messages | Per-socket, per-event rate limits; `maxHttpBufferSize` 16 KB; Zod validation on every payload |
| XSS via names or notes | Render with `textContent`, never `innerHTML`; length limits (name 20, note 280); strip control characters |
| Cross-site connections | CORS and Socket.IO `origin` allow only the Netlify domain |
| Interception | HTTPS + WSS everywhere; WebRTC audio encrypted (DTLS-SRTP) |
| Code word exposure | Hashed on the client before sending; compared on the server; never sent to the partner |
| Microphone privacy | Mic requested only on the Ready screen; visible mute; voice never recorded |
| Secrets | TURN credentials only in Render env vars; `.env` in `.gitignore` |
| Vulnerable dependencies | `npm audit` in CI; Dependabot |
| Tampered localStorage (fake XP) | Accepted risk: it's a private two-player game |
