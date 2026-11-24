"use client";

import { useState, useTransition, type FormEvent } from "react";
import { deleteStation, unlockDemo } from "@/app/stations/actions";
import { type Station } from "@/lib/catalog";
import { Dialog } from "./dialog";

export function UnlockDialog({ onClose, onUnlocked }: { onClose: () => void; onUnlocked: (message: string) => void }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = new FormData(event.currentTarget).get("code");
    start(async () => {
      try {
        const result = await unlockDemo(code);
        if (result.ok) onUnlocked(result.message);
        else setError(result.message);
      } catch {
        setError("Связь прервалась. Повторите попытку.");
      }
    });
  }

  return (
    <Dialog title="Режим демо" onClose={onClose} busy={pending}>
      <p className="dialog-description">Введите код доступа, чтобы добавлять, редактировать и удалять записи каталога.</p>
      <form onSubmit={unlock}>
        <div className="form-field">
          <label htmlFor="demo-code">Код доступа</label>
          <input id="demo-code" name="code" type="password" autoComplete="current-password" maxLength={256}
            aria-invalid={Boolean(error)} aria-describedby={error ? "demo-code-error" : undefined} required data-initial-focus />
        </div>
        {error ? <p className="form-error" id="demo-code-error" role="alert">{error}</p> : null}
        <div className="dialog-actions">
          <button type="button" className="button button-outlined" onClick={onClose} disabled={pending}>Отмена</button>
          <button type="submit" className="button button-primary" disabled={pending}>{pending ? "Проверяем…" : "Открыть доступ"}</button>
        </div>
      </form>
    </Dialog>
  );
}

export function DeleteDialog({ station, onClose, onDeleted }: { station: Station; onClose: () => void; onDeleted: (message: string) => void }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      try {
        const result = await deleteStation(station.id);
        if (result.ok) onDeleted(result.message);
        else setError(result.message);
      } catch {
        setError("Связь прервалась. Проверьте каталог перед повтором.");
      }
    });
  }

  return (
    <Dialog title="Удалить станцию?" onClose={onClose} busy={pending}>
      <p className="dialog-description">Запись «{station.name}» и её разъёмы будут удалены из каталога.</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="dialog-actions">
        <button type="button" className="button button-outlined" onClick={onClose} disabled={pending} data-initial-focus>Отмена</button>
        <button type="button" className="button button-danger" onClick={confirm} disabled={pending}>
          {pending ? "Удаляем…" : "Удалить станцию"}
        </button>
      </div>
    </Dialog>
  );
}
