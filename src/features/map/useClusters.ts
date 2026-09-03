import Supercluster from 'supercluster';
import { useMemo, useState } from 'react';
import type { Region } from 'react-native-maps';

import type { Entry } from '@/types/entry';

export interface ClusterPoint {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  /** Present only for leaves (count === 1). */
  entry?: Entry;
  /** Supercluster id, for expansion zoom. */
  clusterId?: number;
}

function regionToBBox(r: Region): [number, number, number, number] {
  return [
    r.longitude - r.longitudeDelta / 2,
    r.latitude - r.latitudeDelta / 2,
    r.longitude + r.longitudeDelta / 2,
    r.latitude + r.latitudeDelta / 2,
  ];
}

function regionToZoom(r: Region): number {
  return Math.round(Math.log2(360 / r.longitudeDelta));
}

/** Clusters entries for the current map region using supercluster (pure JS). */
export function useClusters(entries: Entry[], region: Region | null) {
  const index = useMemo(() => {
    const sc = new Supercluster<{ entryId: string }>({ radius: 55, maxZoom: 18 });
    sc.load(
      entries
        .filter((e) => e.location)
        .map((e) => ({
          type: 'Feature' as const,
          properties: { entryId: e.id },
          geometry: {
            type: 'Point' as const,
            coordinates: [e.location!.longitude, e.location!.latitude],
          },
        })),
    );
    return sc;
  }, [entries]);

  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  const clusters: ClusterPoint[] = useMemo(() => {
    if (!region) return [];
    const raw = index.getClusters(regionToBBox(region), regionToZoom(region));
    return raw.map((f): ClusterPoint => {
      const [longitude, latitude] = f.geometry.coordinates;
      const props = f.properties as Record<string, unknown>;
      if (props.cluster) {
        return {
          id: `c-${props.cluster_id}`,
          latitude,
          longitude,
          count: props.point_count as number,
          clusterId: props.cluster_id as number,
        };
      }
      const entryId = props.entryId as string;
      return { id: entryId, latitude, longitude, count: 1, entry: byId.get(entryId) };
    });
  }, [index, region, byId]);

  return { clusters, index };
}

export function useMapRegion(initial: Region | null) {
  return useState<Region | null>(initial);
}
