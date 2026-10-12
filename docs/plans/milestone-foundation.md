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
| M1 | Dark house prototype (rebuild) | Runs with `npm run dev` and builds |
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
2. **Break stories into tasks.** Before starting a milestone, give every story in its file under [`milestones/`](milestones/) a task list.
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

## 5. Stories as features

Every milestone is made of many **stories**. Each story is **one feature**: a single thing a player (or the developer) can see or use, small enough to build, test, and tick off on its own.

```
Milestone (e.g. M2 — Interactions + first scares)
 └── Story = Feature (e.g. M2-S04 · Locked doors and keys)
      ├── Acceptance criteria   how we know the feature works
      ├── Tasks                 the code steps to build it
      └── Tests                 unit / integration / playtest checks
```

A milestone is **done** when all of its **Must** stories are done and its "Done when" condition is met.

### 5.1 Story IDs

`M<milestone>-S<number>`, e.g. `M2-S04`. IDs never change or get reused; a dropped story stays in the file marked ❌ Dropped.

### 5.2 Where stories live

One file per milestone in [`plans/milestones/`](milestones/):

| File | Milestone |
| --- | --- |
| [m1-dark-house-prototype.md](milestones/m1-dark-house-prototype.md) | M1 |
| [m2-interactions-and-first-scares.md](milestones/m2-interactions-and-first-scares.md) | M2 |
| [m3-multiplayer.md](milestones/m3-multiplayer.md) | M3 |
| [m4-voice.md](milestones/m4-voice.md) | M4 |
| [m5-waiting-one-and-scare-director.md](milestones/m5-waiting-one-and-scare-director.md) | M5 |
| [m6-progression.md](milestones/m6-progression.md) | M6 |
| [m7-content.md](milestones/m7-content.md) | M7 |
| [m8-polish-and-release.md](milestones/m8-polish-and-release.md) | M8 |

### 5.3 Priority (MoSCoW)

| Priority | Meaning |
| --- | --- |
| **Must** | The milestone is not done without it |
| **Should** | Important; do it unless time is very short |
| **Could** | Nice to have; first to move to "Later" |

### 5.4 Size

Sizes are rough effort for one developer working evenings, not deadlines.

| Size | Effort |
| --- | --- |
| **S** | About one evening |
| **M** | Two to three evenings |
| **L** | More than three evenings; consider splitting |

### 5.5 Story status

⬜ Not started · 🔨 In progress · 🧪 Testing · ✅ Done · ❌ Dropped

### 5.6 Story definition of done

A story is ✅ Done when:

1. All acceptance criteria pass.
2. Its tests are written and pass (`npm test`).
3. The build works (`npm run build`).
4. It has been tried in the running game.
5. All player-provided text is rendered with `textContent`.

### 5.7 Link to the original user stories

The original high-level user stories (US-01 … US-12 in [User stories](../requirements/user-stories.md)) and requirements (FR / NFR in [Specifications](../requirements/specifications.md)) are **traced** from each milestone story with a **Traces** line, so every requirement can be followed to the features that deliver it.

### 5.8 Story template

```markdown
### Mx-Sxx · Feature name

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-xx, US-xx

> As a <player / developer>, I want <feature>, so that <reason>.

**Acceptance criteria**
- Testable condition
- Testable condition

**Tasks**
- [ ] Code step
- [ ] Test

**Tests:** unit / integration / playtest
```

## 6. Template for a new milestone file

```markdown
# Mx — Name

**Goal:** one sentence.
**Done when:** a testable condition.
**Depends on:** previous milestones.
**Branch:** `mx-name`

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |

## Out of scope
- ...

## Stories
(one section per story, using the story template)
```
