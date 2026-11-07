import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import BZReaction from "./BZReaction";
import { AboutArt, GoalArt, HubShape } from "./HomeArt";
import { COURSES, findCourse, sectionsOf } from "../courses";
import type { Course, Unit } from "../courses";
import { go } from "../useHashRoute";

/** How many hands-on visuals a unit has, for its tile. */
function visualCount(u: Unit) {
  const n = new Set(sectionsOf(u).map((s) => s.Visual).filter(Boolean)).size;
  return n ? `${n} visual${n === 1 ? "" : "s"}` : "Reading";
}

/** Distinct hues for tiles that are not tied to a course color. */
const PALETTE = [262, 200, 152, 32, 340, 178, 292, 12, 228, 96];
/** Corner shapes, cycled so neighbouring tiles never repeat one. */
const SHAPES = ["circle", "diamond", "triangle", "ring", "hexagon", "quarter", "pill", "blob"];
const tileStyle = (hue: number, i: number) => ({ ["--uh" as string]: hue, animationDelay: `${i * 40}ms` });
/** A course's units fan out across a wide band around the course hue, so each one gets its own color. */
const courseTileHue = (c: Course, i: number) => (c.hue + (i - (c.units.length - 1) / 2) * 22 + 360) % 360;
const shapeOf = (i: number) => `shape-${SHAPES[i % SHAPES.length]}`;

/** One entry inside an opened box: a chapter or a tool, or a placeholder for one still to come. */
type Item = { title: string; note: string; to?: [string, string]; glyph?: string };

/** The notation each chapter is about, drawn large on its tile. */
const GLYPHS: Record<string, string> = { operations: "A ∪ B", cardinality: "|A|", concepts: "A ⊆ B", cartesian: "A × B" };

/** One-line descriptions for chapter tiles, keyed by section id. */
const SHORT_NOTES: Record<string, string> = {
  operations: "Union, intersection and complement on a Venn diagram.",
  cardinality: "Count what is in a set, and every subset it has.",
  concepts: "Subsets, disjoint sets and equal sets.",
  cartesian: "Pair up elements of two sets into ordered pairs.",
};

/** Sections of an existing unit, listed as chapters that open that unit. */
function unitItems(courseId: string, unitId: string): Item[] {
  const unit = findCourse(courseId)?.units.find((u) => u.id === unitId);
  if (!unit) return [];
  return sectionsOf(unit).map((s) => ({ title: s.title, note: SHORT_NOTES[s.id] ?? "", to: [courseId, unitId], glyph: GLYPHS[s.id] }));
}

type Hub = { id: string; label: string; title: string; blurb: string; meta: string; hue: number; shape: string; items?: () => Item[] };

/** The three boxes on the home page. Courses opens the course list instead of items. */
const HUBS: Hub[] = [
  {
    id: "sets",
    label: "Start here",
    title: "Set Theory",
    blurb: "Collections, notation, and the operations that combine them.",
    meta: `${unitItems("discrete", "sets").length} chapters`,
    hue: 228,
    shape: "shape-circle",
    items: () => unitItems("discrete", "sets"),
  },
  {
    id: "visuals",
    label: "Sandbox",
    title: "Playground",
    blurb: "Build expression trees, truth tables, and pseudocode of your own.",
    meta: "4 tools",
    hue: 158,
    shape: "shape-triangle",
    items: () => [
      { title: "Expression Trees", note: "Type an expression and watch it evaluate from the leaves up.", to: ["discrete", "logic"], glyph: "(3+4)×2" },
      { title: "Truth Tables", note: "Any expression, one column per step.", to: ["discrete", "logic"], glyph: "T F" },
      { title: "Logic Lab", note: "Check equivalences and play with quantifiers.", to: ["discrete", "logic"], glyph: "p → q" },
      { title: "Pseudocode", note: "Step through pseudocode line by line.", glyph: "if … then" },
    ],
  },
  {
    id: "courses",
    label: "By class",
    title: "Course Library",
    blurb: "Every unit from the CS and IT classes of the first two years.",
    meta: `${COURSES.length} courses · ${COURSES.reduce((n, c) => n + c.units.length, 0)} units`,
    hue: 22,
    shape: "shape-hexagon",
  },
];

