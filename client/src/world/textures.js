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

// Small textures are drawn in "size" units but onto a canvas several times bigger, and
// filtered smoothly, so nothing looks like big square pixels (no Minecraft look).
function canvasTexture(size, draw) {
  const scale = Math.max(1, Math.round(256 / size));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * scale;
  const g = canvas.getContext('2d');
  g.scale?.(scale, scale);
  draw(g, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function speckle(g, size, rand, amount, alpha) {
  // One real pixel each, however much the canvas is scaled up.
  const px = 1 / (g.getTransform?.().a || 1);
  for (let i = 0; i < amount; i++) {
    const shade = rand() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${shade},${shade},${shade},${alpha * rand()})`;
    g.fillRect(rand() * size, rand() * size, px * 1.5, px * 1.5);
  }
}

function stain(g, x, y, radius, color) {
  const gradient = g.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gradient;
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// A big, smooth texture for the house itself (walls, floors, ceilings), mapped by world
// position: `metresX` × `metresY` of surface per repeat (builder.js sets the UVs).
const PX_PER_M = 256;
function surfaceTexture(metresX, metresY, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(metresX * PX_PER_M);
  canvas.height = Math.round(metresY * PX_PER_M);
  draw(canvas.getContext('2d'), canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
export const WALL_REPEAT = 4; // metres of wall per repeat of the wall texture
export const FLOOR_REPEAT = 4;

// A wobbly closed blob, for stains and torn patches.
function blob(g, x, y, rx, ry, rand, points = 14) {
  g.beginPath();
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = 0.7 + rand() * 0.5;
    const px = x + Math.cos(a) * rx * r;
    const py = y + Math.sin(a) * ry * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
}

// A crack: a jagged line that forks now and then.
function crack(g, x, y, angle, length, rand, width = 1.5) {
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  for (let d = 0; d < length; d += 6 + rand() * 10) {
    angle += (rand() - 0.5) * 0.9;
    x += Math.cos(angle) * 10;
    y += Math.sin(angle) * 10;
    g.lineTo(x, y);
    if (rand() < 0.08 && width > 0.6) {
      g.stroke();
      crack(g, x, y, angle + (rand() < 0.5 ? 0.8 : -0.8), length * 0.4, rand, width * 0.6);
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(x, y);
    }
  }
  g.stroke();
}

// Walls: 4 m × 3 m of an old house. Faded damask wallpaper gone brown with damp, torn
// away in places down to plaster and lath; the pale ghost of a picture that hung here
// for decades; dark wood wainscoting below a chair rail; a scuffed skirting board.
export function wallTexture() {
  const rand = mulberry32(11);
  return surfaceTexture(WALL_REPEAT, 3, (g, W, H) => {
    const rail = H - 0.95 * PX_PER_M; // top of the chair rail
    const base = H - 0.15 * PX_PER_M; // top of the skirting

    // Wallpaper ground: faded olive with soft vertical stripes.
    const ground = g.createLinearGradient(0, 0, 0, rail);
    ground.addColorStop(0, '#4d4a39');
    ground.addColorStop(1, '#5d5943');
    g.fillStyle = ground;
    g.fillRect(0, 0, W, rail);
    for (let x = 0; x < W; x += 64) {
      g.fillStyle = 'rgba(210,200,160,0.05)';
      g.fillRect(x, 0, 30, rail);
      g.fillStyle = 'rgba(20,18,10,0.06)';
      g.fillRect(x + 30, 0, 2, rail);
    }
    // Damask: a half-drop repeat of a stylised flower, 8 across so it tiles.
    const tile = W / 8;
    for (let row = -1; row * tile < rail + tile; row++) {
      for (let col = 0; col < 8; col++) {
        const cx = col * tile + tile / 2;
        const cy = row * tile + (col % 2 ? tile / 2 : 0) + tile / 2;
        g.save();
        g.translate(cx, cy);
        g.fillStyle = 'rgba(32,30,18,0.32)';
        g.strokeStyle = 'rgba(32,30,18,0.32)';
        g.lineWidth = 3;
        for (let p = 0; p < 4; p++) {
          g.rotate(Math.PI / 2);
          g.beginPath();
          g.ellipse(0, -22, 8, 20, 0, 0, Math.PI * 2);
          g.fill();
          g.beginPath();
          g.arc(18, -18, 12, Math.PI, Math.PI * 1.8);
          g.stroke();
        }
        g.beginPath();
        g.moveTo(0, -10);
        g.lineTo(9, 0);
        g.lineTo(0, 10);
        g.lineTo(-9, 0);
        g.closePath();
        g.fillStyle = 'rgba(150,135,90,0.25)';
        g.fill();
        g.restore();
      }
    }
    // Sun-faded patches, and the darker, unfaded shape where a picture used to hang.
    for (let i = 0; i < 5; i++) {
      blob(g, rand() * W, rand() * rail, 80 + rand() * 120, 60 + rand() * 100, rand);
      g.fillStyle = 'rgba(190,180,140,0.07)';
      g.fill();
    }
    const fx = W * (0.15 + rand() * 0.2);
    const fy = rail * 0.25;
    g.fillStyle = 'rgba(25,20,10,0.18)';
    g.fillRect(fx, fy, 150, 190);
    g.fillStyle = '#1a1510';
    g.beginPath();
    g.arc(fx + 75, fy - 14, 3, 0, Math.PI * 2);
    g.fill();

    // Damp: brown water stains running down from the ceiling, with darker tide marks.
    for (let i = 0; i < 4; i++) {
      const x0 = rand() * W;
      const width = 60 + rand() * 140;
      const length = 120 + rand() * 330;
      g.beginPath();
      g.moveTo(x0 - width / 2, 0);
      const steps = 12;
      const edge = [];
      for (let k = 0; k <= steps; k++) {
        const x = x0 - width / 2 + (width * k) / steps;
        const y = length * (0.5 + 0.5 * Math.sin((k / steps) * Math.PI)) * (0.7 + rand() * 0.5);
        edge.push([x, y]);
        g.lineTo(x, y);
      }
      g.lineTo(x0 + width / 2, 0);
      g.closePath();
      const stainFill = g.createLinearGradient(0, 0, 0, length);
      stainFill.addColorStop(0, 'rgba(60,40,18,0.55)');
      stainFill.addColorStop(1, 'rgba(80,55,25,0.25)');
      g.fillStyle = stainFill;
      g.fill();
      g.strokeStyle = 'rgba(45,28,10,0.5)';
      g.lineWidth = 3;
      g.beginPath();
      edge.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
      // Drips running further down.
      for (let k = 0; k < 3; k++) {
        const [dx, dy] = edge[1 + Math.floor(rand() * (steps - 1))];
        g.fillStyle = 'rgba(55,35,15,0.35)';
        g.fillRect(dx, dy, 3, 30 + rand() * 120);
      }
    }
    // Soot and grime gathered under the ceiling.
    const soot = g.createLinearGradient(0, 0, 0, 90);
    soot.addColorStop(0, 'rgba(8,6,4,0.55)');
    soot.addColorStop(1, 'rgba(8,6,4,0)');
    g.fillStyle = soot;
    g.fillRect(0, 0, W, 90);

    // Torn patches: the paper ripped away down to grey plaster, and in one the plaster
    // too, down to the wooden lath.
    for (let i = 0; i < 3; i++) {
      const px = 120 + rand() * (W - 240);
      const py = 120 + rand() * (rail - 240);
      const rx = 50 + rand() * 90;
      const ry = 40 + rand() * 80;
      blob(g, px, py, rx, ry, rand, 18);
      g.save();
      g.clip();
      g.fillStyle = '#8b857a';
      g.fillRect(px - rx * 2, py - ry * 2, rx * 4, ry * 4);
      for (let k = 0; k < 30; k++) {
        g.fillStyle = `rgba(${rand() < 0.5 ? '40,35,30' : '180,175,160'},0.12)`;
        g.fillRect(px - rx + rand() * rx * 2, py - ry + rand() * ry * 2, 4 + rand() * 12, 2 + rand() * 6);
      }
      if (i === 0) {
        blob(g, px, py + 6, rx * 0.5, ry * 0.45, rand, 12);
        g.clip();
        g.fillStyle = '#120d08';
        g.fillRect(px - rx, py - ry, rx * 2, ry * 2);
        for (let y = py - ry; y < py + ry; y += 16) {
          g.fillStyle = '#4a3420';
          g.fillRect(px - rx, y, rx * 2, 11);
        }
      }
      g.restore();
      // The torn edge: pale paper backing, curling.
      blob(g, px, py, rx, ry, mulberry32(i + 500), 18);
      g.strokeStyle = 'rgba(175,165,135,0.8)';
      g.lineWidth = 4;
      g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.lineWidth = 2;
      g.stroke();
    }
    // A long strip of paper peeling down from the top, its pale back showing.
    const sx = rand() * (W - 80);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath();
    g.moveTo(sx + 6, 0);
    g.lineTo(sx + 70, 0);
    g.lineTo(sx + 86, 170);
    g.lineTo(sx + 30, 185);
    g.fill();
    g.fillStyle = '#a69c80';
    g.beginPath();
    g.moveTo(sx, 0);
    g.lineTo(sx + 64, 0);
    g.lineTo(sx + 78, 160);
    g.lineTo(sx + 22, 176);
    g.fill();
    g.fillStyle = '#3c3a2c';
    g.fillRect(sx, 0, 64, 8);
    for (let i = 0; i < 6; i++) crack(g, rand() * W, rand() * rail, Math.PI / 2 + (rand() - 0.5), 60 + rand() * 120, rand, 1);
    // Mould creeping up from the rail.
    for (let i = 0; i < 6; i++) {
      const mx = rand() * W;
      for (let k = 0; k < 40; k++) {
        g.fillStyle = `rgba(${15 + rand() * 20},${25 + rand() * 20},15,${0.15 + rand() * 0.3})`;
        g.beginPath();
        g.arc(mx + (rand() - 0.5) * 90, rail - rand() * rand() * 140, 1 + rand() * 5, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Wainscoting: dark panelled wood, 1 m panels.
    g.fillStyle = '#2b1d12';
    g.fillRect(0, rail, W, base - rail);
    for (let x = 0; x < W; x += 3) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '0,0,0' : '90,60,35'},${0.05 + rand() * 0.08})`;
      g.fillRect(x, rail, 1 + rand() * 2, base - rail);
    }
    for (let p = 0; p < W / PX_PER_M; p++) {
      const x = p * PX_PER_M + 26;
      const y = rail + 34;
      const w = PX_PER_M - 52;
      const h = base - rail - 64;
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(120,85,50,0.35)';
      g.lineWidth = 3;
      g.strokeRect(x + 4, y + 4, w - 8, h - 8);
      g.strokeStyle = 'rgba(0,0,0,0.6)';
      g.lineWidth = 3;
      g.strokeRect(x, y, w, h);
    }
    // Chair rail: a moulding with a highlight along its top.
    g.fillStyle = '#3a2817';
    g.fillRect(0, rail - 6, W, 20);
    g.fillStyle = 'rgba(160,120,70,0.35)';
    g.fillRect(0, rail - 6, W, 3);
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(0, rail + 14, W, 3);
    // Skirting board.
    g.fillStyle = '#1b120b';
    g.fillRect(0, base, W, H - base);
    g.fillStyle = 'rgba(140,100,60,0.3)';
    g.fillRect(0, base, W, 3);
    // Scuffs, kicks and water damage along the bottom.
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(150,130,100,${0.05 + rand() * 0.12})`;
      g.fillRect(rand() * W, base - 40 + rand() * 60, 10 + rand() * 40, 2);
    }
    for (let i = 0; i < 4; i++) stain(g, rand() * W, H, 60 + rand() * 80, 'rgba(10,8,4,0.6)');
    speckle(g, W, rand, 9000, 0.1);
  });
}

// Floors: worn floorboards, 4 m square. Long planks with staggered joints, grain and
// knots, black gaps full of dirt, scratches, and dark stains.
export function floorTexture() {
  const rand = mulberry32(23);
  return surfaceTexture(FLOOR_REPEAT, FLOOR_REPEAT, (g, W, H) => {
    g.fillStyle = '#0b0705';
    g.fillRect(0, 0, W, H);
    const rows = 22;
    const ph = H / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * ph;
      let x = -rand() * 400;
      while (x < W) {
        const len = 300 + rand() * 700;
        const hue = 24 + rand() * 8;
        const light = 13 + rand() * 9;
        for (const shift of [0, W]) {
          const px = x - shift;
          if (px + len < 0 || px > W) continue;
          g.fillStyle = `hsl(${hue},${30 + rand() * 12}%,${light}%)`;
          g.fillRect(px + 1, y + 1, len - 2, ph - 2.5);
        }
        // Grain: long thin wavering lines along the plank.
        for (let k = 0; k < 9; k++) {
          const gy = y + 3 + rand() * (ph - 6);
          const amp = 0.5 + rand() * 1.5;
          const freq = 0.004 + rand() * 0.01;
          g.strokeStyle = rand() < 0.6 ? `rgba(0,0,0,${0.1 + rand() * 0.15})` : `rgba(160,110,60,${0.05 + rand() * 0.08})`;
          g.lineWidth = 0.6 + rand();
          for (const shift of [0, W]) {
            g.beginPath();
            for (let t = 0; t <= len; t += 12) {
              const px = x - shift + t;
              const py = gy + Math.sin(t * freq + k) * amp;
              if (t === 0) g.moveTo(px, py);
              else g.lineTo(px, py);
            }
            g.stroke();
          }
        }
        // A knot or two.
        if (rand() < 0.5) {
          const kx = x + rand() * len;
          const ky = y + ph / 2;
          for (const shift of [0, W]) {
            g.fillStyle = 'rgba(20,10,5,0.7)';
            g.beginPath();
            g.ellipse(kx - shift, ky, 7 + rand() * 6, 4, 0, 0, Math.PI * 2);
            g.fill();
            g.strokeStyle = 'rgba(20,10,5,0.25)';
            g.lineWidth = 1;
            g.beginPath();
            g.ellipse(kx - shift, ky, 16, 7, 0, 0, Math.PI * 2);
            g.stroke();
          }
        }
        // Nails at the joint.
        g.fillStyle = '#060403';
        for (const shift of [0, W]) {
          g.fillRect(x - shift + 8, y + ph * 0.3, 3, 3);
          g.fillRect(x - shift + 8, y + ph * 0.65, 3, 3);
        }
        x += len;
      }
    }
    // Wear and dirt.
    for (let i = 0; i < 14; i++) {
      blob(g, rand() * W, rand() * H, 60 + rand() * 160, 40 + rand() * 120, rand);
      g.fillStyle = rand() < 0.6 ? 'rgba(5,3,1,0.25)' : 'rgba(140,110,80,0.05)';
      g.fill();
    }
    for (let i = 0; i < 80; i++) {
      g.strokeStyle = `rgba(170,140,100,${0.05 + rand() * 0.1})`;
      g.lineWidth = 0.7;
      const sx = rand() * W;
      const sy = rand() * H;
      const a = (rand() - 0.5) * 0.6;
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(sx + Math.cos(a) * (20 + rand() * 80), sy + Math.sin(a) * (20 + rand() * 80));
      g.stroke();
    }
    // An old, dark stain that soaked into the boards.
    stain(g, W * 0.7, H * 0.3, 120, 'rgba(25,5,3,0.45)');
    speckle(g, W, rand, 12000, 0.12);
  });
}

// Ceilings: cracked, sagging plaster, brown with damp, mould in the corners.
export function ceilingTexture() {
  const rand = mulberry32(37);
  return surfaceTexture(FLOOR_REPEAT, FLOOR_REPEAT, (g, W, H) => {
    g.fillStyle = '#6e6a60';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      blob(g, rand() * W, rand() * H, 40 + rand() * 120, 40 + rand() * 120, rand);
      g.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,250,235,0.04)';
      g.fill();
    }
    // Water stains with rings where they dried and wet again.
    for (let i = 0; i < 3; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const r = 90 + rand() * 140;
      stain(g, x, y, r, 'rgba(85,60,25,0.5)');
      g.strokeStyle = 'rgba(70,45,15,0.45)';
      g.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        blob(g, x, y, r * (0.5 + k * 0.2), r * (0.45 + k * 0.2), rand, 20);
        g.stroke();
      }
    }
    g.strokeStyle = 'rgba(20,16,10,0.7)';
    for (let i = 0; i < 7; i++) crack(g, rand() * W, rand() * H, rand() * Math.PI * 2, 150 + rand() * 300, rand, 2);
    for (let i = 0; i < 3; i++) {
      const mx = rand() * W;
      const my = rand() * H;
      for (let k = 0; k < 60; k++) {
        g.fillStyle = `rgba(15,22,12,${0.1 + rand() * 0.3})`;
        g.beginPath();
        g.arc(mx + (rand() - 0.5) * 120, my + (rand() - 0.5) * 120, 1 + rand() * 6, 0, Math.PI * 2);
        g.fill();
      }
    }
    speckle(g, W, rand, 10000, 0.1);
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

// A torn sheet of paper with lines of handwriting too small to read: the text
// itself is shown in the note reader.
export function paperTexture() {
  const rand = mulberry32(71);
  return canvasTexture(32, (g, s) => {
    g.fillStyle = '#c9c0a8';
    g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(30,25,40,0.55)';
    for (let y = 5; y < s - 4; y += 3) {
      const width = 14 + Math.floor(rand() * 12);
      for (let x = 3; x < 3 + width; x++) if (rand() < 0.8) g.fillRect(x, y, 1, 1);
    }
    stain(g, s * 0.7, s * 0.75, 8, 'rgba(110,80,40,0.5)');
    // Torn corner.
    g.clearRect(s - 6, 0, 6, 3);
    g.clearRect(s - 3, 3, 3, 3);
  });
}

// JS-01: a pale, stretched face with hollow black eyes and a gaping mouth.
// Transparent around the head so only the face shows.
export function faceTexture() {
  const rand = mulberry32(97);
  return canvasTexture(64, (g, s) => {
    g.clearRect(0, 0, s, s);
    const skin = g.createRadialGradient(s / 2, s * 0.45, 4, s / 2, s * 0.5, s * 0.5);
    skin.addColorStop(0, '#e6e0d4');
    skin.addColorStop(0.7, '#bdb5a6');
    skin.addColorStop(1, 'rgba(120,110,100,0)');
    g.fillStyle = skin;
    g.beginPath();
    g.ellipse(s / 2, s / 2, s * 0.34, s * 0.47, 0, 0, Math.PI * 2);
    g.fill();
    // Eyes: deep hollows with a faint wet glint.
    for (const ex of [s * 0.36, s * 0.64]) {
      stain(g, ex, s * 0.4, 9, 'rgba(40,30,30,0.7)');
      g.fillStyle = '#050304';
      g.beginPath();
      g.ellipse(ex, s * 0.41, 5, 6.5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(220,220,210,0.8)';
      g.fillRect(Math.floor(ex) + 1, Math.floor(s * 0.38), 1, 1);
    }
    // Mouth stretched open too far.
    g.fillStyle = '#0a0506';
    g.beginPath();
    g.ellipse(s / 2, s * 0.74, 6, 11, 0, 0, Math.PI * 2);
    g.fill();
    speckle(g, s, rand, 300, 0.12);
  });
}

// JS-06: a grey, dirty hand pressed flat against glass. Transparent around it.
export function handTexture() {
  const rand = mulberry32(131);
  return canvasTexture(64, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.fillStyle = '#a49c90';
    g.beginPath();
    g.ellipse(s * 0.5, s * 0.68, s * 0.2, s * 0.22, 0, 0, Math.PI * 2);
    g.fill();
    // Four long fingers spread against the glass, and a thumb.
    const fingers = [
      [0.33, 0.3, -0.25],
      [0.45, 0.22, -0.08],
      [0.57, 0.24, 0.08],
      [0.68, 0.32, 0.25],
    ];
    for (const [fx, fy, angle] of fingers) {
      g.save();
      g.translate(s * fx, s * fy);
      g.rotate(angle);
      g.fillRect(-3, -2, 6, s * 0.3);
      g.restore();
    }
    g.save();
    g.translate(s * 0.28, s * 0.66);
    g.rotate(-1.0);
    g.fillRect(-3, -2, 6, s * 0.18);
    g.restore();
    stain(g, s * 0.5, s * 0.7, 10, 'rgba(60,40,30,0.5)');
    speckle(g, s, rand, 200, 0.2);
  });
}

// A teammate's name floating over their head. Drawn with fillText, so the name is
// never parsed as HTML.
// color: their player colour, as a small swatch before the name.
export function nameTagTexture(name, color = null) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const g = canvas.getContext('2d');
  g.font = '28px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = '#000';
  g.shadowBlur = 6;
  g.fillStyle = '#e8e0cc';
  g.fillText(name, 136, 32, 220);
  if (color !== null) {
    g.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    g.beginPath();
    g.arc(136 - Math.min(110, g.measureText(name).width / 2) - 14, 32, 7, 0, Math.PI * 2);
    g.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// The Tenant's face: corpse-pale with a blue tinge, a fringe of wet black hair, eye
// sockets that are just holes, black tears running out of them. screaming: the jaw
// hangs open far past where a jaw should stop, ringed with broken teeth.
export function ghostFaceTexture(screaming = false) {
  const rand = mulberry32(screaming ? 617 : 613);
  return canvasTexture(64, (g, s) => {
    const skin = g.createRadialGradient(s / 2, s * 0.45, 4, s / 2, s / 2, s * 0.62);
    skin.addColorStop(0, '#e4e6e0');
    skin.addColorStop(0.6, '#a9b0ae');
    skin.addColorStop(1, '#3c4244');
    g.fillStyle = skin;
    g.fillRect(0, 0, s, s);
    // Hollow cheeks.
    stain(g, s * 0.2, s * 0.62, 11, 'rgba(30,34,40,0.55)');
    stain(g, s * 0.8, s * 0.62, 11, 'rgba(30,34,40,0.55)');
    // Eyes: big empty sockets, one a little lower than the other.
    for (const [ex, ey] of [
      [s * 0.33, s * 0.38],
      [s * 0.67, s * 0.4],
    ]) {
      stain(g, ex, ey, 13, 'rgba(10,8,12,0.9)');
      g.fillStyle = '#000';
      g.beginPath();
      g.ellipse(ex, ey, screaming ? 7 : 6, screaming ? 8 : 5, 0, 0, Math.PI * 2);
      g.fill();
      // Black tears down the cheeks.
      for (let i = 0; i < 3; i++) {
        const tx = ex - 4 + rand() * 8;
        g.fillStyle = 'rgba(8,4,6,0.85)';
        g.fillRect(Math.round(tx), Math.round(ey + 3), 1 + Math.round(rand()), Math.round(8 + rand() * 18));
      }
      // A pinprick of light at the bottom of each hole.
      g.fillStyle = '#f8f8f0';
      g.fillRect(Math.round(ex), Math.round(ey + 1), 1, 1);
    }
    if (screaming) {
      // The jaw unhinged: a black hole down to the chin and beyond.
      const top = s * 0.58;
      g.fillStyle = '#4a0c10';
      g.beginPath();
      g.ellipse(s / 2, s * 0.8, 15, 20, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#000';
      g.beginPath();
      g.ellipse(s / 2, s * 0.81, 12, 18, 0, 0, Math.PI * 2);
      g.fill();
      // Broken teeth, top and bottom, none of them the same length.
      for (let x = s / 2 - 11; x < s / 2 + 11; x += 2.5) {
        const edge = Math.sqrt(Math.max(0, 1 - ((x - s / 2) / 12) ** 2));
        g.fillStyle = rand() < 0.25 ? '#8f8460' : '#d8d0b0';
        g.fillRect(Math.round(x), Math.round(s * 0.81 - edge * 18), 2, 2 + Math.round(rand() * 4));
        if (rand() < 0.6) g.fillRect(Math.round(x), Math.round(s * 0.81 + edge * 18 - 4), 2, 2 + Math.round(rand() * 3));
      }
      g.fillStyle = '#6a1218';
      g.fillRect(s / 2 - 13, top + 2, 2, 6);
    } else {
      // Lips cracked and parted just enough to show the dark.
      g.fillStyle = '#16090c';
      g.beginPath();
      g.moveTo(s * 0.32, s * 0.73);
      g.quadraticCurveTo(s / 2, s * 0.69, s * 0.68, s * 0.74);
      g.quadraticCurveTo(s / 2, s * 0.79, s * 0.32, s * 0.73);
      g.fill();
      g.fillStyle = 'rgba(70,20,26,0.6)';
      g.fillRect(s * 0.44, s * 0.78, 2, 5);
    }
    // Dark veins under the skin.
    g.strokeStyle = 'rgba(40,40,70,0.45)';
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      let x = rand() * s;
      let y = s * 0.15 + rand() * s * 0.5;
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) g.lineTo((x += (rand() - 0.5) * 10), (y += rand() * 6));
      g.stroke();
    }
    // Wet black hair plastered over the top of the face, hanging in points.
    g.fillStyle = '#060507';
    g.fillRect(0, 0, s, s * 0.1);
    g.strokeStyle = '#060507';
    g.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = rand() * s;
      const side = Math.abs(x - s / 2) / (s / 2);
      const len = s * 0.12 + rand() * 5 + side * side * s * 0.6;
      g.lineWidth = 0.6 + rand() * 1.4;
      g.beginPath();
      g.moveTo(x, 0);
      g.quadraticCurveTo(x + (rand() - 0.5) * 4, len * 0.6, x + (x - s / 2) * 0.08 + (rand() - 0.5) * 3, len);
      g.stroke();
    }
    speckle(g, s, rand, 350, 0.15);
  });
}

// The Tenant's gown: a burial shroud gone grey, folds streaked with grime, dried
// blood soaked into the chest and hem.
export function shroudTexture() {
  const rand = mulberry32(719);
  return canvasTexture(64, (g, s) => {
    g.fillStyle = '#c9c7bd';
    g.fillRect(0, 0, s, s);
    // Vertical folds.
    for (let x = 0; x < s; x += 4 + Math.floor(rand() * 4)) {
      g.fillStyle = `rgba(40,40,45,${0.1 + rand() * 0.2})`;
      g.fillRect(x, 0, 1 + Math.round(rand()), s);
    }
    // Grime climbing up from the hem.
    const grime = g.createLinearGradient(0, 0, 0, s);
    grime.addColorStop(0, 'rgba(60,50,40,0)');
    grime.addColorStop(0.7, 'rgba(60,50,40,0.25)');
    grime.addColorStop(1, 'rgba(40,30,25,0.75)');
    g.fillStyle = grime;
    g.fillRect(0, 0, s, s);
    stain(g, s * 0.3, s * 0.22, 9, 'rgba(90,15,15,0.7)');
    stain(g, s * 0.36, s * 0.3, 5, 'rgba(70,10,10,0.8)');
    for (let i = 0; i < 6; i++) stain(g, rand() * s, s * (0.75 + rand() * 0.25), 4 + rand() * 6, 'rgba(70,15,12,0.6)');
    // Rips.
    g.fillStyle = 'rgba(10,10,12,0.8)';
    for (let i = 0; i < 5; i++) g.fillRect(Math.round(rand() * s), Math.round(s * 0.4 + rand() * s * 0.6), 1, 3 + Math.round(rand() * 8));
    speckle(g, s, rand, 400, 0.2);
  });
}

// Dark, old furniture wood: vertical grain, scuffs.
export function woodTexture() {
  const rand = mulberry32(71);
  return canvasTexture(32, (g, s) => {
    g.fillStyle = '#3a2a1e';
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x++) {
      g.fillStyle = `rgba(0,0,0,${0.08 + rand() * 0.18})`;
      if (rand() < 0.5) g.fillRect(x, 0, 1, s);
    }
    stain(g, rand() * s, rand() * s, 8, 'rgba(15,8,4,0.5)');
    speckle(g, s, rand, 120, 0.15);
  });
}

// A threadbare rug: faded red field, border, a dark stain soaked into it.
export function rugTexture() {
  const rand = mulberry32(211);
  return canvasTexture(64, (g, s) => {
    g.fillStyle = '#4a1c18';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#7a5a2c';
    g.lineWidth = 3;
    g.strokeRect(4, 4, s - 8, s - 8);
    g.strokeStyle = 'rgba(122,90,44,0.6)';
    g.lineWidth = 1;
    g.strokeRect(9, 9, s - 18, s - 18);
    // Diamond pattern in the middle.
    g.fillStyle = 'rgba(120,84,40,0.5)';
    g.beginPath();
    g.moveTo(s / 2, 16);
    g.lineTo(s - 16, s / 2);
    g.lineTo(s / 2, s - 16);
    g.lineTo(16, s / 2);
    g.fill();
    stain(g, s * 0.62, s * 0.4, 14, 'rgba(15,5,5,0.7)');
    // Worn bare patches.
    for (let i = 0; i < 6; i++) stain(g, rand() * s, rand() * s, 6, 'rgba(90,80,70,0.25)');
    speckle(g, s, rand, 500, 0.2);
  });
}

// Old blood soaked into the floor: an uneven dark pool with drag marks. Transparent.
export function bloodTexture() {
  const rand = mulberry32(307);
  return canvasTexture(64, (g, s) => {
    g.clearRect(0, 0, s, s);
    for (let i = 0; i < 9; i++) stain(g, s * (0.3 + rand() * 0.3), s * (0.3 + rand() * 0.3), 8 + rand() * 12, 'rgba(45,6,6,0.85)');
    // Drag marks: as if someone was pulled away.
    g.fillStyle = 'rgba(40,5,5,0.6)';
    for (let k = 0; k < 4; k++) {
      let x = s * 0.5 + (k - 1.5) * 4;
      for (let y = s * 0.55; y < s - 2; y++) {
        x += (rand() - 0.5) * 1.2;
        if (rand() < 0.85) g.fillRect(Math.round(x), Math.round(y), 2, 1);
      }
    }
  });
}

// A faded portrait of a couple; someone has scratched out both their eyes.
export function portraitTexture(seed = 1) {
  const rand = mulberry32(400 + seed);
  return canvasTexture(64, (g, s) => {
    const bg = g.createLinearGradient(0, 0, 0, s);
    bg.addColorStop(0, '#3a3424');
    bg.addColorStop(1, '#1e1a12');
    g.fillStyle = bg;
    g.fillRect(0, 0, s, s);
    for (const cx of [s * 0.35, s * 0.66]) {
      // Shoulders and head.
      g.fillStyle = '#16120c';
      g.beginPath();
      g.ellipse(cx, s * 0.95, 13, 20, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#9a8c70';
      g.beginPath();
      g.ellipse(cx, s * 0.45, 8, 10, 0, 0, Math.PI * 2);
      g.fill();
      // Eyes gouged out with something sharp.
      g.strokeStyle = 'rgba(230,220,200,0.85)';
      for (const ex of [cx - 3, cx + 3]) {
        g.beginPath();
        for (let i = 0; i < 4; i++) {
          g.moveTo(ex - 2 + rand() * 1, s * 0.42 - 2 + rand());
          g.lineTo(ex + 2 - rand() * 1, s * 0.44 + 2 - rand());
        }
        g.stroke();
      }
    }
    speckle(g, s, rand, 400, 0.2);
    stain(g, s * rand(), s * 0.2, 12, 'rgba(20,15,5,0.5)');
  });
}

// Grandfather clock face: yellowed dial, numerals as ticks, hands stopped at 3:33.
export function clockFaceTexture() {
  return canvasTexture(32, (g, s) => {
    g.fillStyle = '#1a1208';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#c8bb92';
    g.beginPath();
    g.arc(s / 2, s / 2, s * 0.44, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2a2014';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillRect(Math.round(s / 2 + Math.sin(a) * s * 0.36), Math.round(s / 2 - Math.cos(a) * s * 0.36), 1, 1);
    }
    g.strokeStyle = '#120c06';
    g.lineWidth = 1;
    for (const [a, len] of [
      [((3 + 33 / 60) / 12) * Math.PI * 2, 0.22],
      [(33 / 60) * Math.PI * 2, 0.34],
    ]) {
      g.beginPath();
      g.moveTo(s / 2, s / 2);
      g.lineTo(s / 2 + Math.sin(a) * s * len, s / 2 - Math.cos(a) * s * len);
      g.stroke();
    }
  });
}

// A mirror gone dark with age: tarnished silver, black spots where the backing has
// rotted, and one crack spidering out from a point near the middle.
export function mirrorTexture() {
  const rand = mulberry32(881);
  return canvasTexture(128, (g, s) => {
    const silver = g.createLinearGradient(0, 0, s, s);
    silver.addColorStop(0, '#5d625f');
    silver.addColorStop(0.5, '#2c302f');
    silver.addColorStop(1, '#4a4e4b');
    g.fillStyle = silver;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 25; i++) stain(g, rand() * s, rand() * s, 2 + rand() * 9, 'rgba(8,8,8,0.7)');
    for (let i = 0; i < 6; i++) stain(g, rand() * s, s - rand() * 10, 10 + rand() * 14, 'rgba(10,10,10,0.6)');
    const cx = s * 0.45;
    const cy = s * 0.4;
    g.strokeStyle = 'rgba(220,225,220,0.75)';
    g.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      let x = cx;
      let y = cy;
      const a = (i / 9) * Math.PI * 2 + rand() * 0.4;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += Math.cos(a + (rand() - 0.5) * 0.8) * (6 + rand() * 10);
        y += Math.sin(a + (rand() - 0.5) * 0.8) * (6 + rand() * 10);
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.strokeStyle = 'rgba(200,205,200,0.4)';
    for (let r = 6; r < 30; r += 9) {
      g.beginPath();
      g.arc(cx, cy, r + rand() * 3, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

// An old cobweb, thick with dust. Transparent around the threads.
export function cobwebTexture() {
  const rand = mulberry32(457);
  return canvasTexture(128, (g, s) => {
    g.clearRect(0, 0, s, s);
    g.strokeStyle = 'rgba(210,210,200,0.55)';
    g.lineWidth = 1;
    const spokes = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * (Math.PI / 2) + (rand() - 0.5) * 0.1;
      spokes.push(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * s * 1.1, Math.sin(a) * s * 1.1);
      g.stroke();
    }
    for (let r = 10; r < s; r += 9 + rand() * 6) {
      g.beginPath();
      spokes.forEach((a, i) => {
        const rr = r * (0.92 + rand() * 0.16);
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) g.moveTo(x, y);
        else g.quadraticCurveTo(Math.cos(a - 0.1) * rr * 0.9, Math.sin(a - 0.1) * rr * 0.9, x, y);
      });
      g.stroke();
    }
    // Torn strands hanging loose.
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      const x = rand() * s;
      g.moveTo(x, rand() * s * 0.5);
      g.lineTo(x + (rand() - 0.5) * 10, s);
      g.stroke();
    }
  });
}

// A porcelain doll's face: chipped white, rosy cheeks gone grey, glass eyes, a crack
// running down from one eye.
export function dollFaceTexture() {
  const rand = mulberry32(229);
  return canvasTexture(64, (g, s) => {
    g.fillStyle = '#d9d4c8';
    g.fillRect(0, 0, s, s);
    stain(g, s * 0.3, s * 0.62, 7, 'rgba(150,90,90,0.35)');
    stain(g, s * 0.7, s * 0.62, 7, 'rgba(150,90,90,0.35)');
    for (const ex of [s * 0.34, s * 0.66]) {
      g.fillStyle = '#e8e6de';
      g.beginPath();
      g.ellipse(ex, s * 0.45, 6, 5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#2a3a4a';
      g.beginPath();
      g.arc(ex, s * 0.45, 3.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#000';
      g.fillRect(Math.round(ex) - 1, Math.round(s * 0.45) - 1, 2, 2);
    }
    g.fillStyle = '#6a2020';
    g.fillRect(s * 0.45, s * 0.74, s * 0.1, 2);
    g.strokeStyle = 'rgba(40,30,30,0.9)';
    g.beginPath();
    let x = s * 0.66;
    let y = s * 0.5;
    g.moveTo(x, y);
    for (let i = 0; i < 6; i++) g.lineTo((x += (rand() - 0.3) * 4), (y += 3 + rand() * 3));
    g.stroke();
    // A chip missing from the cheek.
    g.fillStyle = '#7a7268';
    g.beginPath();
    g.moveTo(s * 0.12, s * 0.7);
    g.lineTo(s * 0.24, s * 0.66);
    g.lineTo(s * 0.2, s * 0.8);
    g.fill();
    speckle(g, s, rand, 150, 0.15);
  });
}
