import { CELL } from '../../../shared/constants.js';
import { isSolid } from '../../../shared/mapParser.js';

const INK = 'rgba(38,30,40,0.85)';
const FAINT = 'rgba(38,30,40,0.35)';

// The house map A. drew and pinned in the foyer: ink on old paper, wobbly lines, room
// names, his scribbled warnings. Rooms you've been in are pencil-shaded; a red dot is
// you. Everything is drawn on a canvas with fillText, never as HTML.
export function createHouseMapView(map, { root = document.getElementById('housemap') } = {}) {
  const canvas = root.querySelector('canvas');
  const g = canvas.getContext('2d');
  let open = false;

  // The same wobble every time it's drawn, so the lines don't crawl.
  const wobble = (x, z, k) => Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 0.9;

  function draw({ player, reveal, ghost = null }) {
    const px = Math.floor(Math.min((canvas.width - 40) / map.width, (canvas.height - 40) / map.height));
    const ox = Math.floor((canvas.width - px * map.width) / 2);
    const oz = Math.floor((canvas.height - px * map.height) / 2);
    const sx = (x) => ox + x * px;
    const sz = (z) => oz + z * px;
    g.clearRect(0, 0, canvas.width, canvas.height);

    // Pencil shading over rooms you've walked through.
    g.fillStyle = 'rgba(70,60,60,0.16)';
    for (const r of map.rooms) {
      if (reveal.has(r.name)) g.fillRect(sx(r.x0), sz(r.z0), (r.x1 - r.x0 + 1) * px, (r.z1 - r.z0 + 1) * px);
    }

    // Walls: an ink line wherever floor meets wall.
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    for (let z = 0; z < map.height; z++) {
      for (let x = 0; x < map.width; x++) {
        if (isSolid(map, x, z)) continue;
        const edges = [
          [0, -1, x, z, x + 1, z],
          [0, 1, x, z + 1, x + 1, z + 1],
          [-1, 0, x, z, x, z + 1],
          [1, 0, x + 1, z, x + 1, z + 1],
        ];
        for (const [dx, dz, x0, z0, x1, z1] of edges) {
          if (!isSolid(map, x + dx, z + dz)) continue;
          g.moveTo(sx(x0) + wobble(x0, z0, 1), sz(z0) + wobble(x0, z0, 2));
          g.lineTo(sx(x1) + wobble(x1, z1, 1), sz(z1) + wobble(x1, z1, 2));
        }
      }
    }
    g.stroke();

    // Doors: a short stroke across the gap; locked ones get a cross, the exit an arrow.
    for (const o of map.objects) {
      if (o.type !== 'door' && o.type !== 'exit') continue;
      const cx = sx(o.x + 0.5);
      const cz = sz(o.z + 0.5);
      g.strokeStyle = FAINT;
      g.lineWidth = 1;
      g.beginPath();
      if (o.axis === 'x') {
        g.moveTo(sx(o.x), cz);
        g.lineTo(sx(o.x + 1), cz);
      } else {
        g.moveTo(cx, sz(o.z));
        g.lineTo(cx, sz(o.z + 1));
      }
      g.stroke();
      g.fillStyle = INK;
      g.font = `${Math.max(9, px * 0.55)}px Georgia, serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      if (o.locked) g.fillText('×', cx, cz);
      if (o.type === 'exit') g.fillText('▲', cx, cz);
    }

    // Room names, and A.'s scribbles in a smaller, shakier hand.
    g.fillStyle = INK;
    g.font = `italic ${Math.max(11, px * 0.62)}px Georgia, serif`;
    for (const r of map.rooms) {
      const w = r.x1 - r.x0 + 1;
      g.fillText(r.name, sx(r.x0 + w / 2), sz(r.z0 + (r.z1 - r.z0 + 1) / 2), w * px - 4);
    }
    g.fillStyle = 'rgba(90,20,20,0.75)';
    g.font = `italic ${Math.max(9, px * 0.42)}px Georgia, serif`;
    for (const n of map.mapNotes) g.fillText(n.text, sx(n.x + 0.5), sz(n.z + 0.5));

    // Something else on the map, coming for your dot.
    if (ghost) dot(ghost, 'rgba(10,8,10,0.9)', px * 0.32);
    // You.
    dot(player, '#a01818', px * 0.28);
    const tip = { x: player.x - Math.sin(player.yaw) * CELL * 0.6, z: player.z - Math.cos(player.yaw) * CELL * 0.6 };
    g.strokeStyle = '#a01818';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(sx(player.x / CELL), sz(player.z / CELL));
    g.lineTo(sx(tip.x / CELL), sz(tip.z / CELL));
    g.stroke();

    function dot(p, color, r) {
      g.fillStyle = color;
      g.beginPath();
      g.arc(sx(p.x / CELL), sz(p.z / CELL), r, 0, Math.PI * 2);
      g.fill();
    }
  }

  return {
    draw,
    open() {
      root.classList.add('show');
      open = true;
    },
    close() {
      root.classList.remove('show');
      open = false;
    },
    isOpen: () => open,
  };
}
