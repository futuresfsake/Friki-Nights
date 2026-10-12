import * as THREE from 'three';

// Seeded so the house looks the same on every load (and later, on both players' screens).
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  // Nearest filtering + no mipmaps gives the crunchy PS1 look.
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function speckle(g, size, rand, amount, alpha) {
  for (let i = 0; i < amount; i++) {
    const shade = rand() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${shade},${shade},${shade},${alpha * rand()})`;
    g.fillRect(Math.floor(rand() * size), Math.floor(rand() * size), 1, 1);
  }
}

function stain(g, x, y, radius, color) {
  const gradient = g.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gradient;
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// Abandoned cell: cinder blocks in running bond, an old painted band along the
// bottom that is peeling away, rust streaks from the top, and scratched tally marks.
export function wallTexture() {
  const rand = mulberry32(11);
  return canvasTexture(64, (g, s) => {
    const blockW = 16;
    const blockH = 8;
    for (let row = 0; row * blockH < s; row++) {
      const offset = row % 2 ? blockW / 2 : 0;
      for (let x = -offset; x < s; x += blockW) {
        const tone = 66 + Math.floor(rand() * 14);
        g.fillStyle = `rgb(${tone},${tone + 2},${tone - 4})`;
        g.fillRect(x, row * blockH, blockW, blockH);
      }
      // Mortar: a dark line under each course and between blocks.
      g.fillStyle = 'rgba(20,20,16,0.7)';
      g.fillRect(0, row * blockH, s, 1);
      for (let x = -offset; x < s; x += blockW) g.fillRect(x, row * blockH, 1, blockH);
    }
    // Peeling paint band; its ragged top edge shows bare block underneath.
    const band = s * 0.62;
    for (let x = 0; x < s; x++) {
      const top = band + Math.floor(rand() * 3) + (rand() < 0.08 ? 4 : 0);
      g.fillStyle = 'rgba(52,66,56,0.85)';
      g.fillRect(x, top, 1, s - top);
    }
    for (let i = 0; i < 5; i++) {
      g.fillStyle = 'rgba(95,95,85,0.6)';
      g.fillRect(Math.floor(rand() * s), band + 4 + Math.floor(rand() * 18), 2 + Math.floor(rand() * 4), 2);
    }
    // Rust streaks running down from the top.
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(rand() * s);
      const length = s * (0.2 + rand() * 0.5);
      const gradient = g.createLinearGradient(0, 0, 0, length);
      gradient.addColorStop(0, 'rgba(90,45,20,0.6)');
      gradient.addColorStop(1, 'rgba(90,45,20,0)');
      g.fillStyle = gradient;
      g.fillRect(x, 0, 1 + Math.floor(rand() * 2), length);
    }
    // A crack wandering down from a corner.
    g.fillStyle = 'rgba(15,15,12,0.8)';
    let cx = s * 0.75;
    for (let y = 2; y < s * 0.4; y++) {
      cx += Math.floor(rand() * 3) - 1;
      g.fillRect(cx, y, 1, 1);
    }
    // Tally marks scratched into the block at eye level: someone counted days here.
    g.fillStyle = 'rgba(150,150,138,0.55)';
    for (let group = 0; group < 2; group++) {
      const gx = 8 + group * 10;
      for (let i = 0; i < 4; i++) g.fillRect(gx + i * 2, 22, 1, 6);
      for (let i = 0; i < 8; i++) g.fillRect(gx - 1 + i, 27 - Math.floor(i * 0.7), 1, 1);
    }
    stain(g, rand() * s, s * 0.85, 12, 'rgba(15,12,8,0.55)');
    stain(g, rand() * s, s * 0.3, 10, 'rgba(30,25,15,0.4)');
    speckle(g, s, rand, 600, 0.14);
  });
}

// Old striped mattress ticking, yellowed and stained.
export function mattressTexture() {
  const rand = mulberry32(53);
  return canvasTexture(32, (g, s) => {
    g.fillStyle = '#6b6450';
    g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(40,45,55,0.45)';
    for (let x = 0; x < s; x += 4) g.fillRect(x, 0, 1, s);
    stain(g, s * 0.4, s * 0.55, 10, 'rgba(70,50,20,0.6)');
    stain(g, s * 0.7, s * 0.3, 6, 'rgba(40,10,8,0.55)');
    speckle(g, s, rand, 120, 0.15);
  });
}

export function floorTexture() {
  const rand = mulberry32(23);
  return canvasTexture(64, (g, s) => {
    const plank = 8;
    for (let y = 0; y < s; y += plank) {
      const tone = 40 + Math.floor(rand() * 18);
      g.fillStyle = `rgb(${tone + 14},${tone},${tone - 16})`;
      g.fillRect(0, y, s, plank);
      // Grain lines.
      g.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 3; i++) g.fillRect(0, y + 1 + Math.floor(rand() * (plank - 2)), s, 1);
      // Gap between planks, and a staggered end joint.
      g.fillStyle = '#120c07';
      g.fillRect(0, y, s, 1);
      g.fillRect(Math.floor(rand() * s), y, 1, plank);
    }
    stain(g, s * 0.3, s * 0.6, 16, 'rgba(10,6,2,0.45)');
    speckle(g, s, rand, 400, 0.1);
  });
}

// kind: 'door' (worn wood), 'locked' (wood + brass lock plate), 'exit' (red front door).
export function doorTexture(kind = 'door') {
  const rand = mulberry32(kind.length * 101);
  return canvasTexture(64, (g, s) => {
    const base = kind === 'exit' ? [70, 18, 16] : [58, 38, 22];
    g.fillStyle = `rgb(${base.join(',')})`;
    g.fillRect(0, 0, s, s);
    // Vertical grain.
    for (let x = 0; x < s; x += 2) {
      g.fillStyle = `rgba(0,0,0,${0.08 + rand() * 0.12})`;
      g.fillRect(x, 0, 1, s);
    }
    // Two recessed panels.
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.lineWidth = 2;
    g.strokeRect(10, 6, s - 20, s * 0.38);
    g.strokeRect(10, s * 0.52, s - 20, s * 0.4);
    // Handle, and a brass lock plate on locked doors.
    g.fillStyle = '#b08d3c';
    g.fillRect(s - 14, s * 0.47, 5, 4);
    if (kind === 'locked') {
      g.fillRect(s - 16, s * 0.5, 9, 12);
      g.fillStyle = '#111';
      g.fillRect(s - 13, s * 0.55, 3, 5);
    }
    stain(g, rand() * s, s * 0.8, 12, 'rgba(10,6,2,0.5)');
    speckle(g, s, rand, 300, 0.12);
  });
}

export function ceilingTexture() {
  const rand = mulberry32(37);
  return canvasTexture(64, (g, s) => {
    g.fillStyle = '#5a564e';
    g.fillRect(0, 0, s, s);
    speckle(g, s, rand, 900, 0.15);
    // Water stain rings.
    stain(g, s * 0.6, s * 0.4, 22, 'rgba(70,55,25,0.45)');
    g.strokeStyle = 'rgba(60,45,20,0.4)';
    g.beginPath();
    g.arc(s * 0.6, s * 0.4, 18, 0, Math.PI * 2);
    g.stroke();
  });
}
