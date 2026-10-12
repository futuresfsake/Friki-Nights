# Controls and UI

> Collects the controls and screens mentioned across the other docs. Items marked **Proposed** are not decided yet.

## 1. Controls (desktop, keyboard + mouse)

| Input | Action | Source |
| --- | --- | --- |
| Mouse | Look around (pointer lock) | FR-03 |
| W A S D | Move | FR-03 |
| Shift (hold) | Run | FR-03 |
| F | Toggle flashlight | FR-04 |
| E | Interact: doors, keys, notes, batteries, levers, hiding closets | FR-05 |
| E (hold 3 s) | Revive a downed partner within 1.5 m | FR-10 |
| Click | Lock the mouse / resume from pause | M1 |
| Esc | Release the mouse, open the pause menu | M1 (pause menu **Proposed**) |
| V (hold) | Push-to-talk | FR-08 — key **Proposed** |
| M | Mute / unmute microphone | FR-08 — key **Proposed** |
| Tab | Show inventory | **Proposed** |

Mouse sensitivity is changed in Settings (FR-15).

## 2. Screens

| Screen | Contents |
| --- | --- |
| Title | "FRIKI NIGHTS", content warning, Play, Settings |
| Waking the house… | Shown while the Render server wakes up (up to ~1 min) |
| Lobby | Display name, Create room / Join room, room code display |
| Ready | Secret code word, microphone permission, Ready button, partner status |
| Night select | Host picks an unlocked night |
| Intro | Short text intro for the night |
| In-game HUD | Crosshair, battery bar, interaction prompt ("E — Open door"), subtitles, mic/mute icon |
| Note reader | Full-screen note text; the Scare Director never fires while it is open |
| Downed | Dark screen, revive countdown (60 s), partner distance hint (**Proposed**) |
| Paused (disconnect) | "Waiting for partner…" with a 60 s countdown |
| Summary | Time, batteries used, times caught, notes found, XP, rank |
| Settings | Sensitivity, volume, sting volume, reduce flashing, subtitles |

## 3. HUD rules

- Keep the HUD minimal: darkness is part of the horror.
- All player-provided text (names, notes) is rendered with `textContent`.
- Subtitles show for important audio cues, e.g. "[knocking upstairs]".
