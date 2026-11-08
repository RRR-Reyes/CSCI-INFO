import { Fragment, useEffect, useState } from "react";

/**
 * Small typography helpers shared by the set-theory labs: math text in the KaTeX
 * font with italic variables, and the reader's choice of empty-set notation.
 */

/** How the empty set is written. Many textbooks use ∅; others write { }. */
export type EmptyStyle = "phi" | "braces";
export const emptySym = (s: EmptyStyle) => (s === "phi" ? "∅" : "{ }");
export const otherEmpty = (s: EmptyStyle) => (s === "phi" ? "{ }" : "∅");

const KEY = "learncs-empty-style";
const EVENT = "learncs-empty-style";

/** The empty-set notation, remembered per reader and kept in sync across every lab on the page. */
export function useEmptyStyle() {
  const read = (): EmptyStyle => {
    try {
      return localStorage.getItem(KEY) === "braces" ? "braces" : "phi";
    } catch {
      return "phi";
    }
  };
  const [style, setStyle] = useState<EmptyStyle>(read);
  useEffect(() => {
    const on = () => setStyle(read());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const set = (s: EmptyStyle) => {
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* storage blocked: the choice still applies until reload */
    }
    setStyle(s);
    window.dispatchEvent(new Event(EVENT));
  };
  return [style, set] as const;
}

/** A two-way switch between ∅ and { }. */
export function EmptyToggle({ style, onChange }: { style: EmptyStyle; onChange: (s: EmptyStyle) => void }) {
  return (
    <div className="empty-toggle" role="radiogroup" aria-label="Empty set notation">
      <span className="lab-k">Empty set</span>
      {(["phi", "braces"] as const).map((s) => (
        <button key={s} role="radio" aria-checked={style === s} className={style === s ? "is-on" : ""} onClick={() => onChange(s)}>
          <span className="ie-math">{emptySym(s)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Renders a math string: standalone set letters (A, B, …) in italic, ∅ in the
 * reader's notation. With `lower`, single lowercase letters (elements) are italic too.
 */
export function MathStr({ text, empty = "phi", lower = false }: { text: string; empty?: EmptyStyle; lower?: boolean }) {
  const re = lower ? /(∅|\b[A-Za-z]\b)/g : /(∅|\b[A-Z]\b)/g;
  return (
    <>
      {text.split(re).map((t, i) =>
        t === "∅" ? <Fragment key={i}>{emptySym(empty)}</Fragment>
          : (lower ? /^[A-Za-z]$/ : /^[A-Z]$/).test(t) ? <var key={i}>{t}</var>
          : <Fragment key={i}>{t}</Fragment>
      )}
    </>
  );
}

/** An element of a set: single lowercase letters are variables (italic), everything else upright. */
export const Elem = ({ x }: { x: string }) => (/^[a-z]$/.test(x) ? <var>{x}</var> : <>{x}</>);

/** A region name like "A ∩ B only": italic set letters, spaced ∩, and a quieter "only". */
export function RegionLabel({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) =>
        /^[A-C]$/.test(w) ? <var key={i}>{w}</var>
          : w === "∩" ? <span key={i} className="ie-setop">∩</span>
          : <span key={i} className="region-word">{w}</span>
      )}
    </>
  );
}
