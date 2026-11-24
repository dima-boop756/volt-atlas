"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { divIcon, latLngBounds, type LatLngTuple } from "leaflet";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import { almatyCenter, statusLabels, type Station, type Status } from "@/lib/catalog";
import { reduceMotion } from "@/lib/ui-motion";

type MapStation = Pick<Station, "id" | "name" | "latitude" | "longitude" | "status">;
export type MapFocus = { id: string; smooth: boolean };

const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function stationIcon(status: Status, selected: boolean) {
  const size = selected ? 34 : 26;
  return divIcon({
    className: `map-marker marker-${status}${selected ? " marker-selected" : ""}`,
    html: '<svg aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M13.5 2.5 5 13h6l-1 8.5L19 11h-6l.5-8.5Z"/></svg>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    tooltipAnchor: [0, -size / 2],
  });
}

const icons = {
  active: stationIcon("active", false),
  maintenance: stationIcon("maintenance", false),
  offline: stationIcon("offline", false),
};

function fitCatalog(map: ReturnType<typeof useMap>, points: LatLngTuple[]) {
  if (points.length === 0) {
    map.setView([...almatyCenter], 12, { animate: false });
    return;
  }
  if (points.length === 1) {
    map.setView(points[0], 13, { animate: false });
    return;
  }
  map.fitBounds(latLngBounds(points), { padding: [36, 32], maxZoom: 13, animate: false });
}

function ViewControls({ points, focus, request, visible }: {
  points: LatLngTuple[]; focus?: MapStation; request?: MapFocus; visible: boolean;
}) {
  const map = useMap();
  const fittedPoints = useRef<LatLngTuple[]>(null);
  const handledFocus = useRef<MapFocus | undefined>(undefined);
  const focusedLat = focus?.latitude;
  const focusedLng = focus?.longitude;

  useEffect(() => {
    if (!visible || fittedPoints.current === points) return;
    fittedPoints.current = points;
    fitCatalog(map, points);
  }, [map, points, visible]);

  useEffect(() => {
    if (!visible) {
      map.stop();
      return;
    }
    if (handledFocus.current === request && focusedLat !== undefined && focusedLng !== undefined) return;
    map.stop();
    if (!request || focusedLat === undefined || focusedLng === undefined) {
      handledFocus.current = undefined;
      return;
    }
    handledFocus.current = request;
    const target: LatLngTuple = [focusedLat, focusedLng];
    const zoom = map.getZoom();
    const size = map.getSize();
    const offset = map.latLngToContainerPoint(target).subtract(size.divideBy(2));
    const nearby = Math.abs(offset.x) < size.x * 0.42 && Math.abs(offset.y) < size.y * 0.42;
    if (request.smooth && !reduceMotion() && zoom >= 13 && nearby) {
      map.panTo(target, { animate: true, duration: 0.18, easeLinearity: 0.32 });
    } else {
      map.setView(target, Math.max(zoom, 13), { animate: false });
    }
  }, [map, focusedLat, focusedLng, request, visible]);

  useEffect(() => {
    map.attributionControl.setPrefix(false);
    const container = map.getContainer();
    const resize = new ResizeObserver(() => {
      if (container.clientWidth && container.clientHeight) {
        map.invalidateSize({ pan: false, debounceMoveend: true });
      }
    });
    resize.observe(container);
    return () => resize.disconnect();
  }, [map]);

  return (
    <div className="map-controls" aria-label="Управление картой">
      <div className="map-zoom">
        <button type="button" onClick={() => map.zoomIn(undefined, { animate: false })} aria-label="Приблизить карту"><Plus size={18} aria-hidden /></button>
        <button type="button" onClick={() => map.zoomOut(undefined, { animate: false })} aria-label="Отдалить карту"><Minus size={18} aria-hidden /></button>
      </div>
      <button type="button" onClick={() => fitCatalog(map, points)} aria-label="Показать все станции" className="map-fit">
        <LocateFixed size={17} aria-hidden />
      </button>
    </div>
  );
}

export default function ChargingMap({ stations, selectedId, onSelect, mapFocus, visible = true }: {
  stations: MapStation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  mapFocus?: MapFocus;
  visible?: boolean;
}) {
  const points = useMemo<LatLngTuple[]>(() => stations.map(({ latitude, longitude }) => [latitude, longitude]), [stations]);
  const focus = stations.find(({ id }) => id === mapFocus?.id);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const failures = useRef(0);

  return (
    <div className="map-frame" role="region" aria-label="Карта зарядных станций Алматы">
      <MapContainer className="leaflet-map" center={[...almatyCenter]} zoom={12} minZoom={9} maxZoom={18}
        scrollWheelZoom={false} zoomControl={false} zoomAnimation={false} inertia={false} zoomSnap={0.5}>
        <TileLayer url={tileUrl} attribution={attribution}
          eventHandlers={{
            tileload: () => { failures.current = 0; setTilesUnavailable(false); },
            tileerror: () => {
              failures.current += 1;
              if (failures.current < 4) return;
              failures.current = 0;
              setTilesUnavailable(true);
            },
          }} />
        <ViewControls points={points} focus={focus} request={mapFocus} visible={visible} />
        {stations.map((station) => {
          const active = station.id === selectedId;
          const title = `${station.name} · ${statusLabels[station.status]}`;
          return (
            <Marker key={station.id} title={title} alt={title}
              position={[station.latitude, station.longitude]} icon={active ? selectedIcon : icons[station.status]}
              zIndexOffset={active ? 1000 : 0} eventHandlers={{
                click: () => onSelect(station.id),
                add: ({ target }) => target.getElement()?.setAttribute("aria-label", title),
              }}>
              <Tooltip direction="top" opacity={1}>{station.name}</Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
      {tilesUnavailable ? <div className="map-tile-error" role="status">Подложка карты временно недоступна</div> : null}
    </div>
  );
}

const selectedIcon = stationIcon("active", true);
