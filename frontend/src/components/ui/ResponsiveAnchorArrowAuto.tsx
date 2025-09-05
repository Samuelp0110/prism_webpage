import { useEffect, useMemo, useState } from "react";
import Xarrow, { useXarrow } from "react-xarrows";

type Dir = "top" | "right" | "bottom" | "left" | "center";
type PathKind = "smooth" | "straight";

const anchorId = (base: string, dir: Dir) =>
  dir === "center" ? base : `${base}--${dir}`;

type Relation = { startDir: Dir; endDir: Dir; path: PathKind };

function pickRelation(a: DOMRect, b: DOMRect): Relation {
  const vTol = Math.min(a.height, b.height) * 0.6; // tolerance for "same row"
  const sameRow = Math.abs(a.top - b.top) < vTol;

  if (sameRow) {
    return b.left >= a.left
      ? { startDir: "right", endDir: "left", path: "smooth" }
      : { startDir: "left", endDir: "right", path: "smooth" };
  }
  // wrapped to another row
  return b.top > a.top
    ? { startDir: "bottom", endDir: "top", path: "smooth" }
    : { startDir: "top", endDir: "bottom", path: "smooth" };
}

// ---- helpers ---------------------------------------------------------------

type ScrollTarget = Element | Window;

/** All scrollable ancestors (plus window) to listen for scroll-driven layout shifts. */
function getScrollParents(el: Element | null): Set<ScrollTarget> {
  const out = new Set<ScrollTarget>();
  let node: Element | null = el;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node as HTMLElement);
    if (
      /(auto|scroll|overlay)/.test(style.overflowY) ||
      /(auto|scroll|overlay)/.test(style.overflowX)
    ) {
      out.add(node);
    }
    node = node.parentElement;
  }
  out.add(window);
  return out;
}

/** Lowest common ancestor element (helps catch flex-wrap container resizes). */
function lowestCommonAncestor(
  a: Element | null,
  b: Element | null
): Element | null {
  if (!a || !b) return null;
  const ancestors = new Set<Element>();
  let cur: Element | null = a;
  while (cur) {
    ancestors.add(cur);
    cur = cur.parentElement;
  }
  cur = b;
  while (cur) {
    if (ancestors.has(cur)) return cur;
    cur = cur.parentElement;
  }
  return document.body;
}

// ---- component -------------------------------------------------------------

export default function ResponsiveAnchorArrowAuto({
  startBase,
  endBase,
  color = "#394368",
  strokeWidth = 2.5,
  headSize = 6,
}: {
  /** base id of the start node's outer circle (e.g. "wf-2") */
  startBase: string;
  /** base id of the end node's outer circle (e.g. "wf-3") */
  endBase: string;
  color?: string;
  strokeWidth?: number;
  headSize?: number;
}) {
  const update = useXarrow();

  const [ids, setIds] = useState<{
    start: string;
    end: string;
    path: PathKind;
  }>({ start: startBase, end: endBase, path: "smooth" });

  // rAF-throttled recompute so rapid events don't spam updates
  const recalc = useMemo(() => {
    let raf = 0;
    const run = () => {
      const startEl = document.getElementById(startBase);
      const endEl = document.getElementById(endBase);
      if (!startEl || !endEl) return;

      const a = startEl.getBoundingClientRect();
      const b = endEl.getBoundingClientRect();
      const rel = pickRelation(a, b);

      setIds({
        start: anchorId(startBase, rel.startDir),
        end: anchorId(endBase, rel.endDir),
        path: rel.path,
      });

      update();
    };

    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        run();
      });
    };
  }, [startBase, endBase, update]);

  useEffect(() => {
    const startEl = document.getElementById(startBase);
    const endEl = document.getElementById(endBase);

    // Observe both elements for size changes
    const ros: ResizeObserver[] = [];
    const observe = (el: Element | null) => {
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => recalc());
      ro.observe(el);
      ros.push(ro);
    };

    observe(startEl);
    observe(endEl);

    // Observe their lowest common ancestor (often the flex container)
    observe(lowestCommonAncestor(startEl, endEl));

    // window resize/orientation
    const onResize = () => recalc();
    window.addEventListener("resize", onResize, { passive: true });

    // listen to scroll on all scrollable ancestors (and window)
    const scrollTargets = new Set<ScrollTarget>([
      ...getScrollParents(startEl),
      ...getScrollParents(endEl),
    ]);
    const onScroll = () => recalc();
    scrollTargets.forEach((t) =>
      t.addEventListener("scroll", onScroll, { passive: true })
    );

    // fonts can reflow later
    document.fonts?.ready.then(() => recalc());

    // initial + slight delayed kicks
    recalc();
    const t0 = window.setTimeout(recalc, 0);
    const t1 = window.setTimeout(recalc, 200);

    return () => {
      ros.forEach((r) => r.disconnect());
      window.removeEventListener("resize", onResize);
      scrollTargets.forEach((t) => t.removeEventListener("scroll", onScroll));
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [recalc, startBase, endBase]);

  return (
    <Xarrow
      start={ids.start}
      end={ids.end}
      startAnchor='middle'
      endAnchor='middle'
      path={ids.path} // "smooth" in both cases per your current choice
      curveness={0.55}
      color={color}
      strokeWidth={strokeWidth}
      headSize={headSize}
      zIndex={50}
    />
  );
}
