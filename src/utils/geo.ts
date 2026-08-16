/**
 * Geometry for farm boundaries.
 *
 * Boundaries are stored in `grow_locations.boundary_coordinates` as GeoJSON,
 * which is [longitude, latitude] — the opposite order to how Leaflet and most
 * people say it. Everything crossing that line goes through here so the swap
 * happens in exactly one place.
 */

/** WGS84 equatorial radius, metres. */
const EARTH_RADIUS = 6378137;

export type Position = [number, number]; // [lng, lat]

export interface BoundaryPolygon {
    type: 'Polygon';
    /** First ring is the outer boundary; holes are not used here. */
    coordinates: Position[][];
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Geodesic area of a ring in square metres.
 *
 * Uses the spherical-excess approximation rather than treating degrees as a
 * flat grid: at Ghana's latitude a degree of longitude is about 110 km and a
 * degree of latitude about 111 km, but that divergence grows with latitude and
 * a planar calculation would quietly under-report area for anyone far from the
 * equator.
 */
export function ringAreaSquareMetres(ring: Position[]): number {
    if (ring.length < 3) return 0;

    let total = 0;
    for (let i = 0; i < ring.length; i++) {
        const [lng1, lat1] = ring[i];
        const [lng2, lat2] = ring[(i + 1) % ring.length];
        total +=
            toRadians(lng2 - lng1) *
            (2 + Math.sin(toRadians(lat1)) + Math.sin(toRadians(lat2)));
    }

    return Math.abs((total * EARTH_RADIUS * EARTH_RADIUS) / 2);
}

export function polygonHectares(polygon: BoundaryPolygon | null | undefined): number | null {
    const ring = polygon?.coordinates?.[0];
    if (!ring || ring.length < 3) return null;
    return Number((ringAreaSquareMetres(ring) / 10_000).toFixed(4));
}

/** Exact: rounding belongs where the number is displayed, not converted. */
export const hectaresToAcres = (hectares: number) => hectares * 2.4710538;

/** Average position, used to place a label or centre the map on a block. */
export function polygonCentre(polygon: BoundaryPolygon | null | undefined): Position | null {
    const ring = polygon?.coordinates?.[0];
    if (!ring || ring.length === 0) return null;

    const sum = ring.reduce<[number, number]>(
        (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
        [0, 0]
    );
    return [sum[0] / ring.length, sum[1] / ring.length];
}

/** GeoJSON [lng, lat] → Leaflet [lat, lng]. */
export const toLatLngs = (polygon: BoundaryPolygon): [number, number][] =>
    (polygon.coordinates[0] ?? []).map(([lng, lat]) => [lat, lng]);

/** Leaflet [lat, lng] → a closed GeoJSON polygon. */
export function fromLatLngs(latLngs: [number, number][]): BoundaryPolygon | null {
    if (latLngs.length < 3) return null;

    const ring: Position[] = latLngs.map(([lat, lng]) => [lng, lat]);
    // GeoJSON requires the ring to close on itself.
    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];
    if (firstLng !== lastLng || firstLat !== lastLat) {
        ring.push([firstLng, firstLat]);
    }

    return { type: 'Polygon', coordinates: [ring] };
}

export function isBoundaryPolygon(value: unknown): value is BoundaryPolygon {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as BoundaryPolygon;
    return (
        candidate.type === 'Polygon' &&
        Array.isArray(candidate.coordinates) &&
        Array.isArray(candidate.coordinates[0])
    );
}