export default function Home({ onOpenPicker }: { onOpenPicker: () => void }) {
  const heroRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<{ hub: Hub; from: DOMRect } | null>(null);
  const close = useCallback(() => setOpen(null), []);

  // Snap scrolling only on the home page; chapters scroll freely.
  useEffect(() => {
    document.documentElement.classList.add("snap-home");
    return () => document.documentElement.classList.remove("snap-home");
  }, []);

  return (
    <div className="home">
      <section className="hero" ref={heroRef}>
        <BZReaction host={heroRef} />
        <nav className="hero-nav">
          <a className="brand" href="https://github.com/RRR-Reyes" target="_blank" rel="noreferrer">RRR-Reyes</a>
          <button className="link-btn" onClick={onOpenPicker}>All chapters</button>
        </nav>
        <div className="hero-copy">
          <h1>CSCI-INFO</h1>
          <p>Beyond classroom topics and deeper into informatics</p>
          <a className="btn btn-hero" href="#explore">Start</a>
        </div>
        <span className="hero-scroll" aria-hidden>↓</span>
      </section>

      <section id="about" className="intro">
        <header className="intro-bar">
          <span className="intro-brand">CSCI-INFO</span>
        </header>
        <div className="intro-inner">
          <div className="intro-text">
            <h2>What is <span>This?</span></h2>
            <p>
              CSCI-INFO turns the topics from your CS and IT classes into pictures you can see and play with. Each
              chapter pairs a short reading with a visual that moves when you do.
            </p>
          </div>
          <AboutArt />
        </div>
        <span className="intro-mouse" aria-hidden />
      </section>

      <section id="goal" className="intro is-flipped">
        <div className="intro-inner">
          <div className="intro-text">
            <h2>The <span>Goal</span></h2>
            <p>
              Give students a visual for every topic covered in class, and keep it free for anyone who wants to
              learn. No account, no paywall, on any device.
            </p>
          </div>
          <GoalArt />
        </div>
        <span className="intro-mouse" aria-hidden />
      </section>

      <section id="explore" className="boxes">
        <div className="boxes-inner">
        <div className="hubs">
          {HUBS.map((hub) => (
            <button
              key={hub.id}
              className="hub"
              style={{ "--h": hub.hue } as CSSProperties}
              onClick={(e) => setOpen({ hub, from: e.currentTarget.getBoundingClientRect() })}
            >
              <span className="hub-label">{hub.label}</span>
              <strong className="hub-title">{hub.title}</strong>
              <span className="hub-blurb">{hub.blurb}</span>
              <span className="hub-meta">{hub.meta}</span>
              <span className="hub-bead" aria-hidden />
              <HubShape shape={hub.shape} id={hub.id} />
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
        </div>
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
            <div className="tile-stack">
              {items.map((it, i) => (
                <button
                  key={it.title}
                  className={`tile tile-wide ${shapeOf(i)}`}
                  style={tileStyle(PALETTE[i % PALETTE.length], i)}
                  disabled={!it.to}
                  onClick={() => it.to && go(...it.to)}
                >
                  <span className="tile-label">{it.to ? `${hub.id === "sets" ? "Chapter" : "Tool"} ${i + 1}` : "Coming soon"}</span>
                  <strong>{it.title}</strong>
                  {it.note && <span className="tile-blurb">{it.note.replace(/\\[()]/g, "")}</span>}
                  <span className="tile-meta">{it.to ? "Open →" : "In the works"}</span>
                  <Deco i={i} glyph={it.glyph} />
                </button>
              ))}
            </div>
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
                <div className="tile-grid">
                  {course.units.map((u, i) => (
                    <button
                      key={u.id}
                      className={`tile ${shapeOf(i)}`}
                      style={tileStyle(courseTileHue(course, i), i)}
                      onClick={() => go(course.id, u.id)}
                    >
                      <span className="tile-label">{u.label}</span>
                      <strong>{u.title}</strong>
                      <span className="tile-meta">{visualCount(u)}</span>
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

/**
 * Extra decoration that fills the right side of a wide tile: the topic's
 * notation in large type, a dot grid, an outlined shape and a small chip.
 * The arrangement shifts with the tile's position so no two rows look alike.
 */
function Deco({ i, glyph }: { i: number; glyph?: string }) {
  return (
    <span className={`deco deco-${i % 3}`} aria-hidden>
      {glyph && <span className="deco-glyph">{glyph}</span>}
      <span className="deco-dots" />
      <span className={`deco-outline ${shapeOf(i + 3)}`} />
      <span className={`deco-chip ${shapeOf(i + 5)}`} />
    </span>
  );
}
