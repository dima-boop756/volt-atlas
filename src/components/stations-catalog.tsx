"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, ChevronRight, LayoutList, LockKeyhole, Map, MapPinOff, PlugZap, Plus, Search, UnlockKeyhole, X, Zap } from "lucide-react";
import { lockDemo } from "@/app/stations/actions";
import { connectorTypes, districts, formatPower, maxPower, powerGroupIndex, powerGroups, stationCount, statuses, statusLabels, type Operator, type Station } from "@/lib/catalog";
import type { ActionResult } from "@/lib/validation";
import { easeOut, useSelectionIndicator, useSurfaceTransition } from "@/lib/ui-motion";
import type { MapFocus } from "./charging-map";
import { ChargingMap } from "./map-shell";
import { StationDetail } from "./station-detail";
import { StationStatus } from "./station-status";
import { DeleteDialog, UnlockDialog } from "./demo-dialogs";
import { StationForm } from "./station-form";

const emptyFilters = { district: "", power: "", connector: "", status: "" };
type Filter = keyof typeof emptyFilters;
type Panel = { kind: "access" | "create" } | { kind: "edit" | "delete"; station: Station };
type CatalogView = "map" | "table";
const catalogViews = [
  { id: "map", label: "Карта", Icon: Map },
  { id: "table", label: "Таблица", Icon: LayoutList },
] as const;
const normalize = (value: string) => value.toLocaleLowerCase("ru").replaceAll("ё", "е");

const filterOptions = {
  district: { label: "Район", options: districts.map((value) => ({ value, label: value })) },
  power: { label: "Мощность", options: powerGroups.map(({ label }, index) => ({ value: String(index), label: `${label} кВт` })) },
  connector: { label: "Разъём", options: connectorTypes.map((value) => ({ value, label: value })) },
  status: { label: "Статус", options: statuses.map((value) => ({ value, label: statusLabels[value] })) },
};

function EmptyCatalog({ filtering, onReset }: { filtering: boolean; onReset: () => void }) {
  return (
    <div className="empty-catalog">
      <MapPinOff size={24} aria-hidden />
      <h2>{filtering ? "Ничего не найдено" : "Каталог пуст"}</h2>
      <p>{filtering ? "Попробуйте изменить запрос или фильтры." : "Станции появятся здесь после добавления."}</p>
      {filtering ? <button className="button button-outlined button-small" type="button" onClick={onReset}>Сбросить фильтры</button> : null}
    </div>
  );
}

