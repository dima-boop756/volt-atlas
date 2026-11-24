import Link from "next/link";
import { MapPin, Zap } from "lucide-react";
import { MainNavigation } from "./main-navigation";

function Wordmark() {
  return (
    <span className="wordmark">
      <span className="brand-icon"><Zap size={21} fill="currentColor" aria-hidden /></span>
      <span>VOLT<span className="brand-atlas"> Atlas</span></span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="shell site-header">
      <Link href="/" className="brand-link" aria-label="VOLT Atlas, обзор"><Wordmark /></Link>
      <MainNavigation />
      <span className="header-location"><MapPin size={17} aria-hidden /> Алматы, KZ</span>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="shell site-footer">
      <Link href="/" className="brand-link" aria-label="VOLT Atlas, обзор"><Wordmark /></Link>
      <p>Демонстрационный каталог. Данные вымышлены и не отражают работу реальных станций.</p>
      <span>Алматы, Казахстан</span>
    </footer>
  );
}
