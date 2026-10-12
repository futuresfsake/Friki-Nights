# Game Flow

1. Open the site. Enter the shared **access phrase** (asked once; remembered by the browser). Enter a display name.
2. **Create room** → server returns a 6-character room code (e.g. `K7QX2M`). Share it with the others, or play solo.
3. Others click **Join room** and type the code. **1 to 4 players** per room.
4. Everyone sets a secret code word, allows the microphone (if more than one player), and presses **Ready**.
5. Host picks a night (only nights unlocked in the host's browser are selectable) and starts when everyone is ready.
6. Short text intro for the night.
7. **Explore loop:** search rooms → find clue → describe it to the others → combine clues → unlock a room → face a new threat.
8. **Caught:** a player caught by The Waiting One goes **down**. Any teammate has 60 s to reach them and hold **E** for 3 s to revive. If the 60 s run out, or **all** players are down → **night failed**, and the night restarts from the beginning (no checkpoints). **Solo:** being caught = night failed.
9. **Night complete:** all players walk through the exit together → summary (time, batteries used, times caught, notes found, XP).
10. Unlocked nights and XP are saved to **every** player's localStorage. Continue or return to lobby.

**Disconnect:** the night pauses for everyone for up to 60 s. Rejoin with the same room code restores the player. After 60 s the room returns to the lobby and the night's progress is lost; the night must be started again.

**Room lifetime:** a room is deleted 5 minutes after all players leave. Nothing is stored on the server long-term.
