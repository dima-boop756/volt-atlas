"use client";

import { useLayoutEffect, useRef } from "react";

export const easeOut = [0.23, 1, 0.32, 1] as const;
export const easeOutCss = `cubic-bezier(${easeOut.join(",")})`;

export function reduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useSurfaceTransition<T extends HTMLElement>(surface: string, duration: number) {
  const ref = useRef<T>(null);
  const previous = useRef(surface);

  useLayoutEffect(() => {
    if (previous.current === surface) return;
    previous.current = surface;
    if (reduceMotion()) return;

    const animation = ref.current?.animate([{ opacity: 0.92 }, { opacity: 1 }], {
      duration, easing: easeOutCss,
    });
    return () => animation?.cancel();
  }, [surface, duration]);

  return ref;
}

export function useSelectionIndicator<T extends HTMLElement>(selection: string, selector: string) {
  const group = useRef<T>(null);
  const indicator = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = group.current;
    const bar = indicator.current;
    if (!root || !bar) return;
    const active = root.querySelector<HTMLElement>(selector);
    if (!active) {
      delete root.dataset.indicatorReady;
      return;
    }

    function position() {
      if (!root || !bar || !active) return;
      const left = active.offsetLeft;
      const width = active.offsetWidth;
      bar.style.setProperty("--selection-left", `${left}px`);
      bar.style.setProperty("--selection-right", `${root.clientWidth - left - width}px`);
      bar.style.setProperty("--selection-scale", String(width / 64));
      root.dataset.indicatorReady = "true";
    }

    position();
    const resize = new ResizeObserver(position);
    resize.observe(root);
    resize.observe(active);
    return () => resize.disconnect();
  }, [selection, selector]);

  return { group, indicator };
}
