/**
 * Unusual shapes for tile corners: curves of constant width, cusped roulettes,
 * fractals and other figures that rarely show up in a school geometry class.
 * Every shape is an SVG path in a 100 × 100 box, generated from its math.
 */
export type OddShape = { name: string; d: string; stroke?: boolean; evenodd?: boolean };

type P = [number, number];
const TAU = Math.PI * 2;

/** Samples a parametric curve. */
const sample = (f: (t: number) => P, t0: number, t1: number, steps = 360): P[] =>
  Array.from({ length: steps + 1 }, (_, i) => f(t0 + ((t1 - t0) * i) / steps));

/** Scales points uniformly into the box with a margin, centered, and joins them into a path. */
function fit(pts: P[], close = true, pad = 8): string {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = (100 - pad * 2) / Math.max(x1 - x0 || 1, y1 - y0 || 1);
  const ox = (100 - (x1 - x0) * s) / 2;
  const oy = (100 - (y1 - y0) * s) / 2;
  const f = (n: number) => n.toFixed(1);
  return pts.map((p, i) => `${i ? "L" : "M"}${f(ox + (p[0] - x0) * s)} ${f(oy + (y1 - p[1]) * s)}`).join("") + (close ? "Z" : "");
}

const polar = (r: (t: number) => number) => (t: number): P => [r(t) * Math.cos(t), r(t) * Math.sin(t)];

/** Turtle-style L-system, returning the visited points. */
function lsystem(axiom: string, rules: Record<string, string>, iters: number, angle: number, draw = "F"): P[] {
  let s = axiom;
  for (let i = 0; i < iters; i++) s = s.replace(/./g, (ch) => rules[ch] ?? ch);
  let [x, y, a] = [0, 0, 0];
  const pts: P[] = [[0, 0]];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (draw.includes(ch)) {
      x += Math.cos(a);
      y += Math.sin(a);
      pts.push([x, y]);
    } else if (ch === "+") a += angle;
    else if (ch === "-") a -= angle;
  }
  return pts;
}

/** A Reuleaux polygon: each side is an arc centered on the opposite vertex, so its width is constant. */
function reuleaux(k: number): string {
  const R = 40;
  const v: P[] = Array.from({ length: k }, (_, i) => {
    const a = -Math.PI / 2 + (TAU * i) / k;
    return [50 + R * Math.cos(a), 52 + R * Math.sin(a)];
  });
  const d = Math.hypot(v[0][0] - v[Math.floor(k / 2)][0], v[0][1] - v[Math.floor(k / 2)][1]);
  const f = (n: number) => n.toFixed(1);
  return `M${f(v[0][0])} ${f(v[0][1])}` + v.map((_, i) => {
    const q = v[(i + 1) % k];
    return `A${f(d)} ${f(d)} 0 0 1 ${f(q[0])} ${f(q[1])}`;
  }).join("") + "Z";
}

function superformula(m: number, n1: number, n2: number, n3: number) {
  return polar((t) => {
    const c = Math.abs(Math.cos((m * t) / 4)) ** n2;
    const s = Math.abs(Math.sin((m * t) / 4)) ** n3;
    return (c + s) ** (-1 / n1);
  });
}

