/**
 * Wipes Forage's local data on the booted iOS Simulator by uninstalling the app.
 * The next `npm run ios` reinstalls it and the seed data is rebuilt on first launch.
 *
 * For a running app you can also use Settings -> Developer -> "Reset to sample data".
 */
import { execSync } from 'node:child_process';

const BUNDLE_ID = 'com.forage.app';

try {
  execSync(`xcrun simctl uninstall booted ${BUNDLE_ID}`, { stdio: 'inherit' });
  console.log(`\nRemoved ${BUNDLE_ID} from the booted simulator.`);
  console.log('Run `npm run ios` to reinstall with fresh sample data.');
} catch {
  console.error(
    '\nCould not uninstall. Is a simulator booted? Try opening it first, or use\n' +
      'Settings -> Developer -> "Reset to sample data" inside the app.',
  );
  process.exit(1);
}
