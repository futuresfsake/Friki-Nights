// Night 1 — Foyer and Parlor.
// Work in progress: this is the M1 test house with doors (M2-S04) and beds added.
// Puzzle chain: parlor key → parlor (house key) → 3 fuses → fuse box → hall lights + exit.
// The real layout arrives with M2-S16.
export default {
  id: 'night1',
  name: 'Foyer and Parlor',
  grid: [
    '######################',
    '#....#....C..#.......#',
    '#.S..#...S.K.#...G...#',
    '#..K.#.......#......C#',
    '#....###L#####.......#',
    'X...N...PP..........F#',
    '#....###D#####.......#',
    '#C...#.......#....B..#',
    '#.S..#...S..U#...G...#',
    '#.U..#.......####D####',
    '######..B....#.......#',
    '     #C......#...S.U.#',
    '     #########.......#',
    '             #########',
  ],
  keys: ['house', 'parlor'],
  lockedDoors: ['parlor'],
  notes: [
    'Placeholder note. The real Night 1 story notes arrive with M2-S17.',
  ],
  triggers: [],
  fuseBoxKey: 'house',
};
