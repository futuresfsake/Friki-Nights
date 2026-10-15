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
    g.fillRect(0, 0, s, s * 0.14);
    for (let x = 0; x < s; x += 3) {
      const side = Math.abs(x - s / 2) / (s / 2);
      g.fillRect(x, 0, 3, Math.round(s * 0.14 + rand() * 6 + side * side * s * 0.5));
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
