/**
 * Geometry, colors and region helpers shared by the 2- and 3-set Venn visuals.
 * Region code c has bit (n-1-k) set when it is inside set k (so for 3 sets:
 * 4 = A, 2 = B, 1 = C; 0 = outside all).
 */
export type N = 2 | 3;
export type Pt = readonly [number, number];

export const W = 500;
export const H = 410;

export interface Layout {
  letters: string[];
  circles: Pt[];
  r: number;
  labels: Pt[];
}

export const LAYOUT: Record<N, Layout> = {
  2: { letters: ["A", "B"], circles: [[195, 205], [305, 205]], r: 125, labels: [[70, 78], [416, 78]] },
  3: { letters: ["A", "B", "C"], circles: [[190, 165], [310, 165], [250, 265]], r: 110, labels: [[74, 66], [412, 66], [376, 372]] },
};

/** One hue per set so each circle reads at a glance. */
export const SET_COLOR = ["hsl(212 80% 48%)", "hsl(340 72% 52%)", "hsl(38 92% 46%)"];
/**
 * Each region gets one flat color (keyed by the sets it is in) instead of stacked
 * translucent layers, which mixed into mud. Overlaps use a bright hue between their
 * parents': blue + pink = violet, blue + amber = green, pink + amber = coral.
 */
export const REGION_COLOR: Record<string, string> = {
  "0": "hsl(210 95% 62%)",
  "1": "hsl(335 92% 66%)",
  "2": "hsl(42 100% 56%)",
  "01": "hsl(278 88% 70%)",
  "02": "hsl(140 70% 52%)",
  "12": "hsl(14 100% 64%)",
  "012": "hsl(190 92% 55%)",
  "": "hsl(250 35% 80%)",
};
export const REST_OPACITY = 0.16;

export const inSet = (n: N, c: number, k: number) => (c & (1 << (n - 1 - k))) !== 0;
export const regions = (n: N) => Array.from({ length: 1 << n }, (_, c) => c);
export const popcount = (c: number) => c.toString(2).replace(/0/g, "").length;
/** Most-overlapping regions first: center, pairs, singles, outside. */
export const order = (n: N) => regions(n).sort((a, b) => popcount(b) - popcount(a) || b - a);
/** Indices of the sets region c is inside of / outside of. */
export const insOf = (n: N, c: number) => LAYOUT[n].letters.map((_, k) => k).filter((k) => inSet(n, c, k));
export const outsOf = (n: N, c: number) => LAYOUT[n].letters.map((_, k) => k).filter((k) => !inSet(n, c, k));
export const regionColor = (n: N, c: number) => REGION_COLOR[insOf(n, c).join("")];

export function label(n: N, c: number) {
  const ins = LAYOUT[n].letters.filter((_, k) => inSet(n, c, k));
  if (ins.length === 0) return n === 2 ? "Outside both" : "Outside all";
  return ins.join(" ∩ ") + (ins.length < n ? " only" : "");
}

/** The region code at a point in diagram coordinates. */
export const regionAt = (n: N, x: number, y: number) => {
  const { circles, r } = LAYOUT[n];
  return circles.reduce((c, [cx, cy], k) => (Math.hypot(x - cx, y - cy) <= r ? c | (1 << (n - 1 - k)) : c), 0);
};

/** Converts a mouse event on the diagram's SVG into diagram coordinates. */
export const svgPoint = (e: React.MouseEvent<SVGSVGElement>) => {
  const box = e.currentTarget.getBoundingClientRect();
  return [((e.clientX - box.left) / box.width) * W, ((e.clientY - box.top) / box.height) * H] as const;
};
