// Night 1 — Foyer and Parlor.
// The players wake in the Foyer. The front door (X) is sealed until the hall has power.
//   Dormitory (west, dark): the parlor key (JS-01 when taken), a battery, beds to hide under
//   Parlor (east, locked): the house key and a fuse; leaving it slams the door (JS-02)
//   Hall (south): fuse box at its east end; its lights (G) come on with the power
//   Cells (off the hall): one bed each, a fuse in the last one
// Puzzle chain: parlor key → parlor → house key + 3 fuses → fuse box → power → front door.
export default {
  id: 'night1',
  name: 'Foyer and Parlor',
  grid: [
    '##############X###############',
    '#N......#.........#.....B....#',
    '#C.....C#.N.....U.#........K.#',
    '#.......#....S....#..........#',
    '#.......D........TL....S.....#',
    '#C..T...#.........#..........#',
    '#.K...B.#..PP.PP..#.U........#',
    '#.......#.........#.........N#',
    '#############D################',
    '#.....G...............G.....F#',
    '#.............G..............#',
    '##D###D###D###D###D###D###D###',
    '#...#...#...#...#...#...#...##',
    '#...#...#.T.#.S.#...#...#...##',
    '#...#.B.#...#...#...#...#.U.##',
    '#C..#C..#C..#C..#CN.#C..#C..##',
    '##############################',
  ],
  // Reading order: the house key (in the parlor) comes before the parlor key (dormitory).
  keys: ['house', 'parlor'],
  lockedDoors: ['parlor'],
  notes: [
    'Note 1 (foyer). Story text arrives with M2-S17.',
    'Note 2 (dormitory). Story text arrives with M2-S17.',
    'Note 3 (parlor). Story text arrives with M2-S17.',
    'Note 4 (cells). Story text arrives with M2-S17.',
  ],
  triggers: [
    // Leaving the parlor with the house key: the parlor door slams behind the player.
    { scare: 'JS-02', once: true, door: 'door-18-4', onlyIf: { doorOpen: 'door-18-4', hasKey: 'house' } },
    { scare: 'whisper' }, // dormitory, in the dark
    { scare: 'whisper', duration: 3.5 }, // cells
  ],
  eventTriggers: [{ when: { type: 'item-taken', keyId: 'parlor' }, scare: 'JS-01', once: true }],
  fuseBoxKey: 'house',
};
