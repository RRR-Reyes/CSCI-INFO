import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * A Belousov-Zhabotinsky reaction in a dish, simulated on the GPU.
 *
 * The medium follows the Barkley model of an excitable reaction-diffusion system:
 *   du/dt = u(1-u)(u - (v+b)/a) / eps + D * lap(u)   (u ~ activator, HBrO2)
 *   dv/dt = k (u - v)                                 (v ~ oxidised catalyst)
 * Because the waves come from real diffusion (an isotropic 9-point Laplacian on a
 * smooth float field), they grow as true circles and annihilate where they meet.
 *
 * Clicking drops a "pacemaker" (in a real dish, a speck of dust or a bubble) that keeps
 * firing concentric target waves. Shortly after, new pacemakers nucleate elsewhere.
 * Colours follow a real dish as it ages: orange with white rings, then the blue phase,
 * then red with pale rings, and round again.
 */

const SIM_VS = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const SIM_FS = `#version 300 es
precision highp float;
uniform sampler2D s;
uniform ivec2 res;
uniform float dt, D, eps, a, b, k;
uniform int n;
uniform vec3 stim[16];
out vec4 o;
vec2 at(ivec2 q) { return texelFetch(s, clamp(q, ivec2(0), res - 1), 0).xy; }
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy);
  vec2 c = at(q);
  vec2 n4 = at(q + ivec2(1, 0)) + at(q - ivec2(1, 0)) + at(q + ivec2(0, 1)) + at(q - ivec2(0, 1));
  vec2 d4 = at(q + ivec2(1, 1)) + at(q + ivec2(-1, 1)) + at(q + ivec2(1, -1)) + at(q + ivec2(-1, -1));
  float lap = (4.0 * n4.x + d4.x - 20.0 * c.x) / 6.0;
  float u = c.x, v = c.y;
  float th = (v + b) / a;
  float un = u + dt * (u * (1.0 - u) * (u - th) / eps + D * lap);
  float vn = v + dt * k * (u - v);
  for (int i = 0; i < 16; i++) {
    if (i >= n) break;
    float d = distance(vec2(q) + 0.5, stim[i].xy);
    un = max(un, 1.0 - smoothstep(stim[i].z - 1.0, stim[i].z, d));
  }
  o = vec4(clamp(un, 0.0, 1.0), clamp(vn, 0.0, 1.0), 0.0, 1.0);
}`;

const VIEW_FS = `#version 300 es
precision highp float;
uniform sampler2D s;
uniform ivec2 res;
uniform vec2 view;
uniform float time;
uniform vec3 rest, tailC, ringC;
uniform float tailAmt;
out vec4 o;
vec2 at(ivec2 q) { return texelFetch(s, clamp(q, ivec2(0), res - 1), 0).xy; }
vec2 field(vec2 uv) {
  // Hand-rolled bilinear filtering: float textures are not always filterable.
  vec2 g = uv * vec2(res) - 0.5;
  ivec2 i = ivec2(floor(g));
  vec2 f = fract(g);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(at(i), at(i + ivec2(1, 0)), f.x), mix(at(i + ivec2(0, 1)), at(i + ivec2(1, 1)), f.x), f.y);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = gl_FragCoord.xy / view;
  vec2 w = field(uv);
  float u = w.x, v = w.y;

  // A thin bright ring at the leading edge of each wave, then a fading tail behind it
  // while the catalyst slowly turns back. Palette colours come from the app's timeline.
  float ring = smoothstep(0.2, 0.7, u) * (1.0 - smoothstep(0.12, 0.34, v));
  float tail = smoothstep(0.04, 0.5, v) * (1.0 - ring);
  vec3 col = mix(rest, tailC, tail * tailAmt);
  col = mix(col, ringC, ring);

  // Back-lit dish: brighter centre, soft vignette, a little film grain.
  vec2 qv = (uv - 0.5) * vec2(view.x / view.y, 1.0);
  float light = 1.06 - 0.45 * dot(qv, qv);
  col *= light;
  col += (hash(gl_FragCoord.xy + fract(time) * 97.0) - 0.5) * 0.035;
  o = vec4(pow(max(col, 0.0), vec3(0.95)), 1.0);
}`;

type Pacemaker = { x: number; y: number; period: number; next: number; until: number; left: number; auto: boolean };
type RGB = [number, number, number];
type Palette = { rest: RGB; tail: RGB; ring: RGB; tailAmt: number };

// Sampled from photos of real BZ dishes.
const ORANGE: Palette = { rest: [0.93, 0.44, 0.1], tail: [0.98, 0.66, 0.34], ring: [0.99, 0.95, 0.83], tailAmt: 0.45 };
const BLUE: Palette = { rest: [0.36, 0.11, 0.22], tail: [0.27, 0.27, 0.74], ring: [0.6, 0.7, 1.0], tailAmt: 0.92 };
const RED: Palette = { rest: [0.86, 0.11, 0.11], tail: [0.95, 0.47, 0.5], ring: [0.8, 0.94, 0.97], tailAmt: 0.5 };