export const ODD_SHAPES: OddShape[] = [
  { name: "Reuleaux triangle", d: reuleaux(3) },
  { name: "Astroid", d: fit(sample((t) => [Math.cos(t) ** 3, Math.sin(t) ** 3], 0, TAU)) },
  { name: "Squircle (superellipse)", d: fit(sample((t) => [Math.sign(Math.cos(t)) * Math.abs(Math.cos(t)) ** 0.5, Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** 0.5], 0, TAU)) },
  { name: "Deltoid", d: fit(sample((t) => [2 * Math.cos(t) + Math.cos(2 * t), 2 * Math.sin(t) - Math.sin(2 * t)], 0, TAU)) },
  { name: "Lissajous curve 3:2", d: fit(sample((t) => [Math.sin(3 * t + Math.PI / 2), Math.sin(2 * t)], 0, TAU, 500)), stroke: true },
  { name: "Cardioid", d: fit(sample(polar((t) => 1 - Math.cos(t)), 0, TAU)) },
  { name: "Koch snowflake", d: fit(lsystem("F--F--F", { F: "F+F--F+F" }, 3, Math.PI / 3)) },
  { name: "Lemniscate of Bernoulli", d: fit(sample((t) => [Math.cos(t) / (1 + Math.sin(t) ** 2), (Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) ** 2)], 0, TAU)), evenodd: true },
  { name: "Heptagram {7/3}", d: fit(Array.from({ length: 7 }, (_, i): P => [Math.sin((TAU * 3 * i) / 7), Math.cos((TAU * 3 * i) / 7)])) },
  { name: "Arbelos", d: "M8 70A42 42 0 0 1 92 70A16 16 0 0 0 60 70A26 26 0 0 0 8 70Z" },
  { name: "Rose curve r = cos 5θ", d: fit(sample(polar((t) => Math.cos(5 * t)), 0, Math.PI, 600)) },
  { name: "Dragon curve", d: fit(lsystem("FX", { X: "X+YF+", Y: "-FX-Y" }, 8, Math.PI / 2), false), stroke: true },
  { name: "Nephroid", d: fit(sample((t) => [3 * Math.cos(t) - Math.cos(3 * t), 3 * Math.sin(t) - Math.sin(3 * t)], 0, TAU)) },
  { name: "Lune of Hippocrates", d: "M50 12A38 38 0 0 1 50 88A54 54 0 0 0 50 12Z" },
  { name: "Superformula (Gielis)", d: fit(sample(superformula(7, 0.6, 1.4, 1.4), 0, TAU, 720)) },
  { name: "Hypotrochoid (spirograph)", d: fit(sample((t) => [2 * Math.cos(t) + 5 * Math.cos((2 * t) / 3), 2 * Math.sin(t) - 5 * Math.sin((2 * t) / 3)], 0, 3 * TAU, 900)), stroke: true },
  { name: "Reuleaux pentagon", d: reuleaux(5) },
  { name: "Hilbert curve", d: fit(lsystem("A", { A: "+BF-AFA-FB+", B: "-AF+BFB+FA-" }, 3, Math.PI / 2), false), stroke: true },
  { name: "Vesica piscis", d: "M50 15.4A40 40 0 0 1 50 84.6A40 40 0 0 1 50 15.4Z" },
  { name: "Trefoil knot", d: fit(sample((t) => [Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t)], 0, TAU, 500)), stroke: true },
  { name: "Epicycloid, 5 cusps", d: fit(sample((t) => [6 * Math.cos(t) - Math.cos(6 * t), 6 * Math.sin(t) - Math.sin(6 * t)], 0, TAU, 600)) },
  { name: "Sierpiński arrowhead", d: fit(lsystem("A", { A: "B-A-B", B: "A+B+A" }, 5, Math.PI / 3, "AB"), false), stroke: true },
  { name: "Butterfly curve", d: fit(sample(polar((t) => Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.sin((2 * t - Math.PI) / 24) ** 5), 0, 12 * Math.PI, 2400)), stroke: true },
  { name: "Bicorn", d: fit(sample((t) => [Math.sin(t), (Math.cos(t) ** 2 * (2 + Math.cos(t))) / (3 + Math.sin(t) ** 2)], 0, TAU)) },
  { name: "Fermat spiral", d: fit(sample((t) => { const r = Math.sqrt(Math.abs(t)) * Math.sign(t); return [r * Math.cos(t), r * Math.sin(t)]; }, -6 * Math.PI, 6 * Math.PI, 900), false), stroke: true },
  { name: "Golden spiral", d: fit(sample(polar((t) => Math.pow(1.618, (2 * t) / Math.PI)), 0, 4 * Math.PI, 600), false), stroke: true },
];
