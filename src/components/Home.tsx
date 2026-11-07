import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import BZReaction from "./BZReaction";
import { COURSES, findCourse, sectionsOf, unitHue } from "../courses";
import type { Unit } from "../courses";
import { go } from "../useHashRoute";

/** How many hands-on visuals a unit has, for its tile. */
function visualCount(u: Unit) {
  const n = new Set(sectionsOf(u).map((s) => s.Visual).filter(Boolean)).size;
  return n ? `${n} visual${n === 1 ? "" : "s"}` : "Reading";
}

/** One entry inside an opened box: a chapter or a tool, or a placeholder for one still to come. */
type Item = { title: string; note: string; to?: [string, string] };

/** Sections of an existing unit, listed as chapters that open that unit. */
function unitItems(courseId: string, unitId: string): Item[] {
  const unit = findCourse(courseId)?.units.find((u) => u.id === unitId);
  if (!unit) return [];
  return sectionsOf(unit).map((s) => ({ title: s.title, note: s.visualHint ?? "", to: [courseId, unitId] }));
}

type Hub = { id: string; title: string; blurb: string; hue: number; items?: () => Item[] };

/** The three boxes on the home page. Courses opens the course list instead of items. */
const HUBS: Hub[] = [
  {
    id: "sets",
    title: "Set Theory",
    blurb: "Collections, notation, and the operations that combine them.",
    hue: 212,
    items: () => unitItems("discrete", "sets"),
  },
  {
    id: "visuals",
    title: "Other Visuals",
    blurb: "Expression trees, truth tables, and pseudocode.",
    hue: 140,
    items: () => [
      { title: "Expression Trees", note: "Type an expression and watch it evaluate from the leaves up.", to: ["discrete", "logic"] },
      { title: "Truth Tables", note: "Any expression, one column per step.", to: ["discrete", "logic"] },
      { title: "Logic Lab", note: "Check equivalences and play with quantifiers.", to: ["discrete", "logic"] },
      { title: "Pseudocode", note: "Coming soon: step through pseudocode line by line." },
    ],
  },
  {
    id: "courses",
    title: "Courses",
    blurb: `${COURSES.length} courses from the first years of CS and IT.`,
    hue: 24,
  },
];

export default function Home({ onOpenPicker }: { onOpenPicker: () => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<{ hub: Hub; from: DOMRect } | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <div className="home">
      <section className="hero" ref={heroRef}>
        <BZReaction host={heroRef} />
        <nav className="hero-nav">
          <a className="brand" href="https://github.com/RRR-Reyes" target="_blank" rel="noreferrer">RRR-Reyes</a>
          <button className="link-btn" onClick={onOpenPicker}>All chapters</button>
        </nav>
        <div className="hero-copy">
          <h1>LearnCS</h1>
          <p>Computer science you can see: scroll through each idea and play with it.</p>
          <a className="btn btn-hero" href="#explore">Start</a>
        </div>
        <span className="hero-scroll" aria-hidden>↓</span>
      </section>

      <section id="explore" className="courses">
        <div className="hubs">
          {HUBS.map((hub, i) => (
            <button
              key={hub.id}
              className="hub"
              style={{ ["--uh" as string]: hub.hue, animationDelay: `${i * 60}ms` }}
              onClick={(e) => setOpen({ hub, from: e.currentTarget.getBoundingClientRect() })}
            >
              <strong>{hub.title}</strong>
              <span>{hub.blurb}</span>
            </button>
          ))}
        </div>

        <footer className="home-foot">
          <p>
            Layout inspired by{" "}
            <a href="https://seeing-theory.brown.edu/" target="_blank" rel="noreferrer">Seeing Theory</a>{" "}
            (Brown University). Built with React.
          </p>
        </footer>
      </section>

      {open && <HubPanel hub={open.hub} from={open.from} onClose={close} />}
    </div>
  );
}

/** An opened box: grows out of the box that was clicked and lists what is inside it. */
function HubPanel({ hub, from, onClose }: { hub: Hub; from: DOMRect; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const [grown, setGrown] = useState(false);

  // Start the panel exactly over the clicked box, then let it grow to full size.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    const to = el.getBoundingClientRect();
    el.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    return () => cancelAnimationFrame(id);
  }, [from]);

  useEffect(() => {
    if (grown && panel.current) panel.current.style.transform = "";
  }, [grown]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const items = hub.items?.();

  return (
    <div className={`hub-overlay ${grown ? "is-grown" : ""}`} role="dialog" aria-modal="true" aria-label={hub.title} onClick={onClose}>
      <div className="hub-panel" ref={panel} style={{ "--uh": hub.hue } as CSSProperties} onClick={(e) => e.stopPropagation()}>
        <header className="hub-panel-head">
          <h2>{hub.title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="hub-panel-body">
          {items ? (
            <ol className="hub-items">
              {items.map((it, i) => (
                <li key={it.title} style={{ animationDelay: `${120 + i * 40}ms` }}>
                  <button className="hub-item" disabled={!it.to} onClick={() => it.to && go(...it.to)}>
                    <span className="hub-item-num">{i + 1}.</span>
                    <span>
                      <strong>{it.title}</strong>
                      {it.note && <small>{it.note.replace(/\\[()]/g, "")}</small>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            COURSES.map((course) => (
              <article key={course.id} className="course-row" style={{ ["--h" as string]: course.hue }}>
                <div className="course-row-head">
                  <div>
                    <span className="course-term">{course.term}</span>
                    <h3>{course.title}</h3>
                    <p>{course.tagline}</p>
                  </div>
                </div>
                <div className="unit-tiles">
                  {course.units.map((u, i) => (
                    <button
                      key={u.id}
                      className="unit-tile"
                      style={{ ["--uh" as string]: unitHue(course, i), animationDelay: `${i * 40}ms` }}
                      onClick={() => go(course.id, u.id)}
                    >
                      <span className="unit-tile-label">{u.label}</span>
                      <strong>{u.title}</strong>
                      <span className="unit-tile-meta">{visualCount(u)}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
