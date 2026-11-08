import { Fragment, useState } from "react";
import { split, Stage } from "./Stage";
import { Elem, emptySym, EmptyToggle, MathStr, useEmptyStyle } from "./mathText";

type Preset = { key: string; label: string; poolA: string[]; poolB: string[]; a: string[]; b: string[] };

/** Example sets to pair up; each starts with a few elements switched on. */
const PRESETS: Preset[] = [
  { key: "letters", label: "Letters × numbers", poolA: ["a", "b", "c", "d", "e"], poolB: ["1", "2", "3", "4", "5"], a: ["a", "b"], b: ["1", "2", "3"] },
  { key: "coin", label: "Coin × die", poolA: ["H", "T"], poolB: ["1", "2", "3", "4", "5", "6"], a: ["H", "T"], b: ["1", "2", "3", "4", "5", "6"] },
  { key: "outfits", label: "Shirts × pants", poolA: ["red", "blue", "green", "black"], poolB: ["jeans", "shorts", "chinos"], a: ["red", "blue", "green"], b: ["jeans", "shorts", "chinos"] },
];

/** Which product to build from A and B. */
type Mode = "AB" | "BA" | "AA" | "BB";
const MODES: Mode[] = ["AB", "BA", "AA", "BB"];
const modeName = (m: Mode) => `${m[0]} × ${m[1]}`;

type View = "grid" | "list";

/**
 * Toggle elements of A and B and every ordered pair pops into the grid. Build A × B,
 * B × A, A × A or B × B, read the product as a grid or as a set, and click pairs to
 * pick out a relation R ⊆ the product.
 */
