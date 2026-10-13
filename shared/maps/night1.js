// Night 1 — Foyer and Parlor.
// The players wake in the Foyer. The front door (X) is sealed until the hall has power;
// a hand slams the window (W) beside it the first time someone walks past (JS-06).
//   Dormitory (west, dark): the parlor key (JS-01 when taken), a battery, beds to hide under
//   Parlor (east, locked): the house key and a fuse; leaving it slams the door (JS-02)
//   Hall (south): fuse box at its east end; its lights (G) come on with the power
//   Cells (off the hall): one bed each, a fuse in the last one
// Puzzle chain: parlor key → parlor → house key + 3 fuses → fuse box → power → front door.
export default {
  id: 'night1',
  name: 'Foyer and Parlor',
  intro: 'You wake on the cold foyer floor. The front door will not open. Somewhere in the walls, paper is tearing.',
  grid: [
    '###########W##X###############',
    '#N......#.........#.....B....#',
    '#C.....C#.N.T...U.#........K.#',
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
  // Reading order: dormitory, foyer, parlor, cells. Each ≤ 280 characters.
  notes: [
    "They moved the beds in here after the letters stopped coming. I sleep under mine now. When the knocking starts, under the bed is the only place it doesn't look. — E.",
    "Dearest A., the post came again and nothing from you. Mother says the sea swallows letters. I don't believe her. I believe this house. At night I hear paper tearing inside the walls. Write anyway. — E.",
    "Half a letter, torn clean down the middle: '...the brass key for the fuse box, I keep it here in the par...' and '...three fuses, love. One is in the last cell, where they put the ones who wouldn't stop wr...' The other half is gone.",
    "Day 41. They took my pen, so I scratch a line in the wall for every day without your answer. If anyone reads this: the hall lights still work. The box only needs its fuses. Then the front door will let you go. — A.",
  ],
  triggers: [
    // A hand slams the foyer window the first time someone walks past it.
    { scare: 'JS-06', once: true, window: 'window-11-0' },
    // Leaving the parlor with the house key: the parlor door slams behind the player.
    { scare: 'JS-02', once: true, door: 'door-18-4', onlyIf: { doorOpen: 'door-18-4', hasKey: 'house' } },
    { scare: 'whisper' }, // dormitory, in the dark
    { scare: 'whisper', duration: 3.5 }, // cells
  ],
  eventTriggers: [{ when: { type: 'item-taken', keyId: 'parlor' }, scare: 'JS-01', once: true }],
  fuseBoxKey: 'house',
};
