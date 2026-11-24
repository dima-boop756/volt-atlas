"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelectionIndicator } from "@/lib/ui-motion";

const pages = [
  { href: "/", title: "Обзор" },
  { href: "/stations", title: "Станции" },
  { href: "/analytics", title: "Аналитика" },
];

export function MainNavigation() {
  const pathname = usePathname();
  const { group, indicator } = useSelectionIndicator<HTMLElement>(pathname, '[aria-current="page"]');
  return (
    <nav ref={group} className="main-nav" aria-label="Основная навигация">
      {pages.map(({ href, title }) => (
        <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}>{title}</Link>
      ))}
      <span ref={indicator} className="nav-indicator" aria-hidden="true" />
    </nav>
  );
}
