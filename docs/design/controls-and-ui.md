# Controls and UI

> Collects the controls and screens mentioned across the other docs. Items marked **Proposed** are not decided yet. All text is in **English**.

## 1. Controls (desktop, keyboard + mouse)

| Input | Action | Source |
| --- | --- | --- |
| Mouse | Look around (pointer lock) | FR-03 |
| W A S D | Move | FR-03 |
| Shift (hold) | Run | FR-03 |
| F | Toggle flashlight | FR-04 |
| E | Interact: doors, keys, notes, batteries, levers, hiding closets, beds (crawl under / out) | FR-05 |
| E (hold 3 s) | Revive a downed partner within 1.5 m | FR-10 |
| Click | Lock the mouse / resume from pause | M1 |
| Esc | Release the mouse, open the pause menu | M1 |
| V (hold) | Push-to-talk | FR-08 |
| M | Mute / unmute microphone | FR-08 |
| Tab | Show inventory | M2 |

Mouse sensitivity is changed in Settings (FR-15).

## 2. Screens

| Screen | Contents |
| --- | --- |
| Title | "FRIKI NIGHTS", content warning, Play, Settings |
| Access | Shared access phrase, asked once and remembered by the browser |
| Waking the house… | Shown while the Render server wakes up (up to ~1 min) |
| Lobby | Display name, Create room / Join room, room code display |
| Ready | Secret code word, microphone permission, Ready button, every player's ready status, host's Start button |
| Night select | Host picks an unlocked night |
| Intro | Short text intro for the night |
| In-game HUD | Crosshair, battery bar, interaction prompt ("E — Open door"), subtitles, mic/mute icon |
| Note reader | Full-screen note text; the Scare Director never fires while it is open |
| Downed | Dark screen, revive countdown (60 s), nearest teammate distance hint (**Proposed**) |
| Night failed | Shown when the revive timer runs out, all players are down, or a solo player is caught; restart the night or return to lobby |
| Paused (disconnect) | "Waiting for <name>…" with a 60 s countdown |
| Summary | Time, batteries used, times caught, notes found, XP, rank |
| Settings | Sensitivity, volume, sting volume, reduce flashing, subtitles |

## 3. HUD rules

- Keep the HUD minimal: darkness is part of the horror.
- All player-provided text (names, notes) is rendered with `textContent`.
- Subtitles show for important audio cues, e.g. "[knocking upstairs]".
