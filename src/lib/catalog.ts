export const districts = [
  "Алатауский", "Алмалинский", "Ауэзовский", "Бостандыкский",
  "Жетысуский", "Медеуский", "Наурызбайский", "Турксибский",
] as const;

export const connectorTypes = ["CCS2", "Type 2", "GB/T", "CHAdeMO"] as const;
export const statuses = ["active", "maintenance", "offline"] as const;

export type District = typeof districts[number];
export type ConnectorType = typeof connectorTypes[number];
export type Status = typeof statuses[number];

export const statusLabels: Record<Status, string> = {
  active: "Действует",
  maintenance: "На обслуживании",
  offline: "Не работает",
};

export const powerGroups = [
  { label: "≤22", upper: 22, inclusive: true },
  { label: ">22–<60", upper: 60, inclusive: false },
  { label: "60–<120", upper: 120, inclusive: false },
  { label: "120–<180", upper: 180, inclusive: false },
  { label: "≥180", upper: Infinity, inclusive: false },
];

export function powerGroupIndex(power: number) {
  return powerGroups.findIndex(({ upper, inclusive }) => power < upper || (inclusive && power === upper));
}

export const almatyCenter = [43.246, 76.913] as const;
export const almatyBounds = { south: 43.045, north: 43.425, west: 76.675, east: 77.14 };

export interface StationInput {
  operatorId: string;
  name: string;
  address: string;
  district: District;
  latitude: number;
  longitude: number;
  priceKwh: number;
  openingHours: string;
  status: Status;
  connectors: { type: ConnectorType; powerKw: number; quantity: number }[];
}

export interface Operator {
  id: string;
  name: string;
  contact: string;
}

export interface Station extends StationInput {
  id: string;
  operator: Operator;
}

export function maxPower(station: Pick<Station, "connectors">) {
  return Math.max(0, ...station.connectors.map(({ powerKw }) => powerKw));
}

const numbers = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
export const formatNumber = (value: number) => numbers.format(value);
export const formatPower = (value: number) => `${formatNumber(value)} кВт`;

export function stationCount(value: number) {
  const last = value % 10;
  const teens = value % 100 >= 11 && value % 100 <= 14;
  return `${formatNumber(value)} ${teens || last === 0 || last > 4 ? "станций" : last === 1 ? "станция" : "станции"}`;
}
