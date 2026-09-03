import { Directory, File, Paths } from 'expo-file-system';
import { Platform, Share } from 'react-native';

import { entryRepository } from '@/data';

/**
 * Exports all entries as a JSON file and opens the share sheet.
 * Photos stay on device; each photo keeps its local URI in the JSON.
 * (A full photos-zip export is a v2 nice-to-have.)
 */
export async function exportAllData(): Promise<{ ok: boolean; count: number }> {
  const entries = await entryRepository.list();
  const payload = {
    app: 'Sprig',
    version: 1,
    exportedAt: new Date().toISOString(),
    entryCount: entries.length,
    entries,
  };

  const dir = new Directory(Paths.document, 'exports');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, `sprig-export-${Date.now()}.json`);
  if (file.exists) file.delete();
  file.write(JSON.stringify(payload, null, 2));

  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { url: file.uri }
        : { message: `Sprig export (${entries.length} finds)`, url: file.uri },
    );
    return { ok: true, count: entries.length };
  } catch {
    return { ok: false, count: entries.length };
  }
}
