"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, MapPin, Plug, Zap } from "lucide-react";
import { ChargingMap } from "./map-shell";
import { formatPower, type District, type Status } from "@/lib/catalog";
import { StationStatus } from "./station-status";

type PreviewStation = {
  id: string; name: string; latitude: number; longitude: number; status: Status;
  address: string; district: District; power: number; plugTypes: string;
};

export function HomeMap({ stations }: { stations: PreviewStation[] }) {
  const [selection, setSelection] = useState<string>();
  const station = stations.find(({ id }) => id === selection) ?? stations.find(({ name }) => name === "Атакент") ?? stations[0];

  return (
    <div className="home-map-grid">
      <div className="home-map-canvas">
        <ChargingMap stations={stations} selectedId={station?.id} onSelect={setSelection} />
      </div>
      <div className="home-map-detail">
        {station ? (
          <>
            <StationStatus status={station.status} />
            <div className="home-map-identity">
              <h3>{station.name}</h3>
              <p><MapPin size={15} aria-hidden />{station.address}</p>
            </div>
            <div className="home-map-specs">
              <span><Zap size={17} aria-hidden /> {formatPower(station.power)}</span>
              <span><Plug size={17} aria-hidden /> {station.plugTypes || "Разъёмы не указаны"}</span>
            </div>
            <Link href={`/stations?station=${station.id}`} className="text-link">
              Подробнее о станции <ArrowUpRight size={17} aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <h3>Каталог пуст</h3>
            <Link href="/stations" className="text-link">Открыть каталог <ChevronRight size={17} aria-hidden /></Link>
          </>
        )}
      </div>
    </div>
  );
}