function CartesianGrid() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [a, setA] = useState(PRESETS[0].a);
  const [b, setB] = useState(PRESETS[0].b);
  const [mode, setMode] = useState<Mode>("AB");
  const [view, setView] = useState<View>("grid");
  const [picked, setPicked] = useState<string[]>([]);
  const [empty, setEmpty] = useEmptyStyle();

  const A = preset.poolA.filter((x) => a.includes(x));
  const B = preset.poolB.filter((x) => b.includes(x));
  const side = (L: string) => (L === "A" ? A : B);
  const rows = side(mode[0]);
  const cols = side(mode[1]);
  const name = modeName(mode);
  const pairs = rows.flatMap((r) => cols.map((c) => [r, c] as const));
  const key = (r: string, c: string) => `${r}|${c}`;
  // Only pairs still in the product count toward the relation.
  const live = picked.filter((k) => pairs.some(([r, c]) => key(r, c) === k));

  const choosePreset = (p: Preset) => {
    setPreset(p);
    setA(p.a);
    setB(p.b);
    setPicked([]);
  };
  const toggle = (list: string[], set: (l: string[]) => void, x: string) =>
    set(list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const pick = (k: string) => setPicked(picked.includes(k) ? picked.filter((x) => x !== k) : [...picked, k]);

  const pair = (r: string, c: string) => (
    <>(<Elem x={r} />, <Elem x={c} />)</>
  );

  const picker = (L: string, pool: string[], list: string[], set: (l: string[]) => void) => (
    <div className="cart-picker">
      <span className="cart-set ie-math"><var>{L}</var> =</span>
      {pool.map((x) => (
        <button key={x} className={`chip ${list.includes(x) ? "is-on" : ""}`} aria-pressed={list.includes(x)} onClick={() => toggle(list, set, x)}>
          <span className="ie-math"><Elem x={x} /></span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="viz viz-cart lab">
      <div className="viz-row viz-chips">
        <span className="lab-k">Sets</span>
        {PRESETS.map((p) => (
          <button key={p.key} className={`chip chip-sm ${p === preset ? "is-on" : ""}`} onClick={() => choosePreset(p)}>{p.label}</button>
        ))}
      </div>
      {picker("A", preset.poolA, a, setA)}
      {picker("B", preset.poolB, b, setB)}
      <div className="viz-row viz-chips">
        <span className="lab-k">Product</span>
        {MODES.map((m) => (
          <button key={m} className={`chip chip-sm ${m === mode ? "is-on" : ""}`} onClick={() => setMode(m)}>
            <span className="ie-math"><MathStr text={modeName(m)} /></span>
          </button>
        ))}
      </div>
      <div className="viz-row viz-chips">
        <span className="lab-k">Show as</span>
        <button className={`chip chip-sm ${view === "grid" ? "is-on" : ""}`} onClick={() => setView("grid")}>Grid</button>
        <button className={`chip chip-sm ${view === "list" ? "is-on" : ""}`} onClick={() => setView("list")}>Set of pairs</button>
        {live.length > 0 && <button className="chip chip-sm venn-clear" onClick={() => setPicked([])}>Clear relation</button>}
      </div>
      <EmptyToggle style={empty} onChange={setEmpty} />

      <Stage>
      <div className="cart-board lab" key={`${mode}-${view}-${preset.key}`}>
        {pairs.length === 0 ? (
          <div className="cart-empty pop">
            <strong className="ie-math"><MathStr text={`${name} = ∅`} empty={empty} /></strong>
            <span>One side is empty, so no pairs can be formed.</span>
          </div>
        ) : view === "grid" ? (
          <table className="cart-table">
            <thead>
              <tr>
                <th className="cart-corner ie-math" aria-label={name}>×</th>
                {cols.map((c) => <th key={c} className="ie-math"><Elem x={c} /></th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r}>
                  <th className="ie-math"><Elem x={r} /></th>
                  {cols.map((c, j) => (
                    <td key={c}>
                      <button
                        className={`cart-pair ie-math pop ${live.includes(key(r, c)) ? "is-picked" : ""}`}
                        style={{ animationDelay: `${(i * cols.length + j) * 25}ms` }}
                        aria-pressed={live.includes(key(r, c))}
                        onClick={() => pick(key(r, c))}
                      >
                        {pair(r, c)}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="cart-list ie-math">
            <MathStr text={name} /> = {"{ "}
            {pairs.map(([r, c], i) => (
              <Fragment key={key(r, c)}>
                <button className={`cart-pair pop ${live.includes(key(r, c)) ? "is-picked" : ""}`} style={{ animationDelay: `${i * 18}ms` }} onClick={() => pick(key(r, c))}>
                  {pair(r, c)}
                </button>
                {i < pairs.length - 1 ? ", " : ""}
              </Fragment>
            ))}
            {" }"}
          </p>
        )}
      </div>
      <div className="cart-readout">
        <p>
          <span className="ie-math">|<MathStr text={name} />| = |<var>{mode[0]}</var>| · |<var>{mode[1]}</var>| = {rows.length} · {cols.length} = <b>{pairs.length}</b></span>
          {mode === "BA" && pairs.length > 0 && <span className="cart-note"> Same size as <span className="ie-math"><var>A</var> × <var>B</var></span>, but every pair is reversed.</span>}
          {(mode === "AA" || mode === "BB") && pairs.length > 0 && <span className="cart-note"> The diagonal pairs <span className="ie-math">(<var>x</var>, <var>x</var>)</span> pair an element with itself.</span>}
        </p>
        <p className="cart-rel">
          {live.length === 0 ? (
            <>Click pairs to pick a relation <span className="ie-math"><var>R</var> ⊆ <MathStr text={name} /></span>.</>
          ) : (
            <>
              <span className="ie-math"><var>R</var> = {"{ "}{live.map((k, i) => { const [r, c] = k.split("|"); return <Fragment key={k}>{pair(r, c)}{i < live.length - 1 ? ", " : ""}</Fragment>; })}{" }"}</span>
              <span className="cart-note"> · <span className="ie-math">|<var>R</var>| = {live.length}</span> of {pairs.length} pairs. Any subset of <span className="ie-math"><MathStr text={name} /></span> is a relation, including <span className="ie-math">{emptySym(empty)}</span>.</span>
            </>
          )}
        </p>
      </div>
      </Stage>
    </div>
  );
}

export default split(CartesianGrid);