/** Hold each colour phase, then cross-fade to the next: orange, blue, red, back to orange. */
const HOLD = 30;
const FADE = 15;
function paletteAt(t: number): Palette {
  const order = [ORANGE, BLUE, RED];
  const span = HOLD + FADE;
  const k = Math.floor(t / span) % order.length;
  const into = t % span;
  const f = into < HOLD ? 0 : (into - HOLD) / FADE;
  const e = f * f * (3 - 2 * f);
  const A = order[k];
  const B = order[(k + 1) % order.length];
  const mix = (x: RGB, y: RGB): RGB => [x[0] + (y[0] - x[0]) * e, x[1] + (y[1] - x[1]) * e, x[2] + (y[2] - x[2]) * e];
  return { rest: mix(A.rest, B.rest), tail: mix(A.tail, B.tail), ring: mix(A.ring, B.ring), tailAmt: A.tailAmt + (B.tailAmt - A.tailAmt) * e };
}

export default function BZReaction({ host }: { host: RefObject<HTMLElement> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const el = host.current!;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return; // CSS background stays as the fallback
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Model parameters (grid units).
    // Kept well inside the excitable regime so even the very first pulse always takes off.
    const P = { dt: 0.0025, D: 20, eps: 0.02, a: 0.75, b: 0.04, k: 1.6 };
    const SCALE = 2; // CSS px per grid cell
    const MODEL_PER_SEC = 2.2; // how fast model time runs

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader");
      return sh;
    };
    const program = (fs: string) => {
      const pr = gl.createProgram()!;
      gl.attachShader(pr, compile(gl.VERTEX_SHADER, SIM_VS));
      gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(pr, 0, "p");
      gl.linkProgram(pr);
      const u = (name: string) => gl.getUniformLocation(pr, name);
      return { pr, u };
    };
    let sim: ReturnType<typeof program>;
    let view: ReturnType<typeof program>;
    try {
      sim = program(SIM_FS);
      view = program(VIEW_FS);
    } catch {
      return;
    }

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    let cols = 0;
    let rows = 0;
    let tex: WebGLTexture[] = [];
    let fbo: WebGLFramebuffer[] = [];
    let src = 0;

    const alloc = () => {
      tex.forEach((t) => gl.deleteTexture(t));
      fbo.forEach((f) => gl.deleteFramebuffer(f));
      tex = [];
      fbo = [];
      for (let i = 0; i < 2; i++) {
        const t = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, cols, rows, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const f = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        tex.push(t);
        fbo.push(f);
      }
      src = 0;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const c = Math.ceil(canvas.clientWidth / SCALE);
      const r = Math.ceil(canvas.clientHeight / SCALE);
      // Only restart the dish if the size really changed (not a mobile URL bar wiggle).
      if (!cols || Math.abs(c - cols) > cols * 0.15 || Math.abs(r - rows) > rows * 0.25) {
        cols = c;
        rows = r;
        alloc();
        pacemakers.length = 0;
        started = -1;
      }
    };

    const pacemakers: Pacemaker[] = [];
    const timers: number[] = [];
    let simTime = 0;
    let realTime = 0;
    let carry = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let started = -1; // real time of the first click

    /** A random number of pulses, 6 to 10, before a pacemaker goes quiet. */
    const pulses = () => 6 + Math.floor(Math.random() * 5);
    // How many randomly placed pacemakers to keep going at once (6 to 10, picked per visit).
    const MAX_AUTO = 6 + Math.floor(Math.random() * 5);
    let pendingAuto = 0; // random pacemakers scheduled but not yet placed
    const MIN_AUTO = 6; // once the reaction has started, never fewer random pacemakers than this

    /** Place a random pacemaker after a delay (in ms), counting it as present meanwhile. */
    const scheduleAuto = (delay: number) => {
      pendingAuto++;
      timers.push(
        window.setTimeout(() => {
          pendingAuto--;
          if (autoCount() < MAX_AUTO) addPacemaker(0.1 + Math.random() * 0.8, 0.1 + Math.random() * 0.8, true);
        }, delay),
      );
    };
    const autoCount = () => pacemakers.filter((p) => p.auto).length;
    const MAX_CLICKS = 4; // clicked pacemakers allowed at once, so rings don't get crowded

    /**
     * True once the liquid around a pacemaker has recovered. Firing into a wave's tail would
     * break the new ring into a spiral, and spirals never die out on their own.
     */
    const probe = new Float32Array(23 * 23 * 4);
    const ready = (pm: Pacemaker) => {
      const R = 11;
      const cx = Math.round(pm.x * cols);
      const cy = Math.round((1 - pm.y) * rows);
      const x0 = Math.max(0, cx - R);
      const y0 = Math.max(0, cy - R);
      const w = Math.min(cols, cx + R + 1) - x0;
      const h = Math.min(rows, cy + R + 1) - y0;
      if (w <= 0 || h <= 0) return true;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[src]);
      gl.readPixels(x0, y0, w, h, gl.RGBA, gl.FLOAT, probe);
      for (let i = 0; i < w * h; i++) if (probe[i * 4] > 0.2 || probe[i * 4 + 1] > 0.15) return false;
      return true;
    };

    const addPacemaker = (x: number, y: number, auto: boolean) => {
      // Real pacemakers fire at slightly different rates, which is what gives the cusps
      // where two families of rings collide.
      // Each pacemaker sends out 6 to 10 rings and then goes quiet, so the dish clears.
      pacemakers.push({ x, y, period: 2.0 + Math.random() * 0.8, next: simTime, until: -1, left: pulses(), auto });
    };

    const step = (stims: number[][]) => {
      gl.useProgram(sim.pr);
      gl.viewport(0, 0, cols, rows);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - src]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex[src]);
      gl.uniform1i(sim.u("s"), 0);
      gl.uniform2i(sim.u("res"), cols, rows);
      gl.uniform1f(sim.u("dt"), P.dt);
      gl.uniform1f(sim.u("D"), P.D);
      gl.uniform1f(sim.u("eps"), P.eps);
      gl.uniform1f(sim.u("a"), P.a);
      gl.uniform1f(sim.u("b"), P.b);
      gl.uniform1f(sim.u("k"), P.k);
      gl.uniform1i(sim.u("n"), stims.length);
      if (stims.length) gl.uniform3fv(sim.u("stim"), new Float32Array(stims.flat()));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      src = 1 - src;
    };

    const render = () => {
      gl.useProgram(view.pr);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex[src]);
      gl.uniform1i(view.u("s"), 0);
      gl.uniform2i(view.u("res"), cols, rows);
      gl.uniform2f(view.u("view"), canvas.width, canvas.height);
      gl.uniform1f(view.u("time"), realTime);
      const pal = paletteAt(started < 0 ? 0 : realTime - started);
      gl.uniform3fv(view.u("rest"), pal.rest);
      gl.uniform3fv(view.u("tailC"), pal.tail);
      gl.uniform3fv(view.u("ringC"), pal.ring);
      gl.uniform1f(view.u("tailAmt"), pal.tailAmt);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((ts - last) / 1000 || 0, 0.05);
      last = ts;
      if (!visible) return;
      realTime += dt;
      carry += dt * MODEL_PER_SEC;
      let steps = Math.min(Math.floor(carry / P.dt), 60);
      carry -= steps * P.dt;
      while (steps-- > 0) {
        const stims: number[][] = [];
        for (const pm of pacemakers) {
          if (simTime >= pm.next && pm.left > 0) {
            if (!ready(pm)) {
              pm.next = simTime + 0.05; // still recovering here; try again shortly
              continue;
            }
            pm.until = simTime + 0.1; // hold the stimulus briefly so the wave can take hold
            pm.next = simTime + pm.period;
            pm.left--;
          }
          if (simTime < pm.until && stims.length < 16) stims.push([pm.x * cols, (1 - pm.y) * rows, 7]);
        }
        step(stims);
        simTime += P.dt;
        // Retire pacemakers that have fired their last ring.
        for (let i = pacemakers.length - 1; i >= 0; i--) {
          if (pacemakers[i].left <= 0 && simTime >= pacemakers[i].until) pacemakers.splice(i, 1);
        }
        // Replace retired random pacemakers so at least MIN_AUTO keep going.
        if (started >= 0 && autoCount() + pendingAuto < MIN_AUTO) scheduleAuto(400 + Math.random() * 1600);
      }
      render();
    };

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      const box = canvas.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width;
      const y = (e.clientY - box.top) / box.height;
      // At most MAX_CLICKS clicked sources at once: a new click retires the oldest one.
      const clicked = pacemakers.filter((p) => !p.auto);
      if (clicked.length >= MAX_CLICKS) pacemakers.splice(pacemakers.indexOf(clicked[0]), 1);
      addPacemaker(x, y, false);
      if (started < 0) {
        started = realTime;
      }
      // The disturbance seeds random pacemakers elsewhere, topping the dish up to MAX_AUTO.
      // They appear one by one over the next several seconds rather than all at once.
      const need = MAX_AUTO - autoCount() - pendingAuto;
      for (let i = 0; i < need; i++) scheduleAuto(1500 + i * 1200 + Math.random() * 1500);
    };

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(canvas);

    resize();
    render();
    if (!reduce) raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    el.addEventListener("pointerdown", onDown);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      io.disconnect();
      window.removeEventListener("resize", resize);
      el.removeEventListener("pointerdown", onDown);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [host]);

  return <canvas ref={ref} className="hero-canvas" aria-hidden />;
}
