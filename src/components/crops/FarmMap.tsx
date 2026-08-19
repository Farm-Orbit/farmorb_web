"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, Polygon, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Button from '@/components/ui/button/Button';
import { GrowLocation, Planting } from '@/types/crop';
import {
  BoundaryPolygon,
  fromLatLngs,
  isBoundaryPolygon,
  polygonCentre,
  polygonHectares,
  toLatLngs,
} from '@/utils/geo';

interface Props {
  locations: GrowLocation[];
  /** Plantings, so a block can be coloured and labelled by what is in it. */
  plantings?: Planting[];
  /** Block ids currently selected — drives colour and, in picker mode, choice. */
  selectedIds?: string[];
  onToggle?: (locationId: string) => void;
  /** When set, the map is in drawing mode for that block. */
  drawingFor?: string | null;
  onDrawn?: (locationId: string, boundary: BoundaryPolygon | null, hectares: number | null) => void;
  onCancelDraw?: () => void;
  heightClass?: string;
}

const STATUS_COLOURS: Record<string, string> = {
  active: '#2F7D4F',
  preparing: '#9A6B12',
  fallow: '#6E7770',
  retired: '#9E3B2C',
};

/**
 * Blocks are coloured by the crop growing in them, so the map reads as a
 * planting plan rather than a set of outlines. Colours are assigned from the
 * crop name so the same crop keeps the same colour between visits.
 */
const CROP_PALETTE = ['#1F5D3A', '#2F6FA8', '#8A5A1B', '#7A3E8F', '#B2543A', '#3F7C74'];

function cropColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CROP_PALETTE[hash % CROP_PALETTE.length];
}

/** Accra, as a neutral starting view when nothing has been drawn yet. */
const FALLBACK_CENTRE: LatLngExpression = [5.6037, -0.187];

function DrawLayer({
  points,
  onAdd,
}: {
  points: [number, number][];
  onAdd: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (points.length < 2) return null;
  return <Polygon positions={points} pathOptions={{ color: '#1F5D3A', dashArray: '6 6' }} />;
}

export default function FarmMap({
  locations,
  plantings = [],
  selectedIds = [],
  onToggle,
  drawingFor,
  onDrawn,
  onCancelDraw,
  heightClass = 'h-[420px]',
}: Props) {
  const [points, setPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    setPoints([]);
  }, [drawingFor]);

  const drawn = useMemo(() => {
    const boundaries = locations
      .map((l) => ({ location: l, polygon: l.boundary_coordinates }))
      .filter((entry): entry is { location: GrowLocation; polygon: BoundaryPolygon } =>
        isBoundaryPolygon(entry.polygon)
      );
    return boundaries;
  }, [locations]);

  // Centre on whatever has been drawn; only fall back when there is nothing.
  const centre = useMemo<LatLngExpression>(() => {
    const first = drawn[0];
    if (first) {
      const c = polygonCentre(first.polygon);
      if (c) return [c[1], c[0]];
    }
    const withGps = locations.find((l) => l.gps_latitude != null && l.gps_longitude != null);
    if (withGps) return [withGps.gps_latitude!, withGps.gps_longitude!];
    return FALLBACK_CENTRE;
  }, [drawn, locations]);

  const finish = useCallback(() => {
    if (!drawingFor) return;
    const boundary = fromLatLngs(points);
    onDrawn?.(drawingFor, boundary, polygonHectares(boundary));
    setPoints([]);
  }, [drawingFor, points, onDrawn]);

  const pendingHectares = polygonHectares(fromLatLngs(points));

  return (
    <div className="space-y-2" data-testid="farm-map">
      {drawingFor && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-500 bg-brand-50 px-3 py-2 text-sm dark:bg-brand-500/10">
          <span className="text-gray-800 dark:text-white/90">
            Tap the corners of the block. {points.length} point{points.length === 1 ? '' : 's'}
            {pendingHectares != null && ` · ${pendingHectares.toFixed(2)} ha`}
          </span>
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setPoints((p) => p.slice(0, -1))}
              disabled={points.length === 0}
              className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-40 dark:text-brand-400"
              data-testid="map-undo-point"
            >
              Undo point
            </button>
            <Button size="sm" onClick={finish} disabled={points.length < 3} data-testid="map-save-boundary">
              Save boundary
            </Button>
            <button
              type="button"
              onClick={onCancelDraw}
              className="text-xs font-medium text-gray-600 hover:underline dark:text-gray-300"
              data-testid="map-cancel-draw"
            >
              Cancel
            </button>
          </span>
        </div>
      )}

      <div className={`${heightClass} overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700`}>
        <MapContainer
          center={centre}
          zoom={drawn.length > 0 ? 15 : 12}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {drawn.map(({ location, polygon }) => {
            const selected = selectedIds.includes(location.id);
            const planting = plantings.find((p) => p.location_id === location.id);
            const crop = planting?.crop_types?.name;
            const colour = crop
              ? cropColour(crop)
              : STATUS_COLOURS[location.status] ?? '#6E7770';
            return (
              <Polygon
                key={location.id}
                positions={toLatLngs(polygon)}
                pathOptions={{
                  color: colour,
                  weight: selected ? 4 : 2,
                  fillOpacity: selected ? 0.5 : 0.2,
                  dashArray: crop ? undefined : '4 4',
                }}
                eventHandlers={onToggle ? { click: () => onToggle(location.id) } : undefined}
              >
                <Tooltip sticky>
                  {location.name}
                  {crop && ` · ${crop}`}
                  {location.size_hectares != null && ` · ${location.size_hectares} ha`}
                  {!crop && ' · nothing planted'}
                </Tooltip>
              </Polygon>
            );
          })}

          {drawingFor && <DrawLayer points={points} onAdd={(p) => setPoints((ps) => [...ps, p])} />}
        </MapContainer>
      </div>
    </div>
  );
}