function StationList({ stations, selectedId, onSelect, filtering, onReset, listRef }: {
  stations: Station[]; selectedId?: string; onSelect: (id: string, pointer: boolean) => void; filtering: boolean;
  onReset: () => void; listRef: React.RefObject<HTMLUListElement | null>;
}) {
  return (
    <section className="station-list" aria-label="Список станций">
      <div className="list-heading">
        <span aria-live="polite">{stationCount(stations.length)}</span>
        {filtering ? <button type="button" className="plain-button" onClick={onReset}>Сбросить</button> : null}
      </div>
      {stations.length ? <ul ref={listRef}>
        {stations.map((station) => (
          <li key={station.id} data-station={station.id}>
            <button type="button" className="station-row" aria-pressed={selectedId === station.id} onClick={(event) => onSelect(station.id, event.detail > 0)}>
              <span className="station-row-icon"><PlugZap size={20} strokeWidth={1.75} aria-hidden /></span>
              <span className="station-row-text">
                <strong>{station.name}</strong>
                <span className="station-address">{station.address}</span>
                <span className="station-row-meta">
                  <span className="station-row-power"><Zap size={13} fill="currentColor" aria-hidden />{formatPower(maxPower(station))}</span>
                  <StationStatus status={station.status} />
                </span>
              </span>
              <ChevronRight className="station-row-chevron" size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ul> : <EmptyCatalog filtering={filtering} onReset={onReset} />}
    </section>
  );
}

function StationTable({ stations, selectedId, onSelect }: {
  stations: Station[]; selectedId?: string; onSelect: (id: string) => void;
}) {
  return (
    <table className="station-table">
      <caption className="sr-only">Зарядные станции Алматы</caption>
      <thead><tr>
        <th scope="col">Станция</th>
        <th scope="col" className="table-extra">Район</th>
        <th scope="col">Мощность</th>
        <th scope="col" className="table-extra">Разъёмы</th>
        <th scope="col">Статус</th>
      </tr></thead>
      <tbody>{stations.map((station) => (
        <tr key={station.id} data-selected={selectedId === station.id} onClick={() => onSelect(station.id)}>
          <th scope="row">
            <button type="button" className="table-station" onClick={(event) => { event.stopPropagation(); onSelect(station.id); }}
              aria-pressed={selectedId === station.id}>
              <strong>{station.name}</strong>
              <span>{station.address}</span>
            </button>
          </th>
          <td className="table-extra">{station.district}</td>
          <td>{formatPower(maxPower(station))}</td>
          <td className="table-extra">{[...new Set(station.connectors.map(({ type }) => type))].join(" / ") || "—"}</td>
          <td><StationStatus status={station.status} /></td>
        </tr>
      ))}</tbody>
    </table>
  );
}

function ViewToggle({ view, onChange }: { view: CatalogView; onChange: (view: CatalogView) => void }) {
  const { group, indicator } = useSelectionIndicator<HTMLDivElement>(view, '[aria-pressed="true"]');
  return (
    <div ref={group} className="view-toggle" role="group" aria-label="Представление каталога">
      {catalogViews.map(({ id, label, Icon }) => (
        <button key={id} type="button" className="view-option" aria-pressed={view === id} onClick={() => onChange(id)}>
          <Icon size={16} aria-hidden /> {label}
        </button>
      ))}
      <span ref={indicator} className="view-selection" aria-hidden="true">
        {catalogViews.map(({ id, label, Icon }) => (
          <span key={id} className="view-option"><Icon size={16} /> {label}</span>
        ))}
      </span>
    </div>
  );
}

export function StationsCatalog({ catalog, operators, canEdit, initialSelected }: {
  catalog: Station[]; operators: Operator[]; canEdit: boolean; initialSelected?: string;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [view, setView] = useState<CatalogView>("map");
  const [selectedId, setSelectedId] = useState(() => initialSelected ?? catalog.find(({ name }) => name === "Атакент")?.id);
  const [selectionOpened, setSelectionOpened] = useState(Boolean(initialSelected));
  const [mapFocus, setMapFocus] = useState<MapFocus | undefined>(
    () => initialSelected ? { id: initialSelected, smooth: false } : undefined,
  );
  const [panel, setPanel] = useState<Panel>();
  const [notice, setNotice] = useState<{ message: string; ok: boolean }>();
  const [pendingLock, startLock] = useTransition();
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const listRef = useRef<HTMLUListElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const viewRef = useSurfaceTransition<HTMLDivElement>(view, 120);
  const reduce = useReducedMotion();
  const deferredQuery = useDeferredValue(query);
  const filtering = Boolean(query.trim() || Object.values(filters).some(Boolean));

  const filtered = useMemo(() => {
    const tokens = normalize(deferredQuery.trim()).split(/\s+/).filter(Boolean);
    return catalog.filter((station) => {
      const searchable = normalize(`${station.name} ${station.address}`);
      return tokens.every((token) => searchable.includes(token))
        && (!filters.district || station.district === filters.district)
        && (!filters.status || station.status === filters.status)
        && (!filters.power || powerGroupIndex(maxPower(station)) === Number(filters.power))
        && (!filters.connector || station.connectors.some(({ type }) => type === filters.connector));
    });
  }, [catalog, deferredQuery, filters]);
  const selected = filtered.find(({ id }) => id === selectedId);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  function resetFilters() {
    setFilters(emptyFilters);
    setQuery("");
  }

  function showNotice(message: string, ok = true) {
    clearTimeout(noticeTimer.current);
    setNotice({ message, ok });
    noticeTimer.current = setTimeout(() => setNotice(undefined), 5500);
  }

  function select(id: string, source: CatalogView | "list", pointer = false) {
    setSelectedId(id);
    setSelectionOpened(true);
    setMapFocus(source === "map" ? undefined : { id, smooth: source === "list" && pointer });
    if (source === "map" && window.matchMedia("(min-width: 801px)").matches) {
      const list = listRef.current;
      const row = list?.querySelector<HTMLElement>(`[data-station="${id}"]`);
      if (list && row) {
        const delta = row.getBoundingClientRect().top - list.getBoundingClientRect().top;
        if (delta < 0 || delta + row.offsetHeight > list.clientHeight) list.scrollTop += delta;
      }
    }
    if (window.matchMedia("(max-width: 800px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "nearest" }));
    }
  }

  function finishSave(result: ActionResult) {
    resetFilters();
    setSelectedId(result.id);
    setSelectionOpened(true);
    setMapFocus(result.id ? { id: result.id, smooth: false } : undefined);
    setPanel(undefined);
    showNotice(result.message);
  }

  function closeAccess() {
    startLock(async () => {
      try {
        const result = await lockDemo();
        showNotice(result.message, result.ok);
      } catch {
        showNotice("Не удалось закрыть режим демо. Повторите попытку.", false);
      }
    });
  }

  const detail = (
    <div ref={detailRef} className="catalog-details" data-suggested={!selectionOpened}>
      {selected ? <StationDetail station={selected} canEdit={canEdit}
        onClose={() => { setSelectedId(undefined); setMapFocus(undefined); }}
        onEdit={() => setPanel({ kind: "edit", station: selected })}
        onDelete={() => setPanel({ kind: "delete", station: selected })} /> : null}
    </div>
  );

  return (
    <div className="shell catalog-page">
      <div className="page-heading">
        <div><h1>Станции</h1><p>Демонстрационный каталог зарядных станций Алматы.</p></div>
        <div className="catalog-actions">
          {canEdit ? <>
            <button className="button button-outlined" type="button" onClick={closeAccess} disabled={pendingLock}>
              <UnlockKeyhole size={16} aria-hidden /> Выйти из демо
            </button>
            <button className="button button-primary" type="button" onClick={() => setPanel({ kind: "create" })}>
              <Plus size={18} aria-hidden /> Добавить станцию
            </button>
          </> : <button className="button button-outlined" type="button" onClick={() => setPanel({ kind: "access" })}>
            <LockKeyhole size={16} aria-hidden /> Режим демо
          </button>}
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search size={19} aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" aria-label="Название или адрес"
            placeholder="Название или адрес" />
          {query ? <button type="button" className="icon-button search-clear" aria-label="Очистить поиск" onClick={() => setQuery("")}><X size={17} aria-hidden /></button> : null}
        </div>
        <div className="catalog-filters">
          {(Object.keys(filterOptions) as Filter[]).map((name) => {
            const { label, options } = filterOptions[name];
            return (
              <div className="filter-select" key={name} data-active={Boolean(filters[name])}>
                <select value={filters[name]} aria-label={label}
                  onChange={(event) => { const value = event.target.value; setFilters((current) => ({ ...current, [name]: value })); }}>
                  <option value="">{label}</option>
                  {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                </select>
                <ChevronDown size={15} aria-hidden />
              </div>
            );
          })}
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div ref={viewRef} className="catalog-view">
        <div className="catalog-workspace" hidden={view !== "map"}>
          <div className="catalog-map">
            <ChargingMap stations={filtered} selectedId={selected?.id} mapFocus={mapFocus} visible={view === "map"}
              onSelect={(id) => select(id, "map")} />
            {view === "map" ? detail : null}
          </div>
          <StationList stations={filtered} selectedId={selected?.id} onSelect={(id, pointer) => select(id, "list", pointer)}
            filtering={filtering} onReset={resetFilters} listRef={listRef} />
        </div>
        {view === "table" ? (
          <div className="table-workspace">
            {selected ? detail : null}
            <div className="table-results">
              <div className="list-heading">
                <span aria-live="polite">{stationCount(filtered.length)}</span>
                {filtering ? <button type="button" className="plain-button" onClick={resetFilters}>Сбросить</button> : null}
              </div>
              {filtered.length ? <StationTable stations={filtered} selectedId={selected?.id} onSelect={(id) => select(id, "table")} />
                : <EmptyCatalog filtering={filtering} onReset={resetFilters} />}
            </div>
          </div>
        ) : null}
      </div>

      {panel?.kind === "access" ? <UnlockDialog onClose={() => setPanel(undefined)}
        onUnlocked={(message) => { setPanel(undefined); showNotice(message); }} /> : null}
      {panel?.kind === "create" || panel?.kind === "edit" ? <StationForm operators={operators}
        station={panel.kind === "edit" ? panel.station : undefined} onClose={() => setPanel(undefined)} onSaved={finishSave} /> : null}
      {panel?.kind === "delete" ? <DeleteDialog station={panel.station} onClose={() => setPanel(undefined)}
        onDeleted={(message) => { setSelectedId(undefined); setMapFocus(undefined); setPanel(undefined); showNotice(message); }} /> : null}

      <div className="notice-region" role="status">
        <AnimatePresence>
          {notice ? <motion.div className={`notice${notice.ok ? "" : " notice-error"}`}
            initial={{ opacity: 0, transform: reduce ? "none" : "translateY(5px)" }}
            animate={{ opacity: 1, transform: "none" }}
            exit={{ opacity: 0, transform: reduce ? "none" : "translateY(5px)", pointerEvents: "none",
              transition: { duration: 0.12, ease: easeOut } }}
            transition={{ duration: reduce ? 0.1 : 0.18, ease: easeOut }}>
            {notice.ok ? <Check size={18} aria-hidden /> : null}<span>{notice.message}</span>
            <button type="button" className="icon-button" aria-label="Закрыть уведомление" onClick={() => setNotice(undefined)}><X size={16} aria-hidden /></button>
          </motion.div> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
