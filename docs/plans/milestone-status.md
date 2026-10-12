# Milestone Status

Live progress tracker. Update this file whenever a story or milestone changes state. The stories themselves (features, acceptance criteria, tasks) live in [`milestones/`](milestones/).

**Last updated:** 2026-10-12
**Current milestone:** M2 — Interactions + first scares (in progress)
**Deadline:** personal date, flexible — target is the full game (M1–M8)

## Overview

| ID | Milestone | State | Stories done | Branch | Story file |
| --- | --- | --- | --- | --- | --- |
| M1 | Dark house prototype | ✅ Done | 12 / 12 | `m1-prototype` (merged) | [M1](milestones/m1-dark-house-prototype.md) |
| M2 | Interactions + first scares | ✅ Done | 19 / 19 | `m2-interactions` | [M2](milestones/m2-interactions-and-first-scares.md) |
| M3 | Multiplayer | 🔨 In progress | 1 / 22 | `m3-multiplayer` | [M3](milestones/m3-multiplayer.md) |
| M4 | Voice | ⬜ Not started | 0 / 11 | `m4-voice` | [M4](milestones/m4-voice.md) |
| M5 | The Waiting One + Scare Director | ⬜ Not started | 0 / 16 | `m5-waiting-one` | [M5](milestones/m5-waiting-one-and-scare-director.md) |
| M6 | Progression | ⬜ Not started | 0 / 10 | `m6-progression` | [M6](milestones/m6-progression.md) |
| M7 | Content | ⬜ Not started | 0 / 25 | `m7-night2` … | [M7](milestones/m7-content.md) |
| M8 | Polish and release | ⬜ Not started | 0 / 15 | `m8-release` | [M8](milestones/m8-polish-and-release.md) |
| | **Total** | | **32 / 130** | | |

Milestone states: ⬜ Not started · ⏭️ Next · 🔨 In progress · 🧪 Testing · ✅ Done
Story states: ⬜ Not started · 🔨 In progress · 🧪 Testing · ✅ Done · ❌ Dropped

## Stories by priority

| Milestone | Must | Should | Could | Total |
| --- | --- | --- | --- | --- |
| M1 | 9 | 3 | 0 | 12 |
| M2 | 15 | 3 | 1 | 19 |
| M3 | 20 | 2 | 0 | 22 |
| M4 | 7 | 3 | 1 | 11 |
| M5 | 13 | 3 | 0 | 16 |
| M6 | 6 | 3 | 1 | 10 |
| M7 | 22 | 3 | 0 | 25 |
| M8 | 11 | 4 | 0 | 15 |
| **Total** | **103** | **24** | **3** | **130** |

## Current milestone: M2

Done: S01–S04, S19. Working through the rest story by story: one branch per story, merged into `main` when its tests and build pass. Next: **M2-S05 · Locked doors and keys**.
Full story list and tasks: [M2 — Interactions + first scares](milestones/m2-interactions-and-first-scares.md).

## Later (ideas not in any milestone yet)

- Async "Solo Visit" mode with notes saved between sessions (non-goal for v1; normal solo play is now supported)

## Change log

| Date | Change |
| --- | --- |
| 2026-10-12 | Docs created; M1 marked done; M2 next |
| 2026-10-12 | Original M1 code found to be lost → M1 back to Next (rebuild). Open questions resolved (access phrase, no checkpoints, closets, fuse box, fake voices, English, keys) |
| 2026-10-12 | M1 rebuilt in `client/` on `m1-prototype`; tests and build pass → Testing |
| 2026-10-12 | M1 playtested (footsteps quieter, flashlight blink added) → Done, merged into `main`; M2 next |
| 2026-10-12 | Planning restructured: every milestone split into stories (one story = one feature); 125 stories across M1–M8 |
| 2026-10-12 | Players changed from exactly 2 to **1–4**: solo is a real mode, puzzles scale up for 3–4. New stories M3-S21, M3-S22, M7-S24, M7-S25; M3-S18 became Solo play (Must). 129 stories |
| 2026-10-12 | M2 started on `m2-interactions`: S01 shared map format and S02 night state done; S03 interaction and S04 doors built, awaiting playtest |
| 2026-10-12 | Look changed from an old house to abandoned cells: concrete-block walls. New story M2-S19: beds (`C`) to hide under, built now; they become real escapes when The Waiting One arrives (M5). Jump scares stay in planned order. 130 stories |
| 2026-10-12 | S03, S04, S19 accepted on automated tests (owner asked for continuous, non-gated work). Workflow from here: one branch per story, merged into `main` and pushed when tests + build pass |
