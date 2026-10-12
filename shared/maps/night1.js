// Night 1 — Foyer and Parlor.
// Work in progress: this is the M1 test house with doors (M2-S04) and beds added.
// Keys, notes, fuses and the real layout arrive with M2-S05 … M2-S16.
export default {
  id: 'night1',
  name: 'Foyer and Parlor',
  grid: [
    '######################',
    '#....#....C..#.......#',
    '#.S..#...S...#...S...#',
    '#..K.#.......#......C#',
    '#....###L#####.......#',
    '#...N...PP...........#',
    '#....###D#####.......#',
    '#C...#.......#....B..#',
    '#.S..#...S...#...S...#',
    '#....#.......####D####',
    '######..B....#.......#',
    '     #C......#...S...#',
    '     #########.......#',
    '             #########',
  ],
  keys: ['parlor'],
  lockedDoors: ['parlor'],
  notes: [
    'Placeholder note. The real Night 1 story notes arrive with M2-S17.',
  ],
  triggers: [],
};
