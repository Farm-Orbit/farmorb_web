import {
    BoundaryPolygon,
    fromLatLngs,
    hectaresToAcres,
    isBoundaryPolygon,
    polygonCentre,
    polygonHectares,
    toLatLngs,
} from '../geo';

/** A square of `side` degrees with its south-west corner at (lat, lng). */
const square = (lat: number, lng: number, side: number): BoundaryPolygon => ({
    type: 'Polygon',
    coordinates: [
        [
            [lng, lat],
            [lng + side, lat],
            [lng + side, lat + side],
            [lng, lat + side],
            [lng, lat],
        ],
    ],
});

describe('polygonHectares', () => {
    it('measures a one-degree square at the equator', () => {
        // A degree is ~111.3 km each way there, so ~12,300 km² ≈ 1.23M ha.
        const hectares = polygonHectares(square(0, 0, 1))!;
        expect(hectares).toBeGreaterThan(1_200_000);
        expect(hectares).toBeLessThan(1_260_000);
    });

    it('measures a small block to a believable size', () => {
        // 0.002° is roughly 222 m, so about 4.9 ha.
        const hectares = polygonHectares(square(5.6, -0.2, 0.002))!;
        expect(hectares).toBeGreaterThan(4.7);
        expect(hectares).toBeLessThan(5.1);
    });

    it('reports less area for the same shape nearer the pole', () => {
        // The whole reason for using spherical excess rather than treating
        // degrees as a flat grid: a planar calculation would call these equal.
        const atEquator = polygonHectares(square(0, 0, 0.01))!;
        const atSixty = polygonHectares(square(60, 0, 0.01))!;
        expect(atSixty).toBeLessThan(atEquator * 0.55);
        expect(atSixty).toBeGreaterThan(atEquator * 0.45);
    });

    it('is unchanged by winding direction', () => {
        const clockwise = square(5, 0, 0.01);
        const anticlockwise: BoundaryPolygon = {
            type: 'Polygon',
            coordinates: [[...clockwise.coordinates[0]].reverse()],
        };
        expect(polygonHectares(anticlockwise)).toBeCloseTo(polygonHectares(clockwise)!, 6);
    });

    it('returns null rather than zero for a shape with no area', () => {
        expect(polygonHectares(null)).toBeNull();
        expect(polygonHectares({ type: 'Polygon', coordinates: [[[0, 0], [1, 1]]] })).toBeNull();
    });
});

describe('coordinate order', () => {
    it('round-trips between Leaflet and GeoJSON', () => {
        const latLngs: [number, number][] = [
            [5.6, -0.2],
            [5.6, -0.19],
            [5.61, -0.19],
        ];
        const polygon = fromLatLngs(latLngs)!;

        // GeoJSON is [lng, lat] — the opposite of how Leaflet and people say it.
        expect(polygon.coordinates[0][0]).toEqual([-0.2, 5.6]);
        expect(toLatLngs(polygon).slice(0, 3)).toEqual(latLngs);
    });

    it('closes the ring', () => {
        const ring = fromLatLngs([
            [5.6, -0.2],
            [5.6, -0.19],
            [5.61, -0.19],
        ])!.coordinates[0];
        expect(ring[0]).toEqual(ring[ring.length - 1]);
    });

    it('refuses fewer than three points', () => {
        expect(fromLatLngs([[5.6, -0.2], [5.6, -0.19]])).toBeNull();
    });
});

describe('polygonCentre', () => {
    it('finds the middle of a square', () => {
        const [lng, lat] = polygonCentre(square(0, 0, 2))!;
        expect(lat).toBeCloseTo(0.8, 5);
        expect(lng).toBeCloseTo(0.8, 5);
    });
});

describe('isBoundaryPolygon', () => {
    it('accepts a polygon and rejects anything else', () => {
        expect(isBoundaryPolygon(square(0, 0, 1))).toBe(true);
        expect(isBoundaryPolygon(null)).toBe(false);
        expect(isBoundaryPolygon({ type: 'Point', coordinates: [0, 0] })).toBe(false);
        expect(isBoundaryPolygon('not json')).toBe(false);
    });
});

describe('hectaresToAcres', () => {
    it('converts', () => {
        expect(hectaresToAcres(1)).toBeCloseTo(2.4710538, 6);
        expect(hectaresToAcres(4)).toBeCloseTo(9.8842152, 6);
    });
});
