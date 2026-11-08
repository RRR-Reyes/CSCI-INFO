import { useEffect, useMemo, useRef, useState } from "react";
import type { Course } from "../courses";
import { COURSES, sectionsOf, unitHue } from "../courses";
import { go } from "../useHashRoute";
import { useActiveSection } from "../useActiveSection";
import { isSplit, StageTarget } from "../visuals/Stage";
import CheckpointCard from "./CheckpointCard";
import MathText, { Tex } from "./MathText";
import type { Thumb } from "../courses";

type Props = { course: Course; unitId?: string; onOpenPicker: () => void };

/** A section tile's picture: a LaTeX formula or a duotone icon. */
function TileThumb({ thumb }: { thumb: Thumb }) {
  if ("tex" in thumb) return <span className="st-tile-thumb is-tex"><Tex tex={thumb.tex} /></span>;
  const Icon = thumb.icon;
  return <span className="st-tile-thumb"><Icon size={56} weight="duotone" color={thumb.color} /></span>;
}

/** A reading paragraph; one that is only a \[ … \] formula is centered on its own line. */
function Para({ text }: { text: string }) {
  const t = text.trim();
  return t.startsWith("\\[") && t.endsWith("\\]") && t.indexOf("\\[", 2) < 0
    ? <div className="st-formula"><Tex tex={t.slice(2, -2)} display /></div>
    : <p><MathText text={text} /></p>;
}

/** Narrow screens show each visual inline under its section instead of in the fixed column. */
function useNarrow() {
  const query = "(max-width: 960px)";
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/**
 * A unit as one Seeing Theory–style chapter: the reading scrolls in a tinted
 * left column while a fixed right column holds every section's visual, all
 * mounted at once. Scrolling only switches which one is visible, so nothing
 * on the right ever moves with the page.
 */
export default function CoursePage({ course, unitId, onOpenPicker }: Props) {
  const index = Math.max(0, course.units.findIndex((u) => u.id === unitId));
  const unit = course.units[index];
  const hue = unitHue(course, index);
  const sections = useMemo(() => sectionsOf(unit), [unit]);
  const narrow = useNarrow();
  const { active, progress, fade, refFor, scrollTo } = useActiveSection(sections.length, `${course.id}/${unit.id}`);
  // Each section's slot in the right column, where its visual (or a split visual's <Stage>) is drawn.
  const [slots, setSlots] = useState<Record<number, HTMLElement>>({});
  // One stable callback per index, so React calls it only when a slot mounts or unmounts.
  const slotRefs = useRef<Record<number, (el: HTMLElement | null) => void>>({});
  const slotRef = (i: number) =>
    (slotRefs.current[i] ??= (el) =>
      setSlots((s) => {
        if (el) return s[i] === el ? s : { ...s, [i]: el };
        if (!(i in s)) return s;
        const rest = { ...s };
        delete rest[i];
        return rest;
      }));

  // Snap scrolling between the intro and each section, like the home page.
  useEffect(() => {
    document.documentElement.classList.add("snap-lesson");
    return () => document.documentElement.classList.remove("snap-lesson");
  }, []);

  // A new unit starts at the top of its intro.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [unit]);

  const inIntro = active < 0;

  const next = course.units[index + 1];
  const prev = course.units[index - 1];
  const nextCourse = !next ? COURSES[(COURSES.indexOf(course) + 1) % COURSES.length] : null;

  return (
    <div className="st" style={{ ["--uh" as string]: hue, ["--fade" as string]: fade }}>
      <header className="st-header">
        <div className="st-progress" aria-hidden>
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <nav className="st-nav">
          <button className="st-burger" onClick={onOpenPicker} aria-label="Open chapter list">&#9776;</button>
          {inIntro ? (
            <button className="st-title" onClick={() => go()}>{course.title}</button>
          ) : (
            <button className="st-title" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              {unit.label}: {unit.title}
            </button>
          )}
        </nav>
      </header>

      <div className="st-left" key={`left-${unit.id}`}>
        <div className="st-left-wrapper">
          <section className="st-intro">
            <h4>{unit.label}</h4>
            <h1>{unit.title}</h1>
            <p>{unit.summary}</p>
            <button className="st-scroll-down" onClick={() => scrollTo(0)} aria-label="Start reading">
              <svg viewBox="0 0 20 12" width="20" height="12" aria-hidden><path d="M1 1l9 9 9-9" /></svg>
            </button>
          </section>

          {sections.map((s, i) => {
            const V = s.Visual;
            const inline = V && (narrow || isSplit(V));
            return (
              <section key={s.id} ref={refFor(i)} className="st-unit">
                <h3>{s.title}</h3>
                {s.body.map((p, k) => <Para key={k} text={p} />)}
                {s.visualHint && V && <p className="st-hint"><MathText text={s.visualHint} /></p>}
                {inline && (
                  <div className="st-interactive">
                    <StageTarget.Provider value={narrow ? null : slots[i] ?? null}>
                      <V />
                    </StageTarget.Provider>
                  </div>
                )}
                {s.checkpoints?.map((cp, k) => <CheckpointCard key={k} cp={cp} />)}
              </section>
            );
          })}
        </div>

        <footer className="st-foot">
          {prev && (
            <button className="st-foot-prev" onClick={() => go(course.id, prev.id)}>← {prev.label}: {prev.title}</button>
          )}
          {next ? (
            <button className="st-foot-next" onClick={() => go(course.id, next.id)}>
              <h4>Next</h4>
              <p>{next.title} →</p>
            </button>
          ) : nextCourse && nextCourse !== course ? (
            <button className="st-foot-next" onClick={() => go(nextCourse.id, nextCourse.units[0].id)}>
              <h4>Next course</h4>
              <p>{nextCourse.title} →</p>
            </button>
          ) : null}
        </footer>
      </div>

      {!narrow && (
        <div className="st-right" key={`right-${unit.id}`}>
          <div className="st-tiles" style={{ opacity: 1 - fade, visibility: fade >= 1 ? "hidden" : "visible" }}>
            {sections.map((s, i) => (
              <button key={s.id} className="st-tile" onClick={() => scrollTo(i)}>
                <span className="st-tile-num">{i + 1}</span>
                <span className="st-tile-title">{s.title}</span>
                {s.thumb && <TileThumb thumb={s.thumb} />}
              </button>
            ))}
          </div>
          {sections.map((s, i) => {
            const V = s.Visual;
            return (
              <div key={s.id} ref={slotRef(i)} className={`st-viz ${i === active ? "is-on" : ""}`} aria-hidden={i !== active}>
                {V && !isSplit(V) && <div className="stage"><V /></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
