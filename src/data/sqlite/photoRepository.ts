import type { PhotoRepository } from '@/data/repositories';
import { deletePhotoFiles, ingestPhoto } from '@/lib/images';

/**
 * Photo bytes live as files on disk (`src/lib/images.ts`) regardless of where
 * the entry index is stored, so this is the same thin wrapper as the mock's.
 * Only `entryRepository` differs between the mock and SQLite layers.
 */
export const sqlitePhotoRepository: PhotoRepository = {
  ingest: ingestPhoto,
  deleteFiles: deletePhotoFiles,
};
