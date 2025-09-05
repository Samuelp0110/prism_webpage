import { useEffect, useState } from "react";

export type BP = "base" | "sm" | "md" | "lg" | "xl" | "2xl";

// Tailwind defaults (change if you've customized screens in your project)
const screens: Record<Exclude<BP, "base">, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export function useBreakpoint(): BP {
  const [bp, setBp] = useState<BP>("base");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return; // SSR / no matchMedia
    }

    // [("sm"|"md"|...), MediaQueryList][] sorted ascending
    const entries = (
      Object.entries(screens) as Array<[Exclude<BP, "base">, number]>
    )
      .sort((a, b) => a[1] - b[1])
      .map(([k, px]) => [k, window.matchMedia(`(min-width:${px}px)`)] as const);

    const compute = (): BP => {
      let current: BP = "base";
      for (const [k, mql] of entries) {
        if (mql.matches) current = k; // last matching = highest breakpoint
      }
      return current;
    };

    const update = () => setBp(compute());

    // Subscribe to media query changes (old Safari fallback included)
    const cleanups: Array<() => void> = [];
    for (const [, mql] of entries) {
      const handler = () => update();
      if ("addEventListener" in mql) {
        mql.addEventListener("change", handler);
        cleanups.push(() => mql.removeEventListener("change", handler));
      } else {
        // @ts-expect-error: legacy API in older Safari
        mql.addListener(handler);
        // @ts-expect-error: legacy API in older Safari
        cleanups.push(() => mql.removeListener(handler));
      }
    }

    update();
    return () => cleanups.forEach((off) => off());
  }, []);

  return bp;
}
