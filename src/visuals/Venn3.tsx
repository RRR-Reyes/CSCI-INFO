import { useMemo, useState } from "react";
import { split, Stage } from "./Stage";
import { MathStr, RegionLabel } from "./mathText";
import { H, inSet, label, LAYOUT, order, REGION_COLOR, regionColor, regions, REST_OPACITY, SET_COLOR, W } from "./vennShared";
import type { N } from "./vennShared";

/** A selection is a bitmask over regions: bit c set when region c is chosen. */
const SEL_OPACITY = 0.9;

/** Mask of regions where pred holds, given each set's membership. */
const maskOf = (n: N, pred: (...m: boolean[]) => boolean) =>
  regions(n).reduce((m, c) => (pred(...LAYOUT[n].letters.map((_, k) => inSet(n, c, k))) ? m | (1 << c) : m), 0);

/** Every expression up to three operations, grouped by the regions it covers. */
function buildNames(n: N) {
  const full = (1 << (1 << n)) - 1;
  const map = new Map<number, string[]>();
  const add = (s: string, m: number) => {
    const list = map.get(m) ?? [];
    if (!list.includes(s)) list.push(s);
    map.set(m, list);
  };
  const base: [string, number][] = LAYOUT[n].letters.map((L, k) => [L, maskOf(n, (...m) => m[k])]);
  const atoms: [string, number][] = [...base, ...base.map(([L, m]): [string, number] => [`${L}ᶜ`, ~m & full])];
  const ops: [string, (a: number, b: number) => number, boolean][] = [
    ["∪", (a, b) => a | b, true],
    ["∩", (a, b) => a & b, true],
    ["−", (a, b) => a & ~b & full, false],
    ["⊕", (a, b) => a ^ b, true],
  ];
  add("U", full);
  add("∅", 0);
  atoms.forEach(([s, m]) => add(s, m));
  const pairs: [string, number][] = [];
  atoms.forEach(([xs, xm], i) =>
    atoms.forEach(([ys, ym], j) => {
      if (i === j || xs[0] === ys[0]) return;
      ops.forEach(([o, f, comm]) => {
        if (comm && j < i) return;
        const s = `${xs} ${o} ${ys}`;
        add(s, f(xm, ym));
        pairs.push([s, f(xm, ym)]);
      });
    })
  );
  pairs.forEach(([xs, xm]) =>
    atoms.forEach(([ys, ym]) => {
      if (xs.includes(ys[0])) return;
      ops.forEach(([o, f, comm]) => {
        // Chains of one associative operator need no parentheses: A ∩ B ∩ C.
        const parts = xs.split(` ${o} `);
        if (comm && parts.length === 2 && !/[∪∩−⊕]/.test(parts.join(""))) {
          add([...parts, ys].sort().join(` ${o} `), f(xm, ym));
        }
        add(`${ys} ${o} (${xs})`, f(ym, xm));
        if (!comm) add(`(${xs}) ${o} ${ys}`, f(xm, ym));
      });
    })
  );
  const comps = (t: string) => (t.match(/ᶜ/g) ?? []).length;
  map.forEach((list) => list.sort((a, b) => a.length - b.length || comps(a) - comps(b)));
  return map;
}

const PRESETS: Record<N, [string, (...m: boolean[]) => boolean][]> = {
  2: [
    ["A ∩ B", (a, b) => a && b],
    ["A ∪ B", (a, b) => a || b],
    ["A − B", (a, b) => a && !b],
    ["A ⊕ B", (a, b) => a !== b],
    ["(A ∪ B)ᶜ", (a, b) => !a && !b],
  ],
  3: [
    ["A ∩ B", (a, b) => a && b],
    ["A − (B ∪ C)", (a, b, c) => a && !b && !c],
    ["(A ∩ B) ∪ C", (a, b, c) => (a && b) || c],
    ["A ⊕ B", (a, b) => a !== b],
    ["(A ∪ B ∪ C)ᶜ", (a, b, c) => !a && !b && !c],
  ],
};

const forms = (n: N, c: number) => {
  const ls = LAYOUT[n].letters;
  return {
    minterm: ls.map((L, k) => (inSet(n, c, k) ? L : `${L}ᶜ`)).join(" ∩ "),
    logic: ls.map((L, k) => (inSet(n, c, k) ? L : `¬${L}`)).join(" ∧ "),
  };
};
const join = (parts: string[], sep: string) => (parts.length > 1 ? parts.map((p) => `(${p})`) : parts).join(sep);

