import { useState } from "react";
import type { CSSProperties } from "react";
import { split, Stage } from "./Stage";
import { SET_COLOR } from "./vennShared";
import { emptySym, EmptyToggle, MathStr, otherEmpty, useEmptyStyle } from "./mathText";

type Rel = { key: string; label: string; a: [number, number]; b: [number, number]; sub: boolean; proper: boolean; disjoint: boolean; empty: boolean; note: string };

/** Circle offset and radius for A and B in each arrangement. */
const RELS: Rel[] = [
  { key: "overlap", label: "Overlapping", a: [-60, 92], b: [60, 92], sub: false, proper: false, disjoint: false, empty: false, note: "They share some elements, so none of the special relationships hold." },
  { key: "subset", label: "A ⊂ B", a: [-18, 52], b: [0, 118], sub: true, proper: true, disjoint: false, empty: false, note: "Every element of A is in B and B has more, so A ⊂ B (and A ⊆ B)." },
  { key: "equal", label: "A = B", a: [0, 100], b: [0, 100], sub: true, proper: false, disjoint: false, empty: false, note: "A ⊆ B still holds, but not A ⊂ B: a proper subset must be missing something." },
  { key: "disjoint", label: "Disjoint", a: [-120, 78], b: [120, 78], sub: false, proper: false, disjoint: true, empty: false, note: "A ∩ B = ∅: nothing is shared." },
  { key: "empty", label: "A = ∅", a: [-125, 0], b: [60, 92], sub: true, proper: true, disjoint: true, empty: true, note: "∅ is a subset of every set, a proper subset of any nonempty set, and disjoint from all of them." },
];

/** Pick an arrangement of A and B; the circles glide into place and the relation badges update. */
function SetRelations() {
  const [rel, setRel] = useState(RELS[0]);
  const [empty, setEmpty] = useEmptyStyle();
  const badges: [string, string, boolean][] = [
    ["A ⊆ B", "subset", rel.sub],
    ["A ⊂ B", "proper subset", rel.proper],
    ["A ∩ B = ∅", "disjoint", rel.disjoint],
    ["A = ∅", "empty", rel.empty],
  ];
  const ax = 250 + rel.a[0];

  return (
    <div className="viz viz-rel lab">
      <div className="viz-row viz-chips">
        {RELS.map((r) => (
          <button key={r.key} className={`chip ${r === rel ? "is-on" : ""}`} aria-pressed={r === rel} onClick={() => setRel(r)}>
            <span className={/[⊂=∅]/.test(r.label) ? "ie-math" : ""}><MathStr text={r.label} empty={empty} /></span>
          </button>
        ))}
      </div>
      <EmptyToggle style={empty} onChange={setEmpty} />

      <Stage>
      <svg viewBox="0 0 500 300" className="venn-svg rel-svg" role="img" aria-label={`Sets A and B: ${rel.label}`}>
        <rect x="10" y="10" width="480" height="280" rx="18" className="venn-universe" />
        <circle className="rel-circle" cx="250" cy="150" style={{ transform: `translate(${rel.b[0]}px, 0px)`, r: rel.b[1], fill: SET_COLOR[1], stroke: SET_COLOR[1] } as CSSProperties} />
        <circle className="rel-circle rel-a" cx="250" cy="150" style={{ transform: `translate(${rel.a[0]}px, 0px)`, r: rel.a[1], fill: SET_COLOR[0], stroke: SET_COLOR[0] } as CSSProperties} />
        <text x="250" y="150" dy="8" className="rel-tag" style={{ transform: `translate(${rel.a[0]}px, 0px)`, opacity: rel.a[1] ? 1 : 0, fill: SET_COLOR[0] }}>A</text>
        <text x="250" y="52" className="rel-tag" style={{ transform: `translate(${rel.b[0] + (rel.key === "subset" ? 70 : 0)}px, ${rel.key === "subset" ? 30 : 0}px)`, fill: SET_COLOR[1] }}>B</text>
        {/* With A empty there is no circle to label, so the set itself is written out. */}
        <g className="rel-empty-tag" style={{ opacity: rel.empty ? 1 : 0 }}>
          <circle cx={ax} cy="150" r="4" style={{ fill: SET_COLOR[0] }} />
          <text x={ax} y="126" style={{ fill: SET_COLOR[0] }}>
            <tspan className="rel-var">A</tspan> = {emptySym(empty)}
          </text>
        </g>
      </svg>
      <div className="rel-badges">
        {badges.map(([sym, word, on]) => (
          <div key={word} className={`rel-badge ${on ? "is-yes" : "is-no"}`}>
            <span className="ie-math"><MathStr text={sym} empty={empty} /></span>
            <small>{word}</small>
          </div>
        ))}
      </div>
      <p className="viz-readout" aria-live="polite">
        <MathStr text={rel.note} empty={empty} />
        {rel.empty && (
          <span className="rel-alt"> The empty set is the set with no elements; some textbooks write it as <span className="ie-math">{otherEmpty(empty)}</span> instead of <span className="ie-math">{emptySym(empty)}</span>.</span>
        )}
      </p>
      </Stage>
    </div>
  );
}

export default split(SetRelations);
