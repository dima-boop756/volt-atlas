"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSurfaceTransition } from "@/lib/ui-motion";

export function RouteMain({ children }: { children: ReactNode }) {
  const ref = useSurfaceTransition<HTMLElement>(usePathname(), 130);
  return <main id="main" ref={ref}>{children}</main>;
}
