# User Stories

These are the **high-level** user stories for the whole game. Each one is delivered by one or more detailed **milestone stories (features)** in [`plans/milestones/`](../plans/milestones/); see the "Delivered by" table below.

| ID | As a… | I want to… | So that… | Acceptance criteria |
| --- | --- | --- | --- | --- |
| US-01 | player | create a room and share a short code | my partner joins me in seconds | 6-char code shown; partner joins < 10 s; a third person is refused |
| US-02 | player | play without making an account | we can start right away | Only a display name is asked |
| US-03 | player | walk and look around in first person | I feel inside the house | WASD, mouse, run work; can't pass through walls |
| US-04 | player | use a flashlight with limited battery | darkness feels dangerous | F toggles; battery drains; pickups refill |
| US-05 | player | see my partner moving | I know where they are | Smooth movement at 250 ms delay |
| US-06 | player | talk to my partner, louder when close | we can plan and scare each other | Voice after mic permission; volume falls with distance; mute works |
| US-07 | player | open doors and pick up keys and notes | I can solve puzzles | Shows on both screens < 500 ms; only one player gets an item |
| US-08 | player | describe my half of a clue | we must work together | Night 2 letter can't be solved from one view |
| US-09 | player | be hunted by something that freezes when watched | I feel tension and must coordinate | Entity never moves while in either view cone |
| US-10 | player | get jump-scared and hear creepy sounds | the game is actually scary | At least one big scare per night; directional sounds work in headphones |
| US-11 | downed player | be revived by my partner | one mistake doesn't end the night | Partner holds E 3 s within 1.5 m; 60 s limit |
| US-12 | player | keep our unlocked nights and XP | we continue next time | Progress survives a page reload on both browsers |

## Delivered by

| ID | Milestone stories (features) |
| --- | --- |
| US-01 | M3-S05 Create room, M3-S06 Join room |
| US-02 | M3-S04 Display name |
| US-03 | M1-S03 Movement, M1-S04 Collision ✅ |
| US-04 | M1-S06 Flashlight with battery ✅, M2-S08 Battery pickups |
| US-05 | M3-S10 Partner model and interpolation |
| US-06 | M4-S02 Voice connection, M4-S03 Proximity volume, M4-S05 Mute |
| US-07 | M2-S04 Doors, M2-S05 Locked doors and keys, M2-S07 Notes, M3-S11 Server-authoritative interactions |
| US-08 | M7-S02 Torn letter split clue |
| US-09 | M5-S03 View cone, M5-S04 Entity state machine |
| US-10 | M2-S13 JS-01, M2-S14 JS-02, M5-S12 Scare Director, M7-S17 JS-07/08, M7-S20 JS-10 |
| US-11 | M5-S08 Revive |
| US-12 | M6-S01 Local save, M6-S06 Night unlocks |
