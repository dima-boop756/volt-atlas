import { sql } from "drizzle-orm";
import { check, doublePrecision, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { connectorTypes, districts, statuses } from "../lib/catalog";

export const stationDistrict = pgEnum("station_district", districts);
export const stationStatus = pgEnum("station_status", statuses);
export const connectorType = pgEnum("connector_type", connectorTypes);

export const operators = pgTable("operators", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  contact: text().notNull(),
});

export const stations = pgTable("stations", {
  id: uuid().primaryKey().defaultRandom(),
  operatorId: uuid("operator_id").notNull().references(() => operators.id),
  name: text().notNull(),
  address: text().notNull(),
  district: stationDistrict().notNull(),
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
  priceKwh: doublePrecision("price_kwh").notNull(),
  openingHours: text("opening_hours").notNull(),
  status: stationStatus().notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (station) => [
  index("stations_operator_idx").on(station.operatorId),
  check("stations_latitude_range", sql`${station.latitude} between -90 and 90`),
  check("stations_longitude_range", sql`${station.longitude} between -180 and 180`),
  check("stations_price_nonnegative", sql`${station.priceKwh} >= 0`),
]);

export const connectors = pgTable("connectors", {
  id: uuid().primaryKey().defaultRandom(),
  stationId: uuid("station_id").notNull().references(() => stations.id, { onDelete: "cascade" }),
  type: connectorType().notNull(),
  powerKw: doublePrecision("power_kw").notNull(),
  quantity: integer().notNull(),
}, (connector) => [
  index("connectors_station_idx").on(connector.stationId),
  check("connectors_positive_power", sql`${connector.powerKw} > 0`),
  check("connectors_positive_quantity", sql`${connector.quantity} > 0`),
]);
