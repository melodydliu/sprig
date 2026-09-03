import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import type { Entry } from '@/types/entry';

import { remoteToEntry, type RemoteEntryRow, type RemotePhotoRow } from './remoteMappers';

/** Supabase half of `SyncDeps`. */

const BUCKET = 'entry-photos';
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year — the on-disk file is the real fallback.

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

async function fileBytes(uri: string): Promise<ArrayBuffer> {
  return new File(uri).arrayBuffer();
}

export const remoteDeps = {
  async uploadPhoto(path: string, localUri: string): Promise<string> {
    const bytes = await fileBytes(localUri);
    const { error } = await client()
      .storage.from(BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;

    const { data, error: signErr } = await client()
      .storage.from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signErr) throw signErr;
    return data.signedUrl;
  },

  async upsertRemoteEntry(row: RemoteEntryRow): Promise<void> {
    const { error } = await client().from('entries').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  },

  async upsertRemotePhotos(rows: RemotePhotoRow[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await client().from('photos').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },

  async prunePhotos(entryId: string, keepIds: string[]): Promise<void> {
    let q = client().from('photos').delete().eq('entry_id', entryId);
    if (keepIds.length > 0) q = q.filter('id', 'not.in', `(${keepIds.join(',')})`);
    const { error } = await q;
    if (error) throw error;
  },

  async removeStorageObjects(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    try {
      await client().storage.from(BUCKET).remove(paths);
    } catch {
      // best effort — a missing object is fine
    }
  },

  async fetchRemoteChanges(userId: string, sinceIso: string): Promise<Entry[]> {
    const { data, error } = await client()
      .from('entries')
      .select('*, photos(*)')
      .eq('user_id', userId)
      .gt('updated_at', sinceIso)
      .order('updated_at', { ascending: true });
    if (error) throw error;

    const rows = (data ?? []) as (RemoteEntryRow & { photos: RemotePhotoRow[] | null })[];

    // One batch of signed URLs for every referenced object.
    const paths = rows.flatMap((r) =>
      (r.photos ?? []).map((p) => p.storage_path).filter((p): p is string => !!p),
    );
    const signed = new Map<string, string>();
    if (paths.length > 0) {
      const { data: sigs } = await client().storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
      for (const s of sigs ?? []) {
        if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
      }
    }

    return rows.map((r) =>
      remoteToEntry({
        ...r,
        photos: (r.photos ?? []).map((p) => ({
          ...p,
          remote_url: (p.storage_path && signed.get(p.storage_path)) || p.remote_url,
        })),
      }),
    );
  },
};
