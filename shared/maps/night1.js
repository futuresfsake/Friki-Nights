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
  // Named areas for the house map (inclusive cell ranges). Entering one marks it on
  // your map.
  rooms: [
    { name: 'Dormitory', x0: 1, z0: 1, x1: 7, z1: 7 },
    { name: 'Foyer', x0: 9, z0: 1, x1: 17, z1: 7 },
    { name: 'Parlor', x0: 19, z0: 1, x1: 28, z1: 7 },
    { name: 'Hall', x0: 1, z0: 9, x1: 28, z1: 10 },
    { name: 'Cell 1', x0: 1, z0: 12, x1: 3, z1: 15 },
    { name: 'Cell 2', x0: 5, z0: 12, x1: 7, z1: 15 },
    { name: 'Cell 3', x0: 9, z0: 12, x1: 11, z1: 15 },
    { name: 'Cell 4', x0: 13, z0: 12, x1: 15, z1: 15 },
    { name: 'Cell 5', x0: 17, z0: 12, x1: 19, z1: 15 },
    { name: 'Cell 6', x0: 21, z0: 12, x1: 23, z1: 15 },
    { name: 'Cell 7', x0: 25, z0: 12, x1: 27, z1: 15 },
  ],
  // Scribbles A. left on the map he drew (house map, M2-S21). Each ≤ 40 characters.
  mapNotes: [
    { x: 4, z: 6, text: 'under the beds' },
    { x: 23, z: 2, text: 'locked. key sleeps west' },
    { x: 26, z: 9, text: 'the box →' },
    { x: 26, z: 13, text: 'the last one' },
    { x: 13, z: 1, text: 'OUT (when the lights live)' },
    { x: 19, z: 13, text: 'he sits here' },
  ],
  // Furniture and clutter (shared/props.js). Kept clear of doorways and the paths
  // between puzzle pieces; the reachability test walks around every solid one.
  props: [
    // Dormitory
    { type: 'wardrobe', x: 4, z: 1, side: 'n' },
    { type: 'fallenChair', x: 3, z: 3, rot: 30 },
    { type: 'chains', x: 3, z: 4 },
    { type: 'bloodstain', x: 5, z: 4, rot: 20 },
    { type: 'papers', x: 5, z: 6 },
    { type: 'bucket', x: 7, z: 7, dx: 0.5, dz: 0.5 },
    { type: 'stool', x: 6, z: 3, dx: 0.3 },
    // Foyer
    { type: 'clock', x: 9, z: 1, side: 'n' },
    { type: 'houseMap', x: 10, z: 7, side: 's' }, // the map, pinned by the door south
    { type: 'portrait', x: 9, z: 3, side: 'w' },
    { type: 'bench', x: 9, z: 5, side: 'w' },
    { type: 'portrait', x: 16, z: 1, side: 'n' },
    { type: 'rug', x: 13, z: 4 },
    { type: 'roundTable', x: 15, z: 3, dz: 0.3 },
    { type: 'coatRack', x: 17, z: 6, dx: 0.45, dz: 0.4 },
    // Parlor
    { type: 'bookshelf', x: 20, z: 1, side: 'n' },
    { type: 'bookshelf', x: 22, z: 1, side: 'n' },
    { type: 'rockingChair', x: 21, z: 3, rot: 300 }, // facing the door,
    { type: 'fireplace', x: 28, z: 4, side: 'e' },
    { type: 'armchair', x: 26, z: 4, rot: 90, dx: 0.2 },
    { type: 'rug', x: 24, z: 4, rot: 90 },
    { type: 'roundTable', x: 24, z: 6 },
    { type: 'chair', x: 23, z: 6, rot: 90, dx: 0.3 },
    { type: 'portrait', x: 19, z: 6, side: 'w' },
    { type: 'papers', x: 26, z: 6 },
    // Hall
    { type: 'wheelchair', x: 4, z: 10, rot: 200 },
    { type: 'chains', x: 9, z: 9 },
    { type: 'bloodstain', x: 11, z: 10, rot: 70 },
    { type: 'bench', x: 17, z: 9, side: 'n' },
    { type: 'chains', x: 20, z: 10 },
    { type: 'crates', x: 24, z: 9, side: 'n' },
    { type: 'stool', x: 27, z: 10 },
    // Cells
    { type: 'bucket', x: 3, z: 13, dx: 0.4 },
    { type: 'chair', x: 5, z: 13, rot: 270, dx: -0.3 }, // facing the wall
    { type: 'papers', x: 9, z: 14 },
    { type: 'bucket', x: 15, z: 12, dx: 0.4, dz: -0.3 },
    { type: 'chair', x: 19, z: 13, rot: 90, dx: 0.3 }, // facing the wall
    { type: 'bloodstain', x: 18, z: 13 },
    { type: 'fallenChair', x: 22, z: 13, rot: 100 },
    { type: 'chains', x: 25, z: 13 },
    { type: 'portrait', x: 27, z: 12, side: 'e' },
  ],
};
