import "./env";
import { createConnection } from "../src/db/connection";
import { connectors, operators, stations } from "../src/db/schema";
import type { ConnectorType, District, Status } from "../src/lib/catalog";

const networks = [
  ["Arqa Charge", "arqa@example.test"],
  ["Tañ Energy", "tan@example.test"],
  ["Ile Electric", "ile@example.test"],
  ["Qala Grid", "qala@example.test"],
  ["Sapa Volt", "sapa@example.test"],
] as const;

type SeedStation = [
  name: string, address: string, district: District, latitude: number, longitude: number,
  operator: number, priceKwh: number, hours: string, status: Status,
  plugs: [type: ConnectorType, powerKw: number, quantity: number][],
];

const data: SeedStation[] = [
  ["Абай 109", "пр. Абая, 109", "Алмалинский", 43.24220, 76.90357, 0, 92, "Круглосуточно", "active", [["CCS2", 120, 2], ["Type 2", 22, 2]]],
  ["Алматы-1", "ул. Станционная, 1", "Турксибский", 43.33907, 76.95091, 2, 88, "Круглосуточно", "active", [["GB/T", 90, 2], ["CCS2", 90, 1]]],
  ["Арбат", "ул. Жибек Жолы, 81", "Алмалинский", 43.26351, 76.94338, 1, 62, "08:00–23:00", "active", [["Type 2", 22, 4]]],
  ["Атакент", "ул. Тимирязева, 42", "Бостандыкский", 43.22333, 76.90212, 0, 104, "Круглосуточно", "active", [["CCS2", 150, 3], ["GB/T", 120, 1], ["Type 2", 22, 2]]],
  ["Байкен", "ул. Розыбакиева, 200", "Бостандыкский", 43.21800, 76.88410, 4, 68, "07:00–22:00", "maintenance", [["Type 2", 22, 3], ["CHAdeMO", 50, 1]]],
  ["Барахолка", "Северное кольцо, 3", "Жетысуский", 43.30961, 76.89318, 3, 80, "06:00–21:00", "active", [["GB/T", 60, 3]]],
  ["Боралдайский выезд", "ул. Момышулы, 2/5", "Алатауский", 43.31620, 76.81410, 4, 93, "Круглосуточно", "active", [["CCS2", 120, 2], ["GB/T", 100, 2]]],
  ["Восточный павильон", "Восточная объездная дорога, 44", "Медеуский", 43.26380, 76.99702, 0, 104, "Круглосуточно", "active", [["CCS2", 180, 4], ["GB/T", 120, 2]]],
  ["Галерея на Панфилова", "ул. Панфилова, 103", "Алмалинский", 43.25683, 76.94510, 1, 58, "09:00–22:00", "active", [["Type 2", 11, 4]]],
  ["Достык", "пр. Достык, 91", "Медеуский", 43.24070, 76.95761, 0, 105, "Круглосуточно", "offline", [["CCS2", 150, 2], ["Type 2", 22, 2]]],
  ["Жас Канат", "мкр. Жас Канат, 18", "Турксибский", 43.35032, 77.00377, 2, 56, "08:00–22:00", "active", [["Type 2", 22, 2], ["GB/T", 40, 1]]],
  ["Жетысу", "ул. Саина, 20", "Ауэзовский", 43.22767, 76.84481, 3, 76, "07:00–23:00", "active", [["CHAdeMO", 50, 2], ["CCS2", 60, 2]]],
  ["Западный перехват", "пр. Райымбека, 524", "Наурызбайский", 43.24111, 76.77073, 3, 99, "Круглосуточно", "active", [["CCS2", 180, 2], ["GB/T", 160, 2]]],
  ["Казахфильм", "мкр. Казахфильм, 18", "Бостандыкский", 43.19582, 76.90470, 1, 71, "07:00–23:00", "maintenance", [["Type 2", 22, 3], ["CCS2", 50, 1]]],
  ["Кок-Тобе", "ул. Омаровой, 41", "Медеуский", 43.22826, 76.97830, 1, 83, "09:00–23:00", "active", [["Type 2", 22, 4], ["CCS2", 60, 1]]],
  ["Кокжиек", "мкр. Кокжиек, 22", "Жетысуский", 43.33501, 76.91444, 3, 72, "08:00–22:00", "active", [["GB/T", 50, 2], ["Type 2", 11, 2]]],
  ["Кульджинский терминал", "Кульджинский тракт, 19", "Турксибский", 43.30536, 77.03762, 2, 115, "Круглосуточно", "active", [["CCS2", 240, 3], ["GB/T", 160, 2]]],
  ["Мамыр", "мкр. Мамыр-1, 8/1", "Ауэзовский", 43.21193, 76.84484, 3, 68, "08:00–22:00", "offline", [["Type 2", 22, 3], ["CHAdeMO", 40, 1]]],
  ["Медеу", "ул. Керей-Жанибек хандар, 465", "Медеуский", 43.15795, 77.05887, 2, 108, "08:00–23:00", "active", [["CCS2", 120, 2], ["Type 2", 22, 2]]],
  ["Навои", "ул. Навои, 310", "Бостандыкский", 43.21263, 76.86936, 0, 113, "Круглосуточно", "active", [["CCS2", 250, 4], ["Type 2", 22, 2]]],
  ["Нуркент", "мкр. Нуркент, 9", "Алатауский", 43.27134, 76.81128, 4, 75, "Круглосуточно", "active", [["GB/T", 60, 2], ["Type 2", 22, 2]]],
  ["Орбита", "мкр. Орбита-3, 5", "Бостандыкский", 43.19591, 76.87358, 4, 66, "08:00–22:00", "maintenance", [["Type 2", 22, 4]]],
  ["Парк Горького", "ул. Гоголя, 1", "Медеуский", 43.26232, 76.97406, 1, 74, "09:00–23:00", "active", [["Type 2", 22, 2], ["CCS2", 60, 1], ["CHAdeMO", 50, 1]]],
  ["Райымбек", "пр. Райымбека, 147", "Жетысуский", 43.26796, 76.93060, 3, 90, "Круглосуточно", "active", [["CCS2", 120, 2], ["GB/T", 100, 2]]],
  ["Сайран", "ул. Толе би, 294", "Ауэзовский", 43.24809, 76.85644, 4, 89, "Круглосуточно", "active", [["CCS2", 100, 2], ["CHAdeMO", 50, 2]]],
  ["Саялы", "мкр. Саялы, 51", "Алатауский", 43.30341, 76.78661, 4, 72, "07:00–22:00", "offline", [["GB/T", 60, 3]]],
  ["Таусамалы", "мкр. Таусамалы, 16", "Наурызбайский", 43.19124, 76.81502, 1, 52, "08:00–21:00", "active", [["Type 2", 11, 3]]],
  ["Терминал аэропорта", "ул. Майлина, 2", "Турксибский", 43.34884, 77.01187, 2, 125, "Круглосуточно", "active", [["CCS2", 350, 4], ["GB/T", 180, 2], ["Type 2", 22, 2]]],
  ["Ушконыр", "мкр. Калкаман-2, 14", "Наурызбайский", 43.22218, 76.79512, 3, 70, "07:00–23:00", "maintenance", [["GB/T", 55, 2], ["Type 2", 22, 2]]],
  ["Центральная площадь", "пл. Республики, 4", "Бостандыкский", 43.23879, 76.94516, 0, 105, "Круглосуточно", "active", [["CCS2", 180, 3], ["Type 2", 22, 2]]],
];

function fixtureId(group: number, index: number) {
  return `${group}0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
}

async function main() {
  const { client, db } = createConnection(1);
  try {
    const created = await db.transaction(async (tx) => {
      await tx.insert(operators).values(networks.map(([name, contact], index) => ({
        id: fixtureId(1, index), name, contact,
      }))).onConflictDoNothing();

      const inserted = await tx.insert(stations).values(data.map(([name, address, district, latitude, longitude, operator, priceKwh, openingHours, status], index) => ({
        id: fixtureId(2, index), operatorId: fixtureId(1, operator), name, address, district,
        latitude, longitude, priceKwh, openingHours, status,
      }))).onConflictDoNothing().returning({ id: stations.id });

      const newIds = new Set(inserted.map(({ id }) => id));
      const plugs = data.flatMap((station, index) => {
        const stationId = fixtureId(2, index);
        return newIds.has(stationId) ? station[9].map(([type, powerKw, quantity]) => ({
          stationId, type, powerKw, quantity,
        })) : [];
      });
      if (plugs.length) await tx.insert(connectors).values(plugs);
      return newIds.size;
    });
    console.log(`Демо-данные готовы. Добавлено станций: ${created}.`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Не удалось заполнить каталог.", error);
  process.exitCode = 1;
});
