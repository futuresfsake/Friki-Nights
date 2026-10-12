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

export function wallpaperTexture() {
  const rand = mulberry32(11);
  return canvasTexture(64, (g, s) => {
    g.fillStyle = '#4a4632';
    g.fillRect(0, 0, s, s);
    // Faded vertical stripes with a small diamond pattern between them.
    for (let x = 0; x < s; x += 8) {
      g.fillStyle = 'rgba(30,28,18,0.45)';
      g.fillRect(x, 0, 2, s);
      for (let y = 4; y < s * 0.7; y += 8) {
        g.fillStyle = 'rgba(120,110,70,0.35)';
        g.fillRect(x + 4, y, 2, 2);
      }
    }
    // Wooden wainscot along the bottom of the wall.
    g.fillStyle = '#2e2114';
    g.fillRect(0, s * 0.72, s, s * 0.28);
    g.fillStyle = '#1c140c';
    g.fillRect(0, s * 0.72, s, 2);
    for (let x = 0; x < s; x += 16) g.fillRect(x, s * 0.72, 1, s * 0.28);
    stain(g, rand() * s, rand() * s * 0.5, 14, 'rgba(40,30,10,0.55)');
    stain(g, rand() * s, s * 0.6, 10, 'rgba(20,15,5,0.5)');
    speckle(g, s, rand, 500, 0.12);
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
