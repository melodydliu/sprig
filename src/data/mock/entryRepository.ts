import { uid } from '@/lib/id';
import type {
  EntryQuery,
  EntryRepository,
  PhotoInput,
} from '@/data/repositories';
import { runQuery } from '@/features/filters/query';
import type { Entry, EntryDraft, Photo } from '@/types/entry';

import { mockPhotoRepository, clearAllPhotos } from './photoRepository';
import { buildSeedEntries, MOCK_USER_ID } from './seed';
import {
  clearMockStorage,
  hasSeeded,
  loadEntries,
  markSeeded,
  persistEntries,
} from './storage';

/** Simulated latency so loading states are visible during UI testing. */
const LATENCY_MS = 220;
const delay = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

class MockEntryRepository implements EntryRepository {
  private entries: Entry[] = [];
  private ready: Promise<void> | null = null;

  private async ensureLoaded(): Promise<void> {
    if (!this.ready) {
      this.ready = this.hydrate();
    }
    return this.ready;
  }

  private async hydrate(): Promise<void> {
    const stored = await loadEntries();
    if (stored && stored.length > 0) {
      this.entries = stored;
      return;
    }
    if (await hasSeeded()) {
      // User deleted everything on purpose — respect that.
      this.entries = stored ?? [];
      return;
    }
    this.entries = await buildSeedEntries();
    await markSeeded();
    await persistEntries(this.entries, true);
  }

  private touch(entry: Entry): Entry {
    entry.updatedAt = new Date().toISOString();
    entry.syncStatus = 'pending';
    return entry;
  }

  private save(immediate = false) {
    return persistEntries(this.entries, immediate);
  }

  async list(query?: EntryQuery): Promise<Entry[]> {
    await this.ensureLoaded();
    await delay();
    return runQuery(this.entries, query).map(clone);
  }

  async get(id: string): Promise<Entry | null> {
    await this.ensureLoaded();
    const found = this.entries.find((e) => e.id === id && !e.deletedAt);
    return found ? clone(found) : null;
  }

  async create(draft: EntryDraft, photoInputs: PhotoInput[]): Promise<Entry> {
    await this.ensureLoaded();
    const id = uid('en_');
    const now = new Date().toISOString();
    const photos = await this.ingestAll(id, photoInputs, 0);
    const entry: Entry = {
      id,
      userId: MOCK_USER_ID,
      name: draft.name?.trim() ? draft.name.trim() : null,
      category: draft.category,
      colors: draft.colors,
      notes: draft.notes,
      photos,
      location: draft.location,
      locationSource: draft.locationSource,
      locationLabel: draft.locationLabel,
      sightedAt: draft.sightedAt,
      tags: draft.tags,
      isFavorite: draft.isFavorite,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    this.entries.unshift(entry);
    await this.save(true);
    return clone(entry);
  }

  async update(id: string, patch: Partial<EntryDraft>): Promise<Entry> {
    const entry = this.require(id);
    if (patch.name !== undefined) entry.name = patch.name?.trim() ? patch.name.trim() : null;
    if (patch.category !== undefined) entry.category = patch.category;
    if (patch.colors !== undefined) entry.colors = patch.colors;
    if (patch.notes !== undefined) entry.notes = patch.notes;
    if (patch.location !== undefined) entry.location = patch.location;
    if (patch.locationSource !== undefined) entry.locationSource = patch.locationSource;
    if (patch.locationLabel !== undefined) entry.locationLabel = patch.locationLabel;
    if (patch.sightedAt !== undefined) entry.sightedAt = patch.sightedAt;
    if (patch.tags !== undefined) entry.tags = patch.tags;
    if (patch.isFavorite !== undefined) entry.isFavorite = patch.isFavorite;
    this.touch(entry);
    await this.save(true);
    return clone(entry);
  }

  async remove(id: string): Promise<void> {
    const entry = this.require(id);
    entry.deletedAt = new Date().toISOString();
    this.touch(entry);
    await this.save(true);
  }

  async setFavorite(id: string, value: boolean): Promise<Entry> {
    const entry = this.require(id);
    entry.isFavorite = value;
    this.touch(entry);
    await this.save();
    return clone(entry);
  }

  async addPhotos(id: string, photoInputs: PhotoInput[]): Promise<Entry> {
    const entry = this.require(id);
    const next = await this.ingestAll(id, photoInputs, entry.photos.length);
    entry.photos = [...entry.photos, ...next];
    this.touch(entry);
    await this.save(true);
    return clone(entry);
  }

  async removePhoto(entryId: string, photoId: string): Promise<Entry> {
    const entry = this.require(entryId);
    const target = entry.photos.find((p) => p.id === photoId);
    if (target) {
      await mockPhotoRepository.deleteFiles(target.localUri, target.thumbnailUri);
    }
    entry.photos = entry.photos
      .filter((p) => p.id !== photoId)
      .map((p, i) => ({ ...p, sortOrder: i }));
    this.touch(entry);
    await this.save(true);
    return clone(entry);
  }

  async reorderPhotos(entryId: string, order: string[]): Promise<Entry> {
    const entry = this.require(entryId);
    const byId = new Map(entry.photos.map((p) => [p.id, p]));
    entry.photos = order
      .map((pid, i) => {
        const p = byId.get(pid);
        return p ? { ...p, sortOrder: i } : null;
      })
      .filter((p): p is Photo => p != null);
    this.touch(entry);
    await this.save(true);
    return clone(entry);
  }

  async sync(): Promise<void> {
    await this.ensureLoaded();
    await delay(600);
    // Mock: pretend everything reached the cloud.
    for (const e of this.entries) e.syncStatus = 'synced';
    await this.save(true);
  }

  async resetToSampleData(): Promise<void> {
    clearAllPhotos();
    await clearMockStorage();
    this.entries = await buildSeedEntries();
    await markSeeded();
    await persistEntries(this.entries, true);
  }

  private require(id: string): Entry {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) throw new Error(`Entry ${id} not found`);
    return entry;
  }

  private async ingestAll(
    entryId: string,
    inputs: PhotoInput[],
    startOrder: number,
  ): Promise<Photo[]> {
    const out: Photo[] = [];
    for (let i = 0; i < inputs.length; i += 1) {
      const sortOrder = startOrder + i;
      const ingested = await mockPhotoRepository.ingest(entryId, inputs[i], sortOrder);
      out.push({
        id: ingested.id,
        entryId,
        localUri: ingested.localUri,
        remoteUrl: null,
        thumbnailUri: ingested.thumbnailUri,
        width: ingested.width,
        height: ingested.height,
        takenAt: ingested.takenAt,
        sortOrder,
      });
    }
    return out;
  }
}

function clone(entry: Entry): Entry {
  return {
    ...entry,
    colors: [...entry.colors],
    tags: [...entry.tags],
    photos: entry.photos.map((p) => ({ ...p })),
    location: entry.location ? { ...entry.location } : null,
  };
}

export const mockEntryRepository = new MockEntryRepository();
