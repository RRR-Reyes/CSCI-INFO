import { Fragment, useMemo, useState } from "react";
import { split, Stage } from "./Stage";
import { H, inSet, insOf, LAYOUT, popcount, regionAt, regionColor, regions, REST_OPACITY, SET_COLOR, svgPoint, W } from "./vennShared";
import type { N, Pt } from "./vennShared";

/** Region code → the ids of the elements sitting in it, in the order they were added. */
type Elems = Record<number, number[]>;

const TOKEN_R = 13;
const SPACING = 30;
/** How far a token's center keeps from any circle edge, so it never straddles one. */
const EDGE = TOKEN_R + 3;

/**
 * Every spot a token can occupy in each region, nearest the region's middle first:
 * a hex grid filtered to points inside the region's circles and clear of the others.
 */
function buildSpots(n: N) {
  const { circles, r } = LAYOUT[n];
  const out: Record<number, Pt[]> = {};
  regions(n).filter((c) => c > 0).forEach((c) => {
    const pts: Pt[] = [];
    for (let row = 0, y = 20; y < H - 20; row++, y += SPACING * 0.866) {
      for (let x = 20 + (row % 2) * (SPACING / 2); x < W - 20; x += SPACING) {
        const ok = circles.every(([cx, cy], k) => {
          const d = Math.hypot(x - cx, y - cy);
          return inSet(n, c, k) ? d <= r - EDGE : d >= r + EDGE;
        });
        if (ok) pts.push([x, y]);
      }
    }
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    out[c] = pts.sort((a, b) => Math.hypot(a[0] - mx, a[1] - my) - Math.hypot(b[0] - mx, b[1] - my));
  });
  return out;
}

/** Inclusion–exclusion terms: every nonempty group of sets, singles first. Odd groups add, even subtract. */
function termsOf(n: N) {
  const groups = Array.from({ length: (1 << n) - 1 }, (_, i) => i + 1).sort((a, b) => {
    const pa = a.toString(2).replace(/0/g, "").length;
    const pb = b.toString(2).replace(/0/g, "").length;
    return pa - pb || b - a;
  });
  return groups.map((g) => {
    const sets = insOf(n, g);
    return { g, sets, label: `|${sets.map((k) => LAYOUT[n].letters[k]).join("∩")}|`, sign: sets.length % 2 ? 1 : -1 };
  });
}

const empty = (): Elems => ({});

/** A cardinality like |A ∩ B| with italic set letters and spaced operators. */
function Bars({ sets, op = "∩" }: { sets: string[]; op?: string }) {
  return (
    <>
      |{sets.map((L, i) => (
        <Fragment key={L}>{i > 0 && <span className="ie-setop">{op}</span>}<var>{L}</var></Fragment>
      ))}|
    </>
  );
}

