import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { DirectoryResource } from '../../lib/types';

const COLOR: Record<string, string> = {
  VERIFIED: '#065f46',
  NEEDS_RECHECK: '#b45309',
  UNCONFIRMED: '#64748b',
  INACTIVE: '#991b1b',
};

/** OpenStreetMap view of the directory; marker colour mirrors the verification badge. */
export function ResourceMap({ resources, selectedId, onSelect, label }: { resources: DirectoryResource[]; selectedId?: string | null; onSelect: (id: string) => void; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: false, attributionControl: true }).setView([10.87, 106.62], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const pts: L.LatLngExpression[] = [];
    for (const r of resources) {
      if (r.latitude == null || r.longitude == null) continue;
      const selected = r.id === selectedId;
      const m = L.circleMarker([r.latitude, r.longitude], {
        radius: selected ? 11 : 8,
        color: '#ffffff',
        weight: 2,
        fillColor: COLOR[r.freshness] ?? '#64748b',
        fillOpacity: 1,
      })
        .bindTooltip(r.organisationName, { direction: 'top' })
        .on('click', () => onSelect(r.id));
      m.addTo(layer.current);
      pts.push([r.latitude, r.longitude]);
    }
    if (pts.length > 1 && !selectedId) map.current.fitBounds(L.latLngBounds(pts), { padding: [24, 24], maxZoom: 13 });
    const sel = resources.find((r) => r.id === selectedId);
    if (sel?.latitude != null && sel.longitude != null) map.current.setView([sel.latitude, sel.longitude], 14);
  }, [resources, selectedId, onSelect]);

  return <div ref={el} role="img" aria-label={label} className="h-[320px] w-full overflow-hidden rounded-2xl border border-line lg:h-[520px]" />;
}
