import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { connection } from "next/server";
import { HomeMap } from "@/components/home-map";
import { Metrics } from "@/components/metrics";
import { analyzeCatalog, listStations } from "@/db/queries";
import { formatNumber, maxPower } from "@/lib/catalog";

export default async function HomePage() {
  await connection();
  const catalog = await listStations();
  const stats = analyzeCatalog(catalog);

  return (
    <div className="shell home-page">
      <section className="hero" aria-labelledby="hero-title">
        <picture className="hero-photo">
          <source media="(max-width: 640px)" srcSet="/images/almaty-charge-mobile.webp" />
          <Image src="/images/almaty-charge-wide.webp" alt="Электромобиль у зарядной станции на фоне гор Алматы"
            fill unoptimized loading="eager" fetchPriority="high" sizes="100vw" />
        </picture>
        <div className="hero-shade" aria-hidden />
        <div className="hero-content">
          <h1 id="hero-title">Зарядная<br className="mobile-break" /> сеть<br className="desktop-break" /> Алматы</h1>
          <p>Найдите станции рядом и сравните мощность, разъёмы и тарифы перед поездкой.</p>
          <Link className="button button-primary hero-cta" href="/stations">
            Найти зарядную станцию <ArrowRight size={20} aria-hidden />
          </Link>
          <span className="hero-note">Демонстрационные данные</span>
        </div>
      </section>

      <section aria-label="Зарядная сеть в цифрах" className="home-metrics">
        <Metrics items={[
          { value: formatNumber(stats.total), label: "Станций в каталоге" },
          { value: formatNumber(stats.coveredDistricts), label: "Районов Алматы" },
          { value: formatNumber(stats.totalConnectors), label: "Зарядных разъёмов" },
          { value: <>{formatNumber(stats.peak)} <small>кВт</small></>, label: "Максимальная мощность" },
        ]} />
      </section>

      <section className="home-network" aria-labelledby="network-title">
        <div className="section-heading">
          <div>
            <h2 id="network-title">На карте города</h2>
            <p>Выберите станцию, чтобы посмотреть её параметры.</p>
          </div>
          <Link className="text-link" href="/stations">Весь каталог <ArrowUpRight size={18} aria-hidden /></Link>
        </div>
        <HomeMap stations={catalog.map(({ id, name, latitude, longitude, status, district, address, connectors }) => ({
          id, name, latitude, longitude, status, district, address, power: maxPower({ connectors }),
          plugTypes: [...new Set(connectors.map(({ type }) => type))].join(" / "),
        }))} />
      </section>
    </div>
  );
}
