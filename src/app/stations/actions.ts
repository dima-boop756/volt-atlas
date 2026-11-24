"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { removeStation, saveStation } from "@/db/queries";
import { endDemoSession, grantDemoSession, hasDemoSession } from "@/lib/demo-session";
import { stationSchema, type ActionResult } from "@/lib/validation";

function refreshCatalog() {
  revalidatePath("/stations");
  revalidatePath("/analytics");
  revalidatePath("/");
}

export async function unlockDemo(code: unknown): Promise<ActionResult> {
  const error = await grantDemoSession(code);
  return error ? { ok: false, message: error } : { ok: true, message: "Редактирование открыто." };
}

export async function lockDemo(): Promise<ActionResult> {
  await endDemoSession();
  return { ok: true, message: "Режим редактирования закрыт." };
}

export async function submitStation(id: string | undefined, input: unknown): Promise<ActionResult> {
  if (!(await hasDemoSession())) return { ok: false, message: "Войдите в режим редактирования." };
  if (id !== undefined && !z.uuid().safeParse(id).success) return { ok: false, message: "Неверный идентификатор станции." };
  const parsed = stationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Проверьте выделенные поля.",
      errors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])),
    };
  }

  try {
    const saved = await saveStation(id, parsed.data);
    if (!saved) return { ok: false, message: "Станция уже удалена. Обновите страницу." };
    refreshCatalog();
    return { ok: true, id: saved, message: id ? "Изменения сохранены." : "Станция добавлена." };
  } catch (error) {
    if ((error as { code?: string }).code === "23503") {
      return { ok: false, message: "Выберите оператора из списка.", errors: { operatorId: "Оператор не найден." } };
    }
    return { ok: false, message: "Не удалось сохранить станцию. Повторите попытку." };
  }
}

export async function deleteStation(id: string): Promise<ActionResult> {
  if (!(await hasDemoSession())) return { ok: false, message: "Войдите в режим редактирования." };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Неверный идентификатор станции." };

  try {
    if (!(await removeStation(id))) return { ok: false, message: "Станция уже удалена." };
    refreshCatalog();
    return { ok: true, message: "Станция удалена." };
  } catch {
    return { ok: false, message: "Не удалось удалить станцию. Повторите попытку." };
  }
}
