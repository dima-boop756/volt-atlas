import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { connectorTypes, districts, maxPower, powerGroupIndex, powerGroups, statuses, type Station, type StationInput } from "@/lib/catalog";
import { createConnection } from "./connection";
import { connectors, operators, stations } from "./schema";

type Connection = ReturnType<typeof createConnection>;
const globalDatabase = globalThis as typeof globalThis & { voltConnection?: Connection };

function database() {
  globalDatabase.voltConnection ??= createConnection(3);
  return globalDatabase.voltConnection.db;
}

export async function listStations() {
  const rows = await database()
    .select({
      station: {
        id: stations.id, operatorId: stations.operatorId, name: stations.name,
        address: stations.address, district: stations.district, latitude: stations.latitude,
        longitude: stations.longitude, priceKwh: stations.priceKwh,
        openingHours: stations.openingHours, status: stations.status,
      },
      operator: operators,
      connector: { type: connectors.type, powerKw: connectors.powerKw, quantity: connectors.quantity },
    })
    .from(stations)
    .innerJoin(operators, eq(operators.id, stations.operatorId))
    .leftJoin(connectors, eq(connectors.stationId, stations.id))
    .orderBy(asc(stations.name), asc(stations.id), desc(connectors.powerKw), asc(connectors.type));

  const grouped = new Map<string, Station>();
  for (const { station, operator, connector } of rows) {
    let entry = grouped.get(station.id);
    if (!entry) {
      entry = { ...station, operator, connectors: [] };
      grouped.set(station.id, entry);
    }
    if (connector) entry.connectors.push(connector);
  }
  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export function listOperators() {
  return database().select().from(operators).orderBy(asc(operators.name));
}

export async function saveStation(id: string | undefined, input: StationInput) {
  const { connectors: plugs, ...attributes } = input;
  return database().transaction(async (tx) => {
    const [saved] = id
      ? await tx.update(stations).set({ ...attributes, updatedAt: new Date() })
        .where(eq(stations.id, id)).returning({ id: stations.id })
      : await tx.insert(stations).values(attributes).returning({ id: stations.id });

    if (!saved) return null;
    if (id) await tx.delete(connectors).where(eq(connectors.stationId, id));
    await tx.insert(connectors).values(plugs.map((plug) => ({ ...plug, stationId: saved.id })));
    return saved.id;
  });
}

export async function removeStation(id: string) {
  const deleted = await database().delete(stations).where(eq(stations.id, id)).returning({ id: stations.id });
  return deleted.length > 0;
}

export function analyzeCatalog(catalog: Station[]) {
  const districtCounts = new Map(districts.map((district) => [district, 0]));
  const connectorCounts = new Map(connectorTypes.map((type) => [type, 0]));
  const statusCounts = new Map(statuses.map((status) => [status, 0]));
  const power = powerGroups.map(({ label }) => ({ label, count: 0 }));
  let totalConnectors = 0;
  let sumMax = 0;
  let peak = 0;

  for (const station of catalog) {
    const maximum = maxPower(station);
    peak = Math.max(peak, maximum);
    sumMax += maximum;
    districtCounts.set(station.district, (districtCounts.get(station.district) ?? 0) + 1);
    statusCounts.set(station.status, (statusCounts.get(station.status) ?? 0) + 1);
    power[powerGroupIndex(maximum)].count += 1;
    for (const connector of station.connectors) {
      totalConnectors += connector.quantity;
      connectorCounts.set(connector.type, (connectorCounts.get(connector.type) ?? 0) + connector.quantity);
    }
  }

  return {
    total: catalog.length,
    active: statusCounts.get("active") ?? 0,
    totalConnectors,
    peak,
    averageMax: catalog.length ? sumMax / catalog.length : 0,
    coveredDistricts: [...districtCounts.values()].filter(Boolean).length,
    districts: [...districtCounts].map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    types: [...connectorCounts].map(([label, count]) => ({ label, count })),
    statuses: [...statusCounts].map(([status, count]) => ({ status, count })),
    power,
  };
}

export type CatalogAnalytics = ReturnType<typeof analyzeCatalog>;
