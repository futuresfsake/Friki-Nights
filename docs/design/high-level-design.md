# High-Level Design (HLD)

```
                     ┌──────────────────────┐
                     │  Netlify             │
                     │  serves game files   │
                     └─────────┬────────────┘
              ┌────────────────┴────────────────┐
              ▼                                 ▼
 ┌────────────────────────┐   voice (WebRTC,  ┌────────────────────────┐
 │ Player 1 browser (Cebu)│◄─ peer-to-peer ──►│ Player 2 browser (EU)  │
 │ Three.js, input, audio │   encrypted)      │ Three.js, input, audio │
 └───────────┬────────────┘                   └────────────┬───────────┘
             │  Socket.IO over WSS                         │
             │  moves, actions, state                      │
             ▼                                             ▼
          ┌─────────────────────────────────────────────────────┐
          │ Game server (Render, Node + Socket.IO)              │
          │ rooms in memory · shared state · The Waiting One AI │
          │ Scare Director · validates every move and action    │
          └─────────────────────────────────────────────────────┘
```

## Rules

- The **server is the source of truth** for shared state: doors, items, levers, puzzle progress, The Waiting One, scare timing.
- Each client **moves its own player instantly** (no input lag) and sends position 15×/s. The server checks speed and forwards to the partner, who renders it 100 ms behind with interpolation.
- **Interactions** (open door, pick up key): client sends a request → server checks distance + state → applies → broadcasts to both. First valid request wins.
- **The Waiting One** runs only on the server at 10 ticks/s, using both players' look directions.
- **Scare Director** runs on the server and sends `scare:play` events (to one or both players) so scares are timed consistently.
- **Voice** goes directly between browsers; the server only relays the WebRTC handshake.
- **No database.** Room state is in a `Map` in server memory. Long-term progress lives in each player's `localStorage`.
