import { z } from "zod";
import { almatyBounds, connectorTypes, districts, statuses } from "./catalog";

const { south, north, west, east } = almatyBounds;
const stationText = (label: string, min: number, max: number) => z.string().trim()
  .min(min, `${label}: минимум ${min} симв.`)
  .max(max, `${label}: максимум ${max} симв.`);

export const stationSchema = z.object({
  operatorId: z.uuid("Выберите оператора."),
  name: stationText("Название", 3, 80),
  address: stationText("Адрес", 5, 140),
  district: z.enum(districts, "Выберите район."),
  latitude: z.number("Введите широту.").min(south, "Широта вне Алматы.").max(north, "Широта вне Алматы."),
  longitude: z.number("Введите долготу.").min(west, "Долгота вне Алматы.").max(east, "Долгота вне Алматы."),
  priceKwh: z.number("Введите тариф.").min(0, "Тариф от 0 до 1000 ₸.").max(1000, "Тариф от 0 до 1000 ₸."),
  openingHours: stationText("Часы работы", 3, 80),
  status: z.enum(statuses, "Выберите статус."),
  connectors: z.array(z.object({
    type: z.enum(connectorTypes, "Выберите тип разъёма."),
    powerKw: z.number("Введите мощность.").positive("Мощность должна быть выше 0 кВт.")
      .max(600, "Мощность до 600 кВт."),
    quantity: z.number("Введите количество.").int("Укажите целое количество.")
      .min(1, "Количество от 1 до 32.").max(32, "Количество от 1 до 32."),
  })).min(1, "Добавьте хотя бы один разъём.").max(12, "Укажите до 12 групп разъёмов."),
});

export type ActionResult = {
  ok: boolean;
  message: string;
  id?: string;
  errors?: Record<string, string>;
};
