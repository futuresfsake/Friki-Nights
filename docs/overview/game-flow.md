# Game Flow

1. Open the site. Enter a display name.
2. **Create room** → server returns a 6-character room code (e.g. `K7QX2M`). Share it with your partner.
3. Partner clicks **Join room** and types the code. Max 2 players per room.
4. Both set a secret code word, allow the microphone, press **Ready**.
5. Host picks a night (only nights unlocked in the host's browser are selectable).
6. Short text intro for the night.
7. **Explore loop:** search rooms → find clue → describe it to partner → combine clues → unlock a room → face a new threat.
8. **Caught:** a player caught by The Waiting One goes **down**. Partner has 60 s to reach them and hold **E** for 3 s to revive. Both down → restart from the night's last checkpoint.
9. **Night complete:** both walk through the exit together → summary (time, batteries used, times caught, notes found, XP).
10. Unlocked nights and XP are saved to **both** players' localStorage. Continue or return to lobby.

**Disconnect:** night pauses up to 60 s. Rejoin with the same room code restores the player. After 60 s the room returns to the lobby; checkpoint progress held in server memory is kept while the room exists.

**Room lifetime:** a room is deleted 5 minutes after both players leave. Nothing is stored on the server long-term.
