import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { COURSES, sectionsOf, unitHue } from "../courses";
import type { Unit } from "../courses";
import { go } from "../useHashRoute";

/** Slowly drifting dots tinted with each course's hue; they part around the pointer. */
function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hues = COURSES.map((c) => c.hue);
    let w = 0;
    let h = 0;
    let raf = 0;
    const mouse = { x: -999, y: -999 };

    type Dot = { x: number; y: number; vx: number; vy: number; r: number; hue: number; a: number };
    let dots: Dot[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 9000);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 3 + Math.random() * 9,
        hue: hues[Math.floor(Math.random() * hues.length)] + (Math.random() - 0.5) * 30,
        a: 0.35 + Math.random() * 0.5,
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110 && dist > 0) {
          d.vx += (dx / dist) * 0.06;
          d.vy += (dy / dist) * 0.06;
        }
        d.vx *= 0.985;
        d.vy *= 0.985;
        d.x = (d.x + d.vx + 0.04 + w) % w;
        d.y = (d.y + d.vy + h) % h;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${d.hue}, 70%, 62%, ${d.a})`;
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      mouse.x = e.clientX - box.left;
      mouse.y = e.clientY - box.top;
    };

    resize();
    frame();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden />;
}

/**
 * Belousov-Zhabotinsky-style reaction (a Greenberg-Hastings excitable medium).
 * Click the hero and a ring spreads out from that spot; a few moments later the
 * reaction kicks off rings elsewhere too. Every ring carries its own hue, and
 * all hues (and the hero background) slowly cycle over time.
 */
function Reaction({ hero }: { hero: RefObject<HTMLElement> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const host = hero.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CELL = 5; // grid cell size in CSS px
    const STATES = 11; // 0 = rest, 1 = firing, 2..STATES-1 = recovering
    const off = document.createElement("canvas");
    const octx = off.getContext("2d")!;
    let cols = 0;
    let rows = 0;
    let cur = new Uint8Array(0);
    let nxt = new Uint8Array(0);
    let curHue = new Float32Array(0);
    let nxtHue = new Float32Array(0);
    let img: ImageData;
    let raf = 0;
    let tick = 0;
    let time = 0; // drives colour cycling
    let bgHue = 250;
    let lastTs = 0;
    const timers: number[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      off.width = cols;
      off.height = rows;
      img = octx.createImageData(cols, rows);
      cur = new Uint8Array(cols * rows);
      nxt = new Uint8Array(cols * rows);
      curHue = new Float32Array(cols * rows);
      nxtHue = new Float32Array(cols * rows);
    };

    /** Fire a small disc of cells; it grows into a ring because the middle recovers first. */
    const seed = (px: number, py: number, hue: number, radius = 2.5) => {
      const cx = Math.round(px / CELL);
      const cy = Math.round(py / CELL);
      const r = Math.ceil(radius);
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          if ((x - cx) ** 2 + (y - cy) ** 2 > radius * radius) continue;
          const i = y * cols + x;
          if (cur[i] === 0) {
            cur[i] = 1;
            curHue[i] = hue;
          }
        }
      }
    };

        const step = () => {
      // Mixing 4- and 8-neighbour rules at random keeps the rings round instead of square.
      const diagChance = 0.45;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const s = cur[i];
          if (s === 0) {
            // A resting cell fires if a neighbour is firing; it copies that neighbour's hue.
            let fired = false;
            let hue = 0;
            const diag = Math.random() < diagChance;
            for (let dy = -1; dy <= 1 && !fired; dy++) {
              const yy = y + dy;
              if (yy < 0 || yy >= rows) continue;
              for (let dx = -1; dx <= 1; dx++) {
                const xx = x + dx;
                if ((dx === 0 && dy === 0) || xx < 0 || xx >= cols) continue;
                if (!diag && dx !== 0 && dy !== 0) continue;
                const j = yy * cols + xx;
                if (cur[j] === 1) {
                  fired = true;
                  hue = curHue[j];
                  break;
                }
              }
            }
            nxt[i] = fired ? 1 : 0;
            nxtHue[i] = fired ? hue : 0;
          } else {
            nxt[i] = (s + 1) % STATES;
            nxtHue[i] = curHue[i];
          }
        }
      }
      [cur, nxt] = [nxt, cur];
      [curHue, nxtHue] = [nxtHue, curHue];
    };

    const draw = () => {
      const data = img.data;
      for (let i = 0; i < cur.length; i++) {
        const s = cur[i];
        const o = i * 4;
        if (s === 0) {
          data[o + 3] = 0;
          continue;
        }
        // Colour from the ring's own hue, drifting with time and shifting along the trail.
        const hue = (curHue[i] + time * 40 + s * 7) % 360;
        const fade = 1 - (s - 1) / (STATES - 1);
        const [r, g, b] = hslToRgb(hue, 0.8, 0.35 + 0.3 * fade);
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = Math.round(255 * (0.18 + 0.62 * fade * fade));
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.drawImage(off, 0, 0, cols * CELL, rows * CELL);
    };

    const frame = (ts: number) => {
      const dt = Math.min((ts - lastTs) / 1000 || 0.016, 0.05);
      lastTs = ts;
      time += dt;
      bgHue = (bgHue + dt * 12) % 360; // background drifts through the rainbow
      host.style.setProperty("--bgh", bgHue.toFixed(1));
      if (++tick % 2 === 0) {
        // The odd spontaneous ring, like the reaction nucleating on its own.
        if (Math.random() < 0.004) {
          seed(Math.random() * canvas.clientWidth, Math.random() * canvas.clientHeight, (time * 40 + Math.random() * 90) % 360);
        }
        step();
      }
      draw();
      raf = requestAnimationFrame(frame);
    };

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      const box = canvas.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;
      const hue = (time * 40 + Math.random() * 120) % 360;
      seed(x, y, hue);
      // Each click also sets off a few more rings elsewhere over the next seconds.
      const echoes = 4 + Math.floor(Math.random() * 3);
      for (let k = 0; k < echoes; k++) {
        timers.push(
          window.setTimeout(() => {
            const a = Math.random() * Math.PI * 2;
            const d = 80 + Math.random() * 380;
            seed(x + Math.cos(a) * d, y + Math.sin(a) * d, (hue + (Math.random() - 0.5) * 140 + 360) % 360);
          }, 500 + k * (500 + Math.random() * 700)),
        );
      }
    };

    resize();
    if (!reduce) raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    host.addEventListener("pointerdown", onDown);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
      host.removeEventListener("pointerdown", onDown);
    };
  }, [hero]);

  return <canvas ref={ref} className="hero-canvas hero-reaction" aria-hidden />;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

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
        <Reaction hero={heroRef} />
        <DotField />
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
