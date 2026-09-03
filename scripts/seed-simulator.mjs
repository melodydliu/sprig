/**
 * Prepares the booted iOS Simulator for testing Sprig:
 *   - adds the botanical placeholder images to the simulator's photo library
 *     (so the "add from library" path has something to pick), and
 *   - sets a simulated GPS location to Huntington Beach, CA.
 *
 *   npm run seed-sim
 *
 * Change the live location any time from the Simulator menu:
 *   Features > Location > Custom Location…
 */
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED_DIR = join(ROOT, 'assets', 'seed');
const HB = { lat: 33.6595, lng: -117.9988 };

function sh(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

try {
  const files = readdirSync(SEED_DIR)
    .filter((f) => f.endsWith('.jpg'))
    .map((f) => `"${join(SEED_DIR, f)}"`);

  if (files.length === 0) {
    console.error('No seed images found. Run `npm run gen-seed-images` first.');
    process.exit(1);
  }

  sh(`xcrun simctl addmedia booted ${files.join(' ')}`);
  console.log(`Added ${files.length} placeholder photos to the simulator library.`);

  try {
    sh(`xcrun simctl location booted set ${HB.lat},${HB.lng}`);
    console.log(`Set simulated location to Huntington Beach (${HB.lat}, ${HB.lng}).`);
  } catch {
    console.log(
      'Could not set location via simctl (needs Xcode 15+). Set it manually:\n' +
        '  Simulator > Features > Location > Custom Location… ' +
        `${HB.lat}, ${HB.lng}`,
    );
  }
} catch (err) {
  console.error('\nIs a simulator booted? Open it (or run `npm run ios`) and try again.');
  process.exit(1);
}
