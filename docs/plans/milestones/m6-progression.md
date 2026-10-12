# M6 — Progression ⬜

**Goal:** progress carries over between play sessions.
**Done when:** XP, rank, perks, and unlocked nights survive a reload on both browsers.
**Depends on:** M5
**Branch:** `m6-progression`

> Tasks for each story are written when M6 starts.
>
> **Proposed:** which rank unlocks which perk (Partners → battery, Inseparable → radio burst, Soulbound → partner ping) and the +25% battery value are not decided yet.

## Summary

| ID | Story (feature) | Priority | Size | Status |
| --- | --- | --- | --- | --- |
| M6-S01 | Local save | Must | S | ⬜ |
| M6-S02 | Night stats tracking | Must | S | ⬜ |
| M6-S03 | XP calculation | Must | S | ⬜ |
| M6-S04 | Couple rank | Must | S | ⬜ |
| M6-S05 | Night summary screen | Must | M | ⬜ |
| M6-S06 | Night unlocks and night select | Must | M | ⬜ |
| M6-S07 | Perk: longer flashlight battery | Should | S | ⬜ |
| M6-S08 | Perk: radio burst | Should | M | ⬜ |
| M6-S09 | Perk: partner ping | Should | S | ⬜ |
| M6-S10 | Rank and perks screen | Could | S | ⬜ |

**10 stories · 0 done** (6 Must · 3 Should · 1 Could)

## Out of scope

Server-side saves, accounts, cloud sync (non-goals).

## Stories

### M6-S01 · Local save

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** FR-13, US-12, LLD §5

> As a player, I want my progress saved in my browser, so that we continue next time without accounts.

**Acceptance criteria**
- `frikiNights.save` in localStorage: `unlockedNights`, `xp`, `rank`, `settings`
- Corrupt or missing save → safe defaults, never a crash
- **Tests:** load/save, corrupt data

### M6-S02 · Night stats tracking

**Priority:** Must · **Size:** S · **Status:** ⬜

> As a developer, I want the server to track each night's stats, so that both players get the same summary.

**Acceptance criteria**
- Time, batteries used, times caught, notes found — tracked on the server
- Sent in `night:complete { xp, stats }`

### M6-S03 · XP calculation

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** LLD §7

> As players, we want XP for each night, so that playing well is rewarded.

**Acceptance criteria**
- `100 + 50 if no one was caught + up to 50 for speed + 10 per note found`
- Same XP for both players
- **Tests:** formula edge cases

### M6-S04 · Couple rank

**Priority:** Must · **Size:** S · **Status:** ⬜ · **Traces:** LLD §7

> As a couple, we want a shared rank, so that we feel our progress together.

**Acceptance criteria**
- Strangers 0 · Companions 300 · Partners 800 · Inseparable 1500 · Soulbound 2500
- "Rank up!" moment on the summary screen
- **Tests:** thresholds

### M6-S05 · Night summary screen

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** Game flow step 9

> As players, we want a summary after each night, so that we can see how we did.

**Acceptance criteria**
- Shows time, batteries used, times caught, notes found, XP earned, rank
- Continue (next night) or return to lobby

### M6-S06 · Night unlocks and night select

**Priority:** Must · **Size:** M · **Status:** ⬜ · **Traces:** FR-12, Game flow step 5

> As the host, I want to choose any night we've unlocked, so that we can replay or continue.

**Acceptance criteria**
- Nights unlock in order; completing night N unlocks N+1 for both players
- Host sees only nights unlocked in their browser
- **Test:** progress survives a page reload on both browsers (US-12)

### M6-S07 · Perk: longer flashlight battery

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** LLD §7

> As a ranked-up couple, we want a longer-lasting flashlight, so that our progress helps us.

**Acceptance criteria**
- Unlocked at Partners; battery lasts +25%

### M6-S08 · Perk: radio burst

**Priority:** Should · **Size:** M · **Status:** ⬜ · **Traces:** LLD §7

> As a ranked-up couple, we want a radio burst that freezes the creature, so that we can escape a bad moment.

**Acceptance criteria**
- Unlocked at Inseparable; once per night; freezes The Waiting One for 5 s
- Loud static burst sound

### M6-S09 · Perk: partner ping

**Priority:** Should · **Size:** S · **Status:** ⬜ · **Traces:** LLD §7

> As a ranked-up couple, we want to see where our partner is for a moment, so that we can regroup.

**Acceptance criteria**
- Unlocked at Soulbound; partner's outline visible through walls for 10 s; 60 s cooldown

### M6-S10 · Rank and perks screen

**Priority:** Could · **Size:** S · **Status:** ⬜

> As players, we want to see our rank and what's next, so that we have something to aim for.

**Acceptance criteria**
- Lobby panel: current rank, XP to next rank, unlocked and locked perks
