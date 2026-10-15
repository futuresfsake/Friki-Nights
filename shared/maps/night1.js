// Night 1 — Foyer and Parlor.
// The players wake in the Foyer. The front door (X) is sealed until the hall has power;
// a hand slams the window (W) beside it the first time someone walks past (JS-06).
//   Dormitory (west, dark): the parlor key (JS-01 when taken), a battery, beds to hide under
//   Parlor (east, locked): the house key and a fuse; leaving it slams the door (JS-02)
//   Hall (south): fuse box at its east end; its lights (G) come on with the power
//   Cells (off the hall): one bed each, a fuse in the last one
//   South wing (through Cell 4's broken back wall): the Gallery, the Ballroom where
//   Clara still dances, the Kitchen and the Library. Nothing you need is there; plenty
//   you don't want is.
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
    '##############D###############',
    '#B....S...............S......#',
    '#..........................N.#',
    '########D##############D######',
    '#.................#.........B#',
    '#..S..............#..........#',
    '#.................#....S.....#',
    '#.................#..........#',
    '#.................#..........#',
    '#........S........#####D######',
    '#.................#..........#',
    '#.................#..........#',
    '#.................D..........#',
    '#.................#..........#',
    '#.B.............N.#.C.....N..#',
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
    "The portraits in the gallery were turned to face the wall the winter Clara died. Someone keeps turning them back. At night I hear her music box from the ballroom. Mother says nobody has wound it in years. — E.",
    "Clara danced until her feet bled, because Father liked to watch. If you hear her music, stand still. Don't run, don't breathe. She only stops for the ones who stand still. The others she dances with. — A.",
    "Index card, in pencil: 'Hollowmere, south wing. Closed 1931 by order of the family. Reason given: damp.' Underneath, scratched in so hard it tore the card: 'it was not the damp.'",
  ],
  triggers: [
    // A hand slams the foyer window the first time someone walks past it; everyone
    // hears the glass (target: 'all'). The rest only happen to whoever sets them off.
    { scare: 'JS-06', once: true, window: 'window-11-0', target: 'all' },
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
    { name: 'Gallery', x0: 1, z0: 17, x1: 28, z1: 18 },
    { name: 'Ballroom', x0: 1, z0: 20, x1: 17, z1: 30 },
    { name: 'Kitchen', x0: 19, z0: 20, x1: 28, z1: 24 },
    { name: 'Library', x0: 19, z0: 26, x1: 28, z1: 30 },
  ],
  // Scribbles A. left on the map he drew (house map, M2-S21). Each ≤ 40 characters.
  mapNotes: [
    { x: 4, z: 6, text: 'under the beds' },
    { x: 23, z: 2, text: 'locked. key sleeps west' },
    { x: 26, z: 9, text: 'the box →' },
    { x: 26, z: 13, text: 'the last one' },
    { x: 13, z: 1, text: 'OUT (when the lights live)' },
    { x: 19, z: 13, text: 'he sits here' },
    { x: 14, z: 15, text: 'the wall is open here' },
    { x: 9, z: 24, text: 'she still dances. DONT MOVE' },
    { x: 24, z: 22, text: 'nobody eats here' },
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
    // Gallery: portraits all the way along
    { type: 'portrait', x: 3, z: 17, side: 'n' },
    { type: 'portrait', x: 9, z: 17, side: 'n' },
    { type: 'portrait', x: 18, z: 17, side: 'n' },
    { type: 'portrait', x: 25, z: 17, side: 'n' },
    { type: 'portrait', x: 5, z: 18, side: 's' },
    { type: 'portrait', x: 16, z: 18, side: 's' },
    { type: 'bench', x: 11, z: 18, side: 's' },
    { type: 'bloodstain', x: 19, z: 18, rot: 40 },
    { type: 'papers', x: 4, z: 18 },
    { type: 'crates', x: 28, z: 17, side: 'e' },
    // Ballroom
    { type: 'clock', x: 1, z: 20, side: 'w' },
    { type: 'portrait', x: 1, z: 23, side: 'w' },
    { type: 'portrait', x: 1, z: 27, side: 'w' },
    { type: 'fireplace', x: 17, z: 23, side: 'e' },
    { type: 'rug', x: 9, z: 25 },
    { type: 'fallenChair', x: 5, z: 27, rot: 60 },
    { type: 'chair', x: 4, z: 23, rot: 20 },
    { type: 'chair', x: 14, z: 21, rot: 200 },
    { type: 'roundTable', x: 13, z: 28 },
    { type: 'chair', x: 12, z: 28, rot: 90, dx: 0.2 },
    { type: 'bloodstain', x: 10, z: 29, rot: 120 },
    { type: 'papers', x: 7, z: 22 },
    // Kitchen
    { type: 'table', x: 24, z: 22, dz: 0.3 },
    { type: 'chair', x: 23, z: 22, rot: 90, dx: 0.1, dz: 0.3 },
    { type: 'fallenChair', x: 26, z: 23, rot: 250 },
    { type: 'crates', x: 19, z: 20, side: 'n' },
    { type: 'wardrobe', x: 28, z: 22, side: 'e' }, // the pantry
    { type: 'bucket', x: 27, z: 24, dz: 0.4 },
    { type: 'stool', x: 21, z: 21 },
    { type: 'bloodstain', x: 21, z: 23, rot: 10 },
    // Library
    { type: 'bookshelf', x: 22, z: 30, side: 's' },
    { type: 'bookshelf', x: 24, z: 30, side: 's' },
    { type: 'bookshelf', x: 28, z: 27, side: 'e' },
    { type: 'bookshelf', x: 20, z: 26, side: 'n' },
    { type: 'rockingChair', x: 21, z: 28, rot: 120 },
    { type: 'roundTable', x: 25, z: 28 },
    { type: 'armchair', x: 26, z: 27, rot: 220, dx: 0.3 },
    { type: 'rug', x: 24, z: 28, rot: 90 },
    { type: 'papers', x: 26, z: 29 },
    // More things in the house (MH-S07)
    { type: 'doll', x: 6, z: 5, rot: 200 }, // dormitory, facing the beds
    { type: 'cobweb', x: 7, z: 1, dx: 0.6, dz: -0.6 },
    { type: 'mirror', x: 17, z: 2, side: 'e' }, // foyer
    { type: 'chandelier', x: 13, z: 5 },
    { type: 'sheetChair', x: 20, z: 5, rot: 60 }, // parlor
    { type: 'cobweb', x: 28, z: 7, dx: 0.6, dz: 0.6 },
    { type: 'cobweb', x: 1, z: 9, dx: -0.6, dz: -0.6 }, // hall
    { type: 'doll', x: 15, z: 10, rot: 330 },
    { type: 'cobweb', x: 28, z: 10, dx: 0.6, dz: 0.6 },
    { type: 'doll', x: 11, z: 12, rot: 180 }, // cell 3, facing the door
    { type: 'sheetChair', x: 7, z: 17, rot: 180 }, // gallery
    { type: 'mirror', x: 21, z: 18, side: 's' },
    { type: 'cobweb', x: 1, z: 17, dx: -0.6, dz: -0.6 },
    { type: 'piano', x: 9, z: 30, side: 's' }, // ballroom
    { type: 'chandelier', x: 9, z: 25 },
    { type: 'mirror', x: 17, z: 26, side: 'e' },
    { type: 'mirror', x: 17, z: 21, side: 'e' },
    { type: 'sheetChair', x: 5, z: 24, rot: 30 },
    { type: 'sheetChair', x: 14, z: 25, rot: 230 },
    { type: 'sheetChair', x: 6, z: 29, rot: 340 },
    { type: 'doll', x: 2, z: 26, rot: 90 },
    { type: 'cobweb', x: 17, z: 30, dx: 0.6, dz: 0.6 },
    { type: 'cobweb', x: 1, z: 30, dx: -0.6, dz: 0.6 },
    { type: 'stove', x: 21, z: 20, side: 'n' }, // kitchen
    { type: 'counter', x: 25, z: 20, side: 'n' },
    { type: 'counter', x: 19, z: 23, side: 'w' },
    { type: 'cobweb', x: 28, z: 24, dx: 0.6, dz: 0.6 },
    { type: 'desk', x: 27, z: 29, rot: 270, dx: 0.2 }, // library
    { type: 'doll', x: 23, z: 29, rot: 0 },
    { type: 'cobweb', x: 19, z: 30, dx: -0.6, dz: 0.6 },
  ],
};
