/**
 * Generates Sprig's app + splash icons from the `Sprig` glyph in
 * `src/components/Wordmark.tsx`. Run: `node scripts/generate-app-icon.mjs`
 *
 * - assets/images/icon.png             1024×1024, opaque (App Store: no alpha)
 * - assets/images/splash-icon.png      512×512, transparent (light splash bg)
 * - assets/images/splash-icon-dark.png 512×512, transparent (dark splash bg)
 */
import sharp from 'sharp';

const GREEN = '#356B4B';
const GREEN_LIGHT = '#6FA97F';
const CREAM = '#FAF6EE';

// The four glyph paths, viewBox 0 0 32 32 (from components/Wordmark.tsx).
const glyph = (color) => `
  <path d="M16 29V11" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M16 15c-1-4-4.5-6-8-6 0 4 3 7 8 7Z" fill="${color}"/>
  <path d="M16 12c1-4.5 4.5-7 8.5-7 0 4.5-3.5 8-8.5 8Z" fill="${color}" opacity="0.82"/>
  <path d="M16 20c-.8-3-3.4-4.6-6-4.6 0 3 2.2 5.2 6 5.2Z" fill="${color}" opacity="0.62"/>
`;

function svg({ size, bg, color, scale, dy }) {
  const g = 32 * scale;
  const x = (size - g) / 2;
  const y = (size - g) / 2 + dy;
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
      <g transform="translate(${x},${y}) scale(${scale})">${glyph(color)}</g>
    </svg>`,
  );
}

await sharp(svg({ size: 1024, bg: CREAM, color: GREEN, scale: 25, dy: -34 }))
  .png()
  .flatten({ background: CREAM })
  .toFile('assets/images/icon.png');

await sharp(svg({ size: 512, bg: null, color: GREEN, scale: 12, dy: -16 }))
  .png()
  .toFile('assets/images/splash-icon.png');

await sharp(svg({ size: 512, bg: null, color: GREEN_LIGHT, scale: 12, dy: -16 }))
  .png()
  .toFile('assets/images/splash-icon-dark.png');

for (const p of [
  'assets/images/icon.png',
  'assets/images/splash-icon.png',
  'assets/images/splash-icon-dark.png',
]) {
  const m = await sharp(p).metadata();
  console.log(p, `${m.width}×${m.height}`, 'alpha:', m.hasAlpha);
}
