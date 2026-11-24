"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { submitStation } from "@/app/stations/actions";
import { connectorTypes, districts, statuses, statusLabels, type Operator, type Station } from "@/lib/catalog";
import { type ActionResult } from "@/lib/validation";
import { Dialog } from "./dialog";

type PlugDraft = { row: number; type: string; powerKw: string; quantity: string };
const blankPlug = (row: number): PlugDraft => ({ row, type: "CCS2", powerKw: "", quantity: "1" });

function parseNumber(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string" || !value.trim()) return NaN;
  return Number(value.replace(",", "."));
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: ReactNode }) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      {children}
      {error ? <span className="field-error" id={`${name}-error`}>{error}</span> : null}
    </div>
  );
}

export function StationForm({ station, operators, onClose, onSaved }: {
  station?: Station; operators: Operator[]; onClose: () => void; onSaved: (result: ActionResult) => void;
}) {
  const nextRow = useRef(station?.connectors.length ?? 1);
  const formRef = useRef<HTMLFormElement>(null);
  const [plugs, setPlugs] = useState<PlugDraft[]>(() => station?.connectors.length
    ? station.connectors.map((plug, row) => ({ row, type: plug.type, powerKw: String(plug.powerKw), quantity: String(plug.quantity) }))
    : [blankPlug(0)]);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult>();
  const errors = result?.errors ?? {};

  function attributes(name: string, path = name) {
    return { id: name, name, "aria-invalid": Boolean(errors[path]), "aria-describedby": errors[path] ? `${name}-error` : undefined };
  }

  function changePlug(row: number, field: "type" | "powerKw" | "quantity", value: string) {
    setPlugs((current) => current.map((plug) => plug.row === row ? { ...plug, [field]: value } : plug));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const input = {
      operatorId: fields.get("operatorId"), name: fields.get("name"), address: fields.get("address"),
      district: fields.get("district"), latitude: parseNumber(fields.get("latitude")),
      longitude: parseNumber(fields.get("longitude")), priceKwh: parseNumber(fields.get("priceKwh")),
      openingHours: fields.get("openingHours"), status: fields.get("status"),
      connectors: plugs.map(({ type, powerKw, quantity }) => ({ type, powerKw: parseNumber(powerKw), quantity: parseNumber(quantity) })),
    };
    start(async () => {
      try {
        const response = await submitStation(station?.id, input);
        if (response.ok) onSaved(response);
        else {
          setResult(response);
          if (response.errors) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
        }
      } catch {
        setResult({ ok: false, message: "Связь прервалась. Проверьте каталог перед повторной отправкой." });
      }
    });
  }

  return (
    <Dialog title={station ? "Редактировать станцию" : "Добавить станцию"} wide busy={pending} onClose={onClose}>
      <form onSubmit={onSubmit} ref={formRef} noValidate>
        <div className="form-grid">
          <Field label="Название" name="name" error={errors.name}>
            <input {...attributes("name")} defaultValue={station?.name} maxLength={80} required data-initial-focus />
          </Field>
          <Field label="Оператор" name="operatorId" error={errors.operatorId}>
            <select {...attributes("operatorId")} defaultValue={station?.operatorId ?? ""} required>
              <option value="" disabled>Выберите оператора</option>
              {operators.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
          </Field>
          <Field label="Адрес" name="address" error={errors.address}>
            <input {...attributes("address")} defaultValue={station?.address} maxLength={140} required />
          </Field>
          <Field label="Район" name="district" error={errors.district}>
            <select {...attributes("district")} defaultValue={station?.district ?? ""} required>
              <option value="" disabled>Выберите район</option>
              {districts.map((district) => <option key={district}>{district}</option>)}
            </select>
          </Field>
          <Field label="Широта" name="latitude" error={errors.latitude}>
            <input {...attributes("latitude")} defaultValue={station?.latitude} placeholder="43.246" inputMode="decimal" required />
          </Field>
          <Field label="Долгота" name="longitude" error={errors.longitude}>
            <input {...attributes("longitude")} defaultValue={station?.longitude} placeholder="76.913" inputMode="decimal" required />
          </Field>
          <Field label="Тариф, ₸/кВт·ч" name="priceKwh" error={errors.priceKwh}>
            <input {...attributes("priceKwh")} defaultValue={station?.priceKwh} placeholder="90" inputMode="decimal" required />
          </Field>
          <Field label="Часы работы" name="openingHours" error={errors.openingHours}>
            <input {...attributes("openingHours")} defaultValue={station?.openingHours} placeholder="Круглосуточно" maxLength={80} required />
          </Field>
          <Field label="Статус" name="status" error={errors.status}>
            <select {...attributes("status")} defaultValue={station?.status ?? "active"} required>
              {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </Field>
        </div>
        <fieldset className="connector-form">
          <legend>Разъёмы</legend>
          {plugs.map((plug, index) => {
            const prefix = `plug-${plug.row}`;
            const path = `connectors.${index}`;
            return (
              <div className="plug-row" key={plug.row}>
                <Field label="Тип" name={`${prefix}-type`} error={errors[`${path}.type`]}>
                  <select {...attributes(`${prefix}-type`, `${path}.type`)} value={plug.type} onChange={(event) => changePlug(plug.row, "type", event.target.value)}>
                    {connectorTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </Field>
                <Field label="кВт" name={`${prefix}-power`} error={errors[`${path}.powerKw`]}>
                  <input {...attributes(`${prefix}-power`, `${path}.powerKw`)} value={plug.powerKw} inputMode="decimal" required
                    onChange={(event) => changePlug(plug.row, "powerKw", event.target.value)} />
                </Field>
                <Field label="Штук" name={`${prefix}-quantity`} error={errors[`${path}.quantity`]}>
                  <input {...attributes(`${prefix}-quantity`, `${path}.quantity`)} value={plug.quantity} inputMode="numeric" required
                    onChange={(event) => changePlug(plug.row, "quantity", event.target.value)} />
                </Field>
                <button className="icon-button remove-plug" type="button" aria-label={`Удалить группу разъёмов ${index + 1}`}
                  disabled={plugs.length === 1} onClick={() => setPlugs((current) => current.filter(({ row }) => row !== plug.row))}>
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
            );
          })}
          {errors.connectors ? <p className="field-error">{errors.connectors}</p> : null}
          <button className="button button-outlined button-small" type="button" disabled={plugs.length >= 12}
            onClick={() => { const row = nextRow.current++; setPlugs((current) => [...current, blankPlug(row)]); }}>
            <Plus size={16} aria-hidden /> Добавить разъём
          </button>
        </fieldset>
        {result ? <p className="form-error" role="alert">{result.message}</p> : null}
        <div className="dialog-actions">
          <button className="button button-outlined" type="button" onClick={onClose} disabled={pending}>Отмена</button>
          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : station ? "Сохранить изменения" : "Добавить станцию"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
