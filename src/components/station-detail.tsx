"use client";

import { Clock3, Pencil, Plug, Trash2, X, Zap } from "lucide-react";
import { formatNumber, formatPower, maxPower, type Station } from "@/lib/catalog";
import { StationStatus } from "./station-status";

export function StationDetail({ station, canEdit, onClose, onEdit, onDelete }: {
  station: Station; canEdit: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <aside className="station-detail" aria-label={`Сведения о станции ${station.name}`} aria-live="polite">
      <div className="detail-title">
        <div>
          <StationStatus status={station.status} />
          <h2>{station.name}</h2>
          <p>{station.address} · {station.district} район</p>
        </div>
        <button className="icon-button detail-close" type="button" onClick={onClose} aria-label="Закрыть сведения">
          <X size={19} aria-hidden />
        </button>
      </div>
      <dl className="detail-specs">
        <div><dt><Zap size={14} aria-hidden /> До</dt><dd>{formatPower(maxPower(station))}</dd></div>
        <div><dt>Тариф</dt><dd>{formatNumber(station.priceKwh)} <small>₸/кВт·ч</small></dd></div>
        <div><dt><Clock3 size={14} aria-hidden /> Часы работы</dt><dd>{station.openingHours}</dd></div>
      </dl>
      <ul className="detail-plugs" aria-label="Разъёмы станции">
        {station.connectors.map((plug, index) => <li key={index}>
          <Plug size={13} aria-hidden /><span>{plug.type}</span> <span>{formatPower(plug.powerKw)} × {plug.quantity}</span>
        </li>)}
      </ul>
      <div className="detail-operator">
        <span>Оператор <strong>{station.operator.name}</strong></span>
        <span className="operator-contact">{station.operator.contact}</span>
      </div>
      {canEdit ? <div className="detail-actions">
        <button className="button button-outlined button-small" type="button" onClick={onEdit}><Pencil size={15} aria-hidden /> Редактировать</button>
        <button className="button button-outlined button-small delete-link" type="button" onClick={onDelete}><Trash2 size={15} aria-hidden /> Удалить</button>
      </div> : null}
    </aside>
  );
}
