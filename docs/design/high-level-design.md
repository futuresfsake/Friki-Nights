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

The diagram shows two players; a room holds **1 to 4**, each connected the same way.

## Rules

- The **server is the source of truth** for shared state: doors, items, levers, puzzle progress, The Waiting One, scare timing.
- Each client **moves its own player instantly** (no input lag) and sends position 15×/s. The server checks speed and forwards it to the other players, who render it 100 ms behind with interpolation.
- **Interactions** (open door, pick up key): client sends a request → server checks distance + state → applies → broadcasts to every player in the room. First valid request wins.
- **The Waiting One** runs only on the server at 10 ticks/s, using every player's look direction.
- **Scare Director** runs on the server and sends `scare:play` events (to one, some, or all players) so scares are timed consistently.
- **Voice** goes directly between browsers as a mesh (every pair of players connects: 1 connection for 2 players, 6 for 4); the server only relays the WebRTC handshake.
- **No database.** Room state is in a `Map` in server memory. Long-term progress lives in each player's `localStorage`.
