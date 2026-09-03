import type { PhotoRepository } from '@/data/repositories';
import { deletePhotoFiles, ingestPhoto } from '@/lib/images';

/**
 * The mock photo repository is just the shared on-device image pipeline
 * (`src/lib/images.ts`). Photo bytes are stored identically whether the entry
 * index lives in the mock or in SQLite, so this is a thin wrapper.
 */
export const mockPhotoRepository: PhotoRepository = {
  ingest: ingestPhoto,
  deleteFiles: deletePhotoFiles,
};

export { clearAllPhotos, copyBundledPhoto } from '@/lib/images';
