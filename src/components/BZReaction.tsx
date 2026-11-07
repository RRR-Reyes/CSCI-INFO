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
 * Colours follow the ferroin indicator: orange-red reduced solution, blue oxidised waves.
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
uniform vec3 stim[8];
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
  for (int i = 0; i < 8; i++) {
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

  // Ferroin colours, drifting only slightly as the reaction ages.
  float drift = 0.5 + 0.5 * sin(time * 0.05);
  vec3 rest = mix(vec3(0.80, 0.30, 0.12), vec3(0.74, 0.21, 0.16), drift);
  vec3 blue = mix(vec3(0.10, 0.19, 0.50), vec3(0.16, 0.16, 0.48), drift);
  vec3 edge = vec3(0.50, 0.68, 0.92);

  float ox = smoothstep(0.12, 0.8, u);
  float tail = smoothstep(0.05, 0.6, v) * (1.0 - ox);
  vec3 col = mix(rest, blue, ox);
  col = mix(col, mix(rest, blue, 0.35) * 0.95, tail * 0.55);
  float lead = ox * (1.0 - smoothstep(0.02, 0.3, v));
  col = mix(col, edge, lead * 0.55);

  // Back-lit dish: brighter centre, soft vignette, a little film grain.
  vec2 qv = (uv - 0.5) * vec2(view.x / view.y, 1.0);
  float light = 1.08 - 0.55 * dot(qv, qv);
  col *= light;
  col += (hash(gl_FragCoord.xy + fract(time) * 97.0) - 0.5) * 0.035;
  o = vec4(pow(max(col, 0.0), vec3(0.95)), 1.0);
}`;

type Pacemaker = { x: number; y: number; period: number; next: number; until: number };

export default function BZReaction({ host }: { host: RefObject<HTMLElement> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const el = host.current!;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return; // CSS background stays as the fallback
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Model parameters (grid units).
    const P = { dt: 0.0025, D: 30, eps: 0.02, a: 0.75, b: 0.06, k: 2.4 };
    const SCALE = 2; // CSS px per grid cell
    const MODEL_PER_SEC = 1.6; // how fast model time runs

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

    const addPacemaker = (x: number, y: number) => {
      // Real pacemakers fire at slightly different rates, which is what gives the cusps
      // where two families of rings collide.
      pacemakers.push({ x, y, period: 1.4 + Math.random() * 0.6, next: simTime, until: -1 });
      if (pacemakers.length > 14) pacemakers.shift();
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
          if (simTime >= pm.next) {
            pm.until = simTime + 0.04; // hold the stimulus briefly so the wave can take hold
            pm.next = simTime + pm.period;
          }
          if (simTime < pm.until && stims.length < 8) stims.push([pm.x * cols, (1 - pm.y) * rows, 6]);
        }
        step(stims);
        simTime += P.dt;
      }
      render();
    };

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      const box = canvas.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width;
      const y = (e.clientY - box.top) / box.height;
      addPacemaker(x, y);
      // The disturbance seeds new pacemakers elsewhere in the dish over the next seconds.
      const spawn = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < spawn; i++) {
        timers.push(
          window.setTimeout(() => addPacemaker(0.05 + Math.random() * 0.9, 0.05 + Math.random() * 0.9), 1800 + Math.random() * 3500),
        );
      }
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
