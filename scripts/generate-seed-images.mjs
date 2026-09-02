/**
 * Generates on-brand botanical placeholder photos for the seed data.
 * Deterministic: re-running produces identical files.
 *
 *   node scripts/generate-seed-images.mjs
 *
 * Output: assets/seed/*.jpg  (also used to seed the iOS Simulator photo library)
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'seed');
mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 1500;

// Simple seeded PRNG (mulberry32) for deterministic output.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GROUNDS = [
  ['#F4EAD8', '#E7D3B3'],
  ['#EFE0C9', '#D8BE97'],
  ['#F1E7D6', '#DCC9A6'],
  ['#EDE4CE', '#CFC09B'],
];

const PALETTES = {
  flower: ['#C86B8A', '#D98AA6', '#E6A9BE', '#9E5273'],
  foliage: ['#4F7A4C', '#6B9A5E', '#3C6B46', '#87AE6E'],
  fruit: ['#B5532E', '#C86B3E', '#8F3B22', '#D98A4E'],
  branch: ['#8A6A4A', '#A6875F', '#6E5236', '#B89A72'],
  pod: ['#B0893E', '#C9A75E', '#8F6E2E', '#D9C084'],
  other: ['#6E7B8B', '#8A97A6', '#586573', '#A7B2BE'],
};

function petals(cx, cy, r, n, color, rot, rand) {
  let p = '';
  for (let i = 0; i < n; i += 1) {
    const a = rot + (i / n) * Math.PI * 2;
    const px = cx + Math.cos(a) * r * 0.55;
    const py = cy + Math.sin(a) * r * 0.55;
    const rx = r * (0.42 + rand() * 0.1);
    const ry = r * (0.22 + rand() * 0.08);
    const deg = (a * 180) / Math.PI;
    p += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${color}" opacity="0.92" transform="rotate(${deg.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})"/>`;
  }
  return p;
}

function leaf(cx, cy, len, wide, color, deg) {
  return `<g transform="rotate(${deg} ${cx} ${cy})"><path d="M ${cx} ${cy} C ${cx - wide} ${cy - len * 0.4}, ${cx - wide * 0.3} ${cy - len}, ${cx} ${cy - len} C ${cx + wide * 0.3} ${cy - len}, ${cx + wide} ${cy - len * 0.4}, ${cx} ${cy} Z" fill="${color}" opacity="0.9"/><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - len}" stroke="rgba(255,255,255,0.25)" stroke-width="3"/></g>`;
}

function berries(cx, cy, color, rand) {
  let p = `<line x1="${cx}" y1="${cy + 260}" x2="${cx}" y2="${cy - 120}" stroke="#6E5236" stroke-width="10" stroke-linecap="round"/>`;
  const n = 6 + Math.floor(rand() * 4);
  for (let i = 0; i < n; i += 1) {
    const bx = cx + (rand() - 0.5) * 260;
    const by = cy + (rand() - 0.5) * 320;
    const r = 34 + rand() * 26;
    p += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="0.92"/><circle cx="${(bx - r * 0.3).toFixed(1)}" cy="${(by - r * 0.3).toFixed(1)}" r="${(r * 0.28).toFixed(1)}" fill="rgba(255,255,255,0.35)"/>`;
  }
  return p;
}

function pods(cx, cy, color, rand) {
  let p = '';
  const n = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i += 1) {
    const px = cx + (i - (n - 1) / 2) * 150 + (rand() - 0.5) * 40;
    const py = cy + (rand() - 0.5) * 120;
    const h = 320 + rand() * 160;
    p += `<line x1="${px}" y1="${py + h / 2}" x2="${px}" y2="${py - h / 2}" stroke="#6E5236" stroke-width="9"/><ellipse cx="${px}" cy="${py}" rx="52" ry="${(h / 2).toFixed(0)}" fill="${color}" opacity="0.9"/>`;
    for (let s = 0; s < 5; s += 1) {
      p += `<circle cx="${px}" cy="${(py - h / 2 + 40 + s * (h / 6)).toFixed(1)}" r="14" fill="rgba(255,255,255,0.3)"/>`;
    }
  }
  return p;
}

function branchArt(cx, cy, color, rand) {
  let p = `<line x1="${cx - 380}" y1="${cy + 380}" x2="${cx + 360}" y2="${cy - 380}" stroke="${color}" stroke-width="26" stroke-linecap="round"/>`;
  for (let i = 0; i < 5; i += 1) {
    const t = 0.15 + i * 0.16;
    const bx = cx - 380 + t * 740;
    const by = cy + 380 - t * 760;
    const deg = i % 2 ? 40 : -40;
    p += leaf(bx, by, 150 + rand() * 60, 70, PALETTES.foliage[i % 4], deg + (rand() - 0.5) * 20);
  }
  return p;
}

function abstractSprig(cx, cy, color, rand) {
  let p = '';
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2 + rand();
    const bx = cx + Math.cos(a) * (120 + rand() * 220);
    const by = cy + Math.sin(a) * (120 + rand() * 220);
    p += `<line x1="${cx}" y1="${cy}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${color}" stroke-width="12" stroke-linecap="round" opacity="0.8"/><circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(18 + rand() * 20).toFixed(1)}" fill="${color}" opacity="0.85"/>`;
  }
  return p;
}

function buildSvg(kind, variant) {
  const rand = rng(hash(`${kind}-${variant}`));
  const ground = GROUNDS[variant % GROUNDS.length];
  const palette = PALETTES[kind];
  const cx = W / 2 + (rand() - 0.5) * 120;
  const cy = H / 2 + (rand() - 0.5) * 160;

  let motif = '';
  if (kind === 'flower') {
    motif += petals(cx, cy, 360, 8, palette[0], rand() * 6, rand);
    motif += petals(cx, cy, 250, 6, palette[1], rand() * 6, rand);
    motif += `<circle cx="${cx}" cy="${cy}" r="70" fill="${palette[3]}"/>`;
    motif += leaf(cx - 40, cy + 340, 260, 110, PALETTES.foliage[1], -25);
    motif += leaf(cx + 60, cy + 360, 220, 100, PALETTES.foliage[2], 30);
  } else if (kind === 'foliage') {
    for (let i = 0; i < 7; i += 1) {
      motif += leaf(
        cx + (rand() - 0.5) * 260,
        cy + (rand() - 0.5) * 260,
        260 + rand() * 160,
        110 + rand() * 40,
        palette[i % 4],
        (rand() - 0.5) * 320,
      );
    }
  } else if (kind === 'fruit') {
    motif += berries(cx, cy, palette[0], rand);
    motif += leaf(cx - 120, cy + 180, 200, 90, PALETTES.foliage[0], -35);
  } else if (kind === 'branch') {
    motif += branchArt(cx, cy, palette[0], rand);
  } else if (kind === 'pod') {
    motif += pods(cx, cy, palette[0], rand);
  } else {
    motif += abstractSprig(cx, cy, palette[0], rand);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="42%" cy="38%" r="85%">
      <stop offset="0%" stop-color="${ground[0]}"/>
      <stop offset="100%" stop-color="${ground[1]}"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g filter="url(#soft)" opacity="0.35">${motif}</g>
  <g>${motif}</g>
  <rect width="${W}" height="${H}" fill="none" stroke="rgba(110,82,54,0.12)" stroke-width="40"/>
</svg>`;
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FILES = [
  ['flower', 1],
  ['flower', 2],
  ['flower', 3],
  ['foliage', 1],
  ['foliage', 2],
  ['foliage', 3],
  ['fruit', 1],
  ['fruit', 2],
  ['fruit', 3],
  ['branch', 1],
  ['branch', 2],
  ['pod', 1],
  ['pod', 2],
  ['other', 1],
  ['other', 2],
];

const NAME = { flower: 'flower', foliage: 'foliage', fruit: 'fruit', branch: 'branch', pod: 'pod', other: 'other' };

for (const [kind, variant] of FILES) {
  const svg = buildSvg(kind, variant);
  const file = join(OUT, `${NAME[kind]}-${variant}.jpg`);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(file);
  console.log('wrote', file);
}
console.log(`\n${FILES.length} seed images written to assets/seed/ (${W}x${H})`);
