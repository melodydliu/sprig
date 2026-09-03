import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { uid } from '@/lib/id';
import type { PhotoInput } from '@/data/repositories';

/**
 * On-device image pipeline shared by every data-layer implementation.
 *
 * Photo *bytes* always live as files in the FileSystem `photos/` directory —
 * only the index of which photo belongs to which entry moves between the mock
 * and SQLite layers. Captured images are downscaled (long edge <= 1600px) and
 * given a small thumbnail for lists/markers.
 */

export const MAX_LONG_EDGE = 1600;
export const THUMB_LONG_EDGE = 420;
const FULL_QUALITY = 0.8;
const THUMB_QUALITY = 0.7;

function photosDir(): Directory {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * Downscale `sourceUri` so its longer edge is at most `longEdge` (never upscales),
 * re-encode as JPEG, and move the result to `destName` in the photos directory.
 */
async function resizeToFile(
  sourceUri: string,
  srcW: number,
  srcH: number,
  longEdge: number,
  quality: number,
  destName: string,
): Promise<{ uri: string; width: number; height: number }> {
  const context = ImageManipulator.manipulate(sourceUri);
  const currentLong = Math.max(srcW || 0, srcH || 0);
  if (currentLong > longEdge && srcW && srcH) {
    if (srcW >= srcH) context.resize({ width: longEdge });
    else context.resize({ height: longEdge });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: quality, format: SaveFormat.JPEG });

  const dest = new File(photosDir(), destName);
  if (dest.exists) dest.delete();
  new File(saved.uri).move(dest);
  return { uri: dest.uri, width: saved.width, height: saved.height };
}

/**
 * Copies a source image into app storage, downscaling to a max long edge and
 * generating a thumbnail. Returns local URIs + dimensions.
 */
export async function ingestPhoto(
  entryId: string,
  input: PhotoInput,
  _sortOrder: number,
): Promise<{
  id: string;
  localUri: string;
  thumbnailUri: string;
  width: number;
  height: number;
  takenAt: string | null;
}> {
  const id = uid('ph_');
  const base = `${entryId}_${id}`;

  let full: { uri: string; width: number; height: number };
  try {
    full = await resizeToFile(
      input.uri,
      input.width,
      input.height,
      MAX_LONG_EDGE,
      FULL_QUALITY,
      `${base}.jpg`,
    );
  } catch {
    // Fall back to a straight copy if manipulation fails for any reason.
    const dest = new File(photosDir(), `${base}.jpg`);
    if (dest.exists) dest.delete();
    new File(input.uri).copy(dest);
    full = { uri: dest.uri, width: input.width, height: input.height };
  }

  let thumbUri = full.uri;
  try {
    const thumb = await resizeToFile(
      full.uri,
      full.width,
      full.height,
      THUMB_LONG_EDGE,
      THUMB_QUALITY,
      `${base}_thumb.jpg`,
    );
    thumbUri = thumb.uri;
  } catch {
    thumbUri = full.uri;
  }

  return {
    id,
    localUri: full.uri,
    thumbnailUri: thumbUri,
    width: full.width,
    height: full.height,
    takenAt: input.takenAt ?? null,
  };
}

/** Best-effort removal of the on-disk files for a photo. */
export async function deletePhotoFiles(localUri: string, thumbnailUri: string): Promise<void> {
  for (const uri of new Set([localUri, thumbnailUri])) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // best effort
    }
  }
}

/**
 * Seed helper: copies a bundled asset into the photos directory so seed entries
 * use the same storage shape as captured photos and survive app restarts.
 */
export async function copyBundledPhoto(
  assetModule: number,
  destBase: string,
): Promise<{ localUri: string; thumbnailUri: string }> {
  const asset = Asset.fromModule(assetModule);
  if (!asset.localUri) await asset.downloadAsync();
  const sourceUri = asset.localUri ?? asset.uri;

  const dest = new File(photosDir(), `${destBase}.jpg`);
  if (!dest.exists) {
    new File(sourceUri).copy(dest);
  }
  return { localUri: dest.uri, thumbnailUri: dest.uri };
}

/** Wipes the entire on-disk photos directory. Used by "reset to sample data". */
export function clearAllPhotos() {
  try {
    const dir = new Directory(Paths.document, 'photos');
    if (dir.exists) dir.delete();
  } catch {
    // best effort
  }
}
