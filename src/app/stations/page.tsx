import type { Metadata } from "next";
import { listOperators, listStations } from "@/db/queries";
import { hasDemoSession } from "@/lib/demo-session";
import { StationsCatalog } from "@/components/stations-catalog";

export const metadata: Metadata = {
  title: "Станции",
  description: "Интерактивная карта и таблица демонстрационных зарядных станций Алматы.",
};

export default async function StationsPage({ searchParams }: {
  searchParams: Promise<{ station?: string | string[] }>;
}) {
  const [catalog, operators, canEdit, params] = await Promise.all([
    listStations(), listOperators(), hasDemoSession(), searchParams,
  ]);
  const selected = typeof params.station === "string" && catalog.some(({ id }) => params.station === id)
    ? params.station
    : undefined;

  return <StationsCatalog key={selected ?? "catalog"} catalog={catalog} operators={operators} canEdit={canEdit} initialSelected={selected} />;
}