/** Click regions of a 2- or 3-set Venn diagram to see every way to write the selection. */
function Venn3() {
  const [n, setN] = useState<N>(3);
  const [sel, setSel] = useState<number[]>([]);
  const names = useMemo(() => ({ 2: buildNames(2), 3: buildNames(3) }), []);
  const { letters, circles, r, labels } = LAYOUT[n];
  const ORDER = order(n);

  const isSel = (c: number) => sel.includes(c);
  const mask = sel.reduce((m, c) => m | (1 << c), 0);
  const chosen = ORDER.filter(isSel);
  const ways = (names[n].get(mask) ?? []).slice(0, 7);

  const switchTo = (next: N) => {
    if (next === n) return;
    setN(next);
    setSel([]);
  };
  const toggle = (c: number) => setSel(isSel(c) ? sel.filter((x) => x !== c) : [...sel, c]);
  const fromMask = (m: number) => setSel(regions(n).filter((c) => m & (1 << c)));

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const y = ((e.clientY - box.top) / box.height) * H;
    if (x < 10 || x > W - 10 || y < 10 || y > H - 10) return;
    toggle(circles.reduce((c, [cx, cy], k) => (Math.hypot(x - cx, y - cy) <= r ? c | (1 << (n - 1 - k)) : c), 0));
  };

  const id = (s: string) => `v${n}${s}`;

  /** A region = inside every set it names (nested clips), outside the rest (one mask). */
  const region = (c: number) => {
    const ins = letters.map((_, k) => k).filter((k) => inSet(n, c, k));
    const outs = letters.map((_, k) => k).filter((k) => !inSet(n, c, k));
    // At rest a region shows a faint wash of its color; selected, the same color at full strength.
    const box = c === 0 ? { x: 10, y: 10, width: W - 20, height: H - 20, rx: 18 } : { width: W, height: H };
    const rest = c === 0 ? 0 : REST_OPACITY;
    let el = (
      <rect
        className="region"
        {...box}
        mask={outs.length ? `url(#${id("n" + outs.join(""))})` : undefined}
        style={{ fill: REGION_COLOR[ins.join("")], fillOpacity: isSel(c) ? SEL_OPACITY : rest }}
      />
    );
    ins.forEach((k) => (el = <g clipPath={`url(#${id("c" + k)})`}>{el}</g>));
    return <g key={c}>{el}</g>;
  };
  const outSets = regions(n).map((c) => letters.map((_, k) => k).filter((k) => !inSet(n, c, k))).filter((o) => o.length);

  return (
    <div className="viz viz-venn3 lab">
      <div className="seg venn-tabs" role="tablist" aria-label="Number of sets">
        {([2, 3] as const).map((k) => (
          <button key={k} role="tab" aria-selected={n === k} className={n === k ? "is-on" : ""} onClick={() => switchTo(k)}>
            {k} circles
          </button>
        ))}
      </div>
      <div className="viz-row viz-chips">
        <span className="lab-k">Try</span>
        {PRESETS[n].map(([text, pred]) => {
          const m = maskOf(n, pred);
          return (
            <button key={text} className={`chip chip-sm venn-expr ${mask === m ? "is-on" : ""}`} onClick={() => fromMask(m)}><span className="ie-math"><MathStr text={text} /></span></button>
          );
        })}
        <button className="chip chip-sm venn-clear" onClick={() => setSel([])}>Clear</button>
      </div>
      <div className="viz-row viz-chips" role="group" aria-label="Regions">
        <span className="lab-k">Regions</span>
        {ORDER.map((c) => (
          <button key={c} className={`chip chip-sm ${isSel(c) ? "is-on" : ""}`} aria-pressed={isSel(c)} onClick={() => toggle(c)}><i className="card-swatch" style={{ background: regionColor(n, c) }} /><RegionLabel text={label(n, c)} /></button>
        ))}
      </div>

      <Stage>
      <svg viewBox={`0 0 ${W} ${H}`} className="venn-svg venn3-svg" onClick={onClick} role="img" aria-label={`${n}-set Venn diagram; click regions to select them`}>
        <defs>
          {circles.map(([cx, cy], k) => (
            <clipPath key={k} id={id("c" + k)}><circle cx={cx} cy={cy} r={r} /></clipPath>
          ))}
          {outSets.map((out) => (
            <mask key={out.join("")} id={id("n" + out.join(""))}>
              <rect width={W} height={H} fill="white" />
              {out.map((k) => <circle key={k} cx={circles[k][0]} cy={circles[k][1]} r={r} fill="black" />)}
            </mask>
          ))}
        </defs>
        <rect x="10" y="10" width={W - 20} height={H - 20} rx="18" className="venn-universe" />
        {regions(n).map(region)}
        {circles.map(([cx, cy], k) => (
          <circle key={k} cx={cx} cy={cy} r={r} className="venn-ring" style={{ stroke: SET_COLOR[k] }} />
        ))}
        {labels.map(([x, y], k) => (
          <text key={k} x={x} y={y} className="venn-label" style={{ fill: SET_COLOR[k] }}>{letters[k]}</text>
        ))}
        <text x="26" y={H - 22} className="venn-u">U</text>
      </svg>

      <div className="venn-out" aria-live="polite">
        {chosen.length === 0 ? (
          <p>Click any region of the diagram, or a region chip, to see every way to write it.</p>
        ) : (
          <>
            <div>
              <span className="venn-out-k">Ways to write it</span>
              <div className="venn-ways">
                {(ways.length ? ways : ["No short name: use the region form"]).map((w) => <span key={w} className="venn-expr pop"><MathStr text={w} /></span>)}
              </div>
            </div>
            <dl className="venn-forms">
              <dt>Regions</dt><dd className="venn-expr"><MathStr text={join(chosen.map((c) => forms(n, c).minterm), " ∪ ")} /></dd>
              <dt>Logic</dt><dd className="venn-expr"><MathStr text={join(chosen.map((c) => forms(n, c).logic), " ∨ ")} /></dd>
            </dl>
          </>
        )}
      </div>
      </Stage>
    </div>
  );
}

export default split(Venn3);
