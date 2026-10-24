# Network Delay Testing (M3-S19)

How to test multiplayer with simulated network conditions.

## Chrome DevTools throttling

1. Open DevTools → Network tab → Throttling dropdown
2. Add a custom profile:
   - **Name:** Friki Nights test
   - **Download:** 1000 kb/s
   - **Upload:** 500 kb/s
   - **Latency:** 250 ms
3. Enable it on one of the two browser windows

## Two-browser test

1. Start the server: `cd server && npm run dev`
2. Start the client: `cd client && npm run dev`
3. Open two browser windows at `http://localhost:5173`
4. Create a room in one, join with the code in the other
5. Enable throttling on one window
6. Both players should be able to complete Night 1:
   - Partner movement should be smooth (interpolation handles the delay)
   - Doors and items should sync within 500 ms
   - No teleporting at 250 ms delay and 2% simulated loss

## Packet loss simulation

Chrome DevTools doesn't simulate packet loss directly. Options:

- **clumsy** (Windows): GUI tool that adds lag, drop, and duplicate to localhost traffic
- **tc / netem** (Linux/macOS): `sudo tc qdisc add dev lo root netem delay 250ms loss 2%`

## What to check

- [ ] Partner model doesn't teleport
- [ ] Door open/close reaches both screens in < 500 ms
- [ ] Item pickup is never duplicated (server-authoritative)
- [ ] Scares fire on the correct player(s)
- [ ] Exit together works: both players see "Waiting for…" then night-complete
- [ ] Disconnect during night: pause shows, rejoin restores state
