import { useRef } from "react";
import BZReaction from "./BZReaction";
import { COURSES, sectionsOf, unitHue } from "../courses";
import type { Unit } from "../courses";
import { go } from "../useHashRoute";

/** How many hands-on visuals a unit has, for its tile. */
function visualCount(u: Unit) {
  const n = new Set(sectionsOf(u).map((s) => s.Visual).filter(Boolean)).size;
  return n ? `${n} visual${n === 1 ? "" : "s"}` : "Reading";
}

export default function Home({ onOpenPicker }: { onOpenPicker: () => void }) {
  const units = COURSES.reduce((n, c) => n + c.units.length, 0);
  const heroRef = useRef<HTMLElement>(null);

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
          <a className="btn btn-hero" href="#courses">Start</a>
        </div>
        <span className="hero-scroll" aria-hidden>↓</span>
      </section>

      <section id="courses" className="courses">
        <header className="courses-head">
          <h2>Courses</h2>
          <p>{COURSES.length} courses · {units} units · pick a unit to dive in</p>
        </header>

        {COURSES.map((course) => (
          <article key={course.id} className="course-row" style={{ ["--h" as string]: course.hue }}>
            <div className="course-row-head">
              <div>
                <span className="course-term">{course.term}</span>
                <h3>{course.title}</h3>
                <p>{course.tagline}</p>
              </div>
              <button className="btn btn-soft" onClick={() => go(course.id, course.units[0].id)}>
                Begin →
              </button>
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
        ))}

        <footer className="home-foot">
          <p>
            Layout inspired by{" "}
            <a href="https://seeing-theory.brown.edu/" target="_blank" rel="noreferrer">Seeing Theory</a>{" "}
            (Brown University). Built with React.
          </p>
        </footer>
      </section>
    </div>
  );
}
