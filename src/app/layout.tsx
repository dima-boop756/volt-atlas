import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { RouteMain } from "@/components/route-main";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "VOLT Atlas — зарядная сеть Алматы", template: "%s — VOLT Atlas" },
  description: "Демонстрационный каталог зарядных станций Алматы с картой, фильтрами и аналитикой сети.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <a className="skip-link" href="#main">Перейти к содержимому</a>
        <SiteHeader />
        <RouteMain>{children}</RouteMain>
        <SiteFooter />
      </body>
    </html>
  );
}
