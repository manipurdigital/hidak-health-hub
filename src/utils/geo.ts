// Geo utility functions for geofencing

export function latLngsToGeoJSONPolygon(path: Array<{ lat: number; lng: number }>) {
  if (!path?.length) throw new Error('Empty polygon');
  const ring = path.map(p => [p.lng, p.lat]);
  // close the ring
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0]);
  }
  return { type: 'Polygon', coordinates: [ring] } as const;
}

export const normalizeService = (s: string) =>
  s.toLowerCase().includes('lab') ? 'lab_collection' : 'delivery';