# Milestone Foundation

How Friki Nights is planned and built. Read this before starting any milestone.

## 1. Development approach

Friki Nights uses an **iterative, milestone-based development approach** instead of time-boxed sprints.

- **Milestones, not sprints.** A milestone ends when its **"Done when"** exit criteria are met, not after a fixed number of weeks. There is no sprint planning, velocity, or burndown.
- **Incremental.** Each milestone builds on the previous one, and the game stays runnable after every milestone.
- **Vertical slice first.** Night 1 is finished end to end (M1–M6) before Nights 2–5 are built (M7), so every system is proven on one small, complete level.
- **Continuous flow.** Work is picked up when there is time, similar to Kanban, which suits a one-developer project with irregular hours across two time zones.

| | Sprints (Scrum) | Milestones (this project) |
| --- | --- | --- |
| What ends a stage | Time (usually 1–2 weeks) | A goal (the "Done when" criteria) |
| Planning question | "What fits in the next 2 weeks?" | "What must work before we move on?" |
| Progress measured by | Velocity, burndown | Has the exit criteria been met? |

## 2. Roadmap

| ID | Milestone | Done when |
| --- | --- | --- |
| M1 | Dark house prototype | Runs with `npm run dev` and builds |
| M2 | Interactions + first scares | Night 1 is solvable and scary alone |
| M3 | Multiplayer | Two browsers finish Night 1 together at 250 ms simulated delay |
| M4 | Voice | You talk in-game Cebu ↔ Europe |
| M5 | The Waiting One + Scare Director | Entity never moves while watched (tested) and scares respect pacing |
| M6 | Progression | XP, rank, perks, and unlocked nights survive a reload on both browsers |
| M7 | Content | Nights 2–5 and the ending are playable together |
| M8 | Polish and release | Public link works on both laptops with no critical bugs |

M6–M8 "Done when" wording is derived from their scope and the user stories; adjust if needed.

## 3. Milestone rules

1. **One milestone at a time.** Don't start the next one until the current "Done when" is met.
2. **Break it into tasks.** Before starting, list the milestone's tasks in [Milestone status](milestone-status.md).
3. **One branch per milestone**, e.g. `m2-interactions`. Merge into `main` when done; `main` must always build and run.
4. **Tests come with the work.** Every new mechanic gets at least one unit test (see [Testing](../planning/testing.md)).
5. **Playtest at the end.** Check the "Done when" by actually playing, not just by reading code.
6. **Update the docs.** When a milestone finishes, update [Milestone status](milestone-status.md) and [Current code status](../tech/current-code-status.md).
7. **Scope creep goes to later.** New ideas found mid-milestone go to the "Later" list in the status file, not into the current milestone.

## 4. Milestone lifecycle

```
Not started → In progress → Testing → Done
```

| State | Meaning |
| --- | --- |
| Not started | Scope is defined in [Milestone reference](milestone-reference.md), no work yet |
| In progress | Branch exists, tasks are being done |
| Testing | All tasks done; checking the "Done when" criteria and playtesting |
| Done | Criteria met, branch merged, docs updated |

## 5. Template for a new milestone

```markdown
## Mx — Name

**Goal:** one sentence.
**Done when:** a testable condition.
**Depends on:** previous milestones.

### Scope
- ...

### Out of scope
- ...

### Files / modules
- ...

### Requirements covered
- FR-.., US-..

### Tests
- ...
```
