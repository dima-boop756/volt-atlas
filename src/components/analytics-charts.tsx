"use client";

import { useLayoutEffect, useRef } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { CatalogAnalytics } from "@/db/queries";
import { formatNumber, statusLabels } from "@/lib/catalog";
import { easeOutCss, reduceMotion } from "@/lib/ui-motion";

const connectorColors = ["#c5f56b", "#82a77d", "#b7c9af", "#edf2db"];
const statusColors = { active: "#c5f56b", maintenance: "#8fac8b", offline: "#d3dbce" };
const districtColors = ["#244734", "#31553d", "#44694e", "#587b59", "#6d8e69", "#84a07d", "#99b292", "#adc3a6"];
const percentage = (count: number, total: number) => total ? (count / total) * 100 : 0;

// Written only after a browser commit, so revisiting analytics can show a real change.
let lastDisplayedStats: CatalogAnalytics | undefined;

function districtShares(items: CatalogAnalytics["districts"]) {
  const max = Math.max(1, ...items.map(({ count }) => count));
  return new Map<string, number>(items.map(({ label, count }) => [label, count / max]));
}

function DistrictChart({ items }: { items: CatalogAnalytics["districts"] }) {
  const shares = districtShares(items);
  return (
    <section className="chart-panel district-chart" aria-labelledby="district-chart-title">
      <div className="chart-title">
        <h2 id="district-chart-title">Станции по районам</h2>
        <p>Количество станций в каждом районе Алматы</p>
      </div>
      <ul className="district-bars">
        {items.map(({ label, count }, index) => (
          <li key={label}>
            <span>{label}</span>
            <span className="district-track" aria-hidden>
              <i data-district={label} style={{ transform: `scaleX(${shares.get(label)})`, background: districtColors[index] }} />
            </span>
            <strong>{formatNumber(count)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConnectorChart({ items, total }: { items: CatalogAnalytics["types"]; total: number }) {
  const data = total ? items : [{ label: "Нет данных", count: 1 }];
  return (
    <section className="chart-panel connector-chart" aria-labelledby="connector-chart-title">
      <div className="chart-title">
        <h2 id="connector-chart-title">Типы разъёмов</h2>
        <p>Доля каждого типа от общего числа разъёмов</p>
      </div>
      <div className="connector-visual">
        <div className="donut-space" data-chart="types" aria-hidden>
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 225, height: 225 }}>
            <PieChart accessibilityLayer={false}>
              <Pie data={data} dataKey="count" nameKey="label" innerRadius="65%" outerRadius="94%"
                startAngle={90} endAngle={-270} isAnimationActive={false} stroke="none">
                {data.map(({ label }, index) => <Cell key={label} fill={total ? connectorColors[index] : "#4d6355"} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-total"><strong>{formatNumber(total)}</strong><span>разъёмов</span></div>
        </div>
        <ul className="chart-legend">
          {items.map(({ label, count }, index) => <li key={label}>
            <i style={{ background: connectorColors[index] }} aria-hidden />
            <span><strong>{label}</strong><small>{formatNumber(count)} шт. · {formatNumber(percentage(count, total))}%</small></span>
          </li>)}
        </ul>
      </div>
    </section>
  );
}

function PowerChart({ items }: { items: CatalogAnalytics["power"] }) {
  return (
    <section className="chart-panel power-chart" aria-labelledby="power-chart-title">
      <div className="chart-title">
        <h2 id="power-chart-title">Мощность станций</h2>
        <p>По самому мощному разъёму каждой станции, кВт</p>
      </div>
      <ul className="sr-only">{items.map(({ label, count }) => <li key={label}>{label} кВт — {count}</li>)}</ul>
      <div className="power-visual" data-chart="power">
        <ResponsiveContainer width="100%" height={182} initialDimension={{ width: 480, height: 182 }}>
          <BarChart data={items} margin={{ left: 0, right: 2, top: 22, bottom: 0 }} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke="#dce2d8" strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#cbd4c9" }}
              tick={{ fill: "#46534b", fontSize: 12 }} tickMargin={9} interval={0} />
            <YAxis width={27} tickLine={false} axisLine={false} allowDecimals={false} tickCount={5}
              tick={{ fill: "#46534b", fontSize: 12 }} />
            <Tooltip cursor={{ fill: "#e6ebe2" }} formatter={(value) => [String(value), "Станций"]} labelFormatter={(label) => `${label} кВт`}
              contentStyle={{ border: "1px solid #cbd4c9", borderRadius: 6, background: "#f8f9f5" }} />
            <Bar dataKey="count" fill="#31553d" radius={[2, 2, 0, 0]} maxBarSize={74} isAnimationActive={false}>
              <LabelList dataKey="count" position="top" fill="#28352c" fontSize={13} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function StatusChart({ items, total }: { items: CatalogAnalytics["statuses"]; total: number }) {
  return (
    <section className="chart-panel status-chart" aria-labelledby="status-chart-title">
      <div className="chart-title">
        <h2 id="status-chart-title">Статусы станций</h2>
        <p>Распределение по статусам в каталоге</p>
      </div>
      <div className="status-track" data-chart="statuses" aria-hidden>
        {items.map(({ status, count }) => {
          const share = percentage(count, total);
          return count ? <div key={status} style={{ width: `${share}%`, background: statusColors[status] }}>
            {share >= 12 ? `${formatNumber(share)}%` : null}
          </div> : null;
        })}
      </div>
      <ul className="status-legend">
        {items.map(({ status, count }) => (
          <li key={status}>
            <i style={{ background: statusColors[status] }} aria-hidden />
            <span>{statusLabels[status]}</span>
            <strong>{formatNumber(count)}</strong>
            <span className="status-percent">{formatNumber(percentage(count, total))}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AnalyticsCharts({ stats }: { stats: CatalogAnalytics }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const previous = lastDisplayedStats;
    lastDisplayedStats = stats;
    const charts = root.current;
    if (!previous || !charts || reduceMotion()) return;

    const oldShares = districtShares(previous.districts);
    const newShares = districtShares(stats.districts);
    const timing = { duration: 180, easing: easeOutCss };
    const animations: Animation[] = [];

    for (const fill of charts.querySelectorAll<HTMLElement>("[data-district]")) {
      const district = fill.dataset.district ?? "";
      const from = oldShares.get(district) ?? 0;
      const to = newShares.get(district) ?? 0;
      if (from !== to) animations.push(fill.animate([
        { transform: `scaleX(${from})` }, { transform: `scaleX(${to})` },
      ], timing));
    }

    for (const series of ["types", "power", "statuses"] as const) {
      if (!stats[series].some(({ count }, index) => count !== previous[series][index]?.count)) continue;
      const plot = charts.querySelector<HTMLElement>(`[data-chart="${series}"]`);
      if (plot) animations.push(plot.animate([{ opacity: 0.88 }, { opacity: 1 }], timing));
    }

    return () => animations.forEach((animation) => animation.cancel());
  }, [stats]);

  return (
    <div ref={root} className="analytics-charts">
      <DistrictChart items={stats.districts} />
      <ConnectorChart items={stats.types} total={stats.totalConnectors} />
      <PowerChart items={stats.power} />
      <StatusChart items={stats.statuses} total={stats.total} />
    </div>
  );
}
