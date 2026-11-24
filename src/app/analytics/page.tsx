import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, LayoutList } from "lucide-react";
import { connection } from "next/server";
import { analyzeCatalog, listStations } from "@/db/queries";
import { Metrics } from "@/components/metrics";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { formatNumber } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Аналитика",
  description: "Данные о районах, разъёмах, мощности и статусах зарядных станций демонстрационной сети Алматы.",
};

export default async function AnalyticsPage() {
  await connection();
  const stats = analyzeCatalog(await listStations());

  return (
    <div className="shell analytics-page">
      <div className="page-heading">
        <div><h1>Аналитика сети</h1><p>Районы, разъёмы, мощность и статусы демонстрационных станций.</p></div>
        <Link href="/stations" className="button button-outlined analytics-link">
          <LayoutList size={17} aria-hidden /> Каталог станций <ArrowUpRight size={15} aria-hidden />
        </Link>
      </div>

      <section className="analytics-metrics" aria-label="Сводка по сети">
        <Metrics items={[
          { value: formatNumber(stats.total), label: "Всего станций" },
          { value: formatNumber(stats.active), label: "Действующих станций" },
          { value: formatNumber(stats.totalConnectors), label: "Зарядных разъёмов" },
          { value: stats.total ? <>{formatNumber(stats.averageMax)} <small>кВт</small></> : "—", label: "Средняя макс. мощность" },
        ]} />
      </section>

      <AnalyticsCharts stats={stats} />
    </div>
  );
}