/** Click to drop elements into regions and watch inclusion–exclusion rebuild the union; grow a set to see 2ⁿ subsets. */
function CardinalityLab() {
  const [n, setN] = useState<N>(3);
  const [elems, setElems] = useState<Elems>(empty);
  const [step, setStep] = useState(7);
  const [ps, setPs] = useState(3);

  const spots = useMemo(() => ({ 2: buildSpots(2), 3: buildSpots(3) }), []);
  const { letters, circles, r, labels } = LAYOUT[n];
  const terms = termsOf(n);
  const at = Math.min(step, terms.length);
  const inRegion = (c: number) => elems[c] ?? [];
  // Counters read singles first, then pairs, then the center: A only, B only, …, A ∩ B ∩ C.
  const live = regions(n).filter((c) => c > 0).sort((a, b) => popcount(a) - popcount(b) || b - a);

  // A group's term counts every element in a region that lies inside all of the group's sets.
  const value = (g: number) => live.reduce((t, c) => t + ((c & g) === g ? inRegion(c).length : 0), 0);
  const running = terms.slice(0, at).reduce((t, x) => t + x.sign * value(x.g), 0);
  const truth = live.reduce((t, c) => t + inRegion(c).length, 0);
  const current = terms[at - 1];

  const switchTo = (next: N) => {
    if (next === n) return;
    setN(next);
    setElems(empty());
    setStep(7);
  };

  /** Adds one element, numbered with the smallest id not already in use. */
  const add = (c: number) => {
    if (c === 0 || inRegion(c).length >= spots[n][c].length) return;
    const used = new Set(Object.values(elems).flat());
    let id = 1;
    while (used.has(id)) id++;
    setElems({ ...elems, [c]: [...inRegion(c), id] });
  };
  /** Removes a specific element, or the region's newest one. */
  const remove = (c: number, id?: number) => {
    const list = inRegion(c);
    if (!list.length) return;
    const drop = id ?? list[list.length - 1];
    setElems({ ...elems, [c]: list.filter((x) => x !== drop) });
  };

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => add(regionAt(n, ...svgPoint(e)));
  const onContextMenu = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    const token = (e.target as Element).closest<SVGGElement>("[data-id]");
    if (token) remove(Number(token.dataset.region), Number(token.dataset.id));
    else remove(regionAt(n, ...svgPoint(e)));
  };

  const letterSet = ["a", "b", "c", "d", "e"].slice(0, ps);
  const subsets = Array.from({ length: 1 << ps }, (_, m) => letterSet.filter((_, i) => m & (1 << i)))
    .sort((x, y) => x.length - y.length);

  return (
    <div className="viz viz-card lab">
      <div className="seg venn-tabs" role="tablist" aria-label="Number of sets">
        {([2, 3] as const).map((k) => (
          <button key={k} role="tab" aria-selected={n === k} className={n === k ? "is-on" : ""} onClick={() => switchTo(k)}>
            {k} circles
          </button>
        ))}
      </div>
      <div className="sq-actions">
        <button className="btn btn-soft" onClick={() => setStep(Math.max(1, at - 1))} disabled={at <= 1}>Back</button>
        <button className="btn" onClick={() => setStep(Math.min(terms.length, at + 1))} disabled={at >= terms.length}>Add next term</button>
        <span className={`card-status ${truth > 0 && at === terms.length ? "is-done" : ""}`}>
          {truth === 0 ? "Add elements to start counting" : at === terms.length ? <>Matches the <b>{truth}</b> elements in the diagram ✓</> : <><b>{terms.length - at}</b> {terms.length - at === 1 ? "term" : "terms"} to go</>}
        </span>
        <button className="chip chip-sm venn-clear" onClick={() => setElems(empty())} disabled={!truth}>Clear</button>
      </div>
      <div className="viz-row viz-chips">
        <span className="lab-k">Power set of</span>
        {[1, 2, 3, 4, 5].map((k) => (
          <button key={k} className={`chip chip-sm ${k === ps ? "is-on" : ""}`} onClick={() => setPs(k)}><span className="ie-math"><var>n</var> = {k}</span></button>
        ))}
      </div>

      <Stage>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="venn-svg venn3-svg card-venn2"
        onClick={onClick}
        onContextMenu={onContextMenu}
        role="img"
        aria-label={`${n}-set Venn diagram. Left click a region to add an element, right click to remove one.`}
      >
        <defs>
          {circles.map(([cx, cy], k) => (
            <clipPath key={k} id={`cl${n}c${k}`}><circle cx={cx} cy={cy} r={r} /></clipPath>
          ))}
          {live.map((c) => (
            <mask key={c} id={`cl${n}m${c}`}>
              <rect width={W} height={H} fill="white" />
              {circles.map(([cx, cy], k) => (!inSet(n, c, k) ? <circle key={k} cx={cx} cy={cy} r={r} fill="black" /> : null))}
            </mask>
          ))}
        </defs>
        <rect x="10" y="10" width={W - 20} height={H - 20} rx="18" className="venn-universe" />
        {/* Each region in its own color; the regions the current term counts are filled stronger. */}
        {live.map((c) => {
          let el = (
            <rect
              className="region"
              width={W}
              height={H}
              mask={`url(#cl${n}m${c})`}
              style={{ fill: regionColor(n, c), fillOpacity: current && (c & current.g) === current.g ? 0.55 : REST_OPACITY }}
            />
          );
          insOf(n, c).forEach((k) => (el = <g clipPath={`url(#cl${n}c${k})`}>{el}</g>));
          return <g key={c}>{el}</g>;
        })}
        {circles.map(([cx, cy], k) => (
          <circle
            key={k}
            cx={cx}
            cy={cy}
            r={r}
            className={`venn-ring ${current?.sets.includes(k) ? "is-term" : ""}`}
            style={{ stroke: SET_COLOR[k] }}
          />
        ))}
        {labels.map(([x, y], k) => (
          <text key={k} x={x} y={y} className="venn-label" style={{ fill: SET_COLOR[k] }}>{letters[k]}</text>
        ))}
        <text x="26" y={H - 22} className="venn-u">U</text>
        {live.flatMap((c) =>
          inRegion(c).map((id, i) => {
            const [x, y] = spots[n][c][i];
            return (
              <g key={`${n}-${id}`} className="card-token" data-id={id} data-region={c} style={{ transform: `translate(${x}px, ${y}px)` }}>
                <g className="card-token-pop">
                  <circle r={TOKEN_R} style={{ stroke: regionColor(n, c) }} />
                  <text dy="4.5">{id}</text>
                </g>
              </g>
            );
          })
        )}
        {truth === 0 && (
          <text x={W / 2} y={H - 22} className="card-empty-hint">Left click a region to add an element · right click to remove</text>
        )}
      </svg>

      {/* The equation reads as two rows: each term's name on top, its count underneath,
          with the + / − operators sitting between the counts. */}
      <div className="ie-eq" aria-live="polite">
        <span className="ie-eq-k">Inclusion–exclusion</span>
        <div className="ie-row">
          {terms.map((t, i) => (
            <Fragment key={t.g}>
              {i > 0 && <span className={`ie-op ${i < at ? "is-on" : ""}`}>{t.sign > 0 ? "+" : "−"}</span>}
              <span className={`ie-term2 ${t.sign > 0 ? "is-plus" : "is-minus"} ${i < at ? "is-on" : ""} ${i === at - 1 ? "is-current" : ""}`}>
                <span className="ie-name"><Bars sets={t.sets.map((k) => letters[k])} /></span>
                <span className="ie-val">{value(t.g)}</span>
              </span>
            </Fragment>
          ))}
          <span className="ie-op is-on">=</span>
          <span className="ie-term2 is-total">
            <span className="ie-name"><Bars sets={letters} op="∪" /></span>
            <span className="ie-val">{running}</span>
          </span>
        </div>
      </div>

      <div className="ps">
        <span className="ie-eq-k">Power set of <span className="ie-math">{`{${letterSet.join(", ")}}`}</span></span>
        <div className="ps-chips" key={ps}>
          {subsets.map((s, i) => (
            <span key={s.join("")} className="ie-math pop" style={{ animationDelay: `${i * 22}ms` }}>{s.length ? `{${s.join(", ")}}` : "∅"}</span>
          ))}
        </div>
        <p className="viz-readout">
          <span className="ie-math">|𝒫(S)| = 2<sup>{ps}</sup> = {1 << ps}</span>. Each element is either in a subset or out, so the count doubles per element.
        </p>
      </div>
      </Stage>
    </div>
  );
}

export default split(CardinalityLab);
