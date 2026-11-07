/**
 * Illustrations for the two sections under the hero: thick frosted-glass cards
 * tilted on a light stage, each holding one of the site's visuals. Line work is
 * thin navy; color comes from the home boxes' hues (228 blue for sets,
 * 158 green for bits, 22 orange for trees).
 */

/** Soft glow behind a highlighted region, shared by both illustrations. */
function Glow({ id }: { id: string }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/** "What is this?": a Venn diagram cycling through ∩, ∪ and −, a row of bits, and a small tree. */
export function AboutArt() {
  return (
    <div className="art-stage" role="img" aria-label="A Venn diagram, a row of bits and an expression tree, three of the visuals on the site">
      <div className="glass card-main">
        <svg viewBox="0 0 440 290" aria-hidden>
          <defs>
            <clipPath id="ha-a"><circle cx="160" cy="146" r="112" /></clipPath>
            <mask id="ha-d">
              <circle cx="160" cy="146" r="112" fill="#fff" />
              <circle cx="282" cy="136" r="112" fill="#000" />
            </mask>
            <linearGradient id="ha-and" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor="hsl(226 100% 74%)" />
              <stop offset="1" stopColor="hsl(222 100% 88%)" />
            </linearGradient>
            <linearGradient id="ha-or" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="hsl(226 100% 86%)" stopOpacity="0.9" />
              <stop offset="1" stopColor="hsl(222 100% 94%)" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="ha-minus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="hsl(24 100% 76%)" />
              <stop offset="1" stopColor="hsl(30 100% 88%)" />
            </linearGradient>
            <Glow id="ha-glow" />
          </defs>
          <circle className="venn-tint is-a" cx="160" cy="146" r="112" />
          <circle className="venn-tint is-b" cx="282" cy="136" r="112" />
          <g filter="url(#ha-glow)">
            <circle className="art-step s1" fill="url(#ha-and)" cx="282" cy="136" r="112" clipPath="url(#ha-a)" />
            <g className="art-step s2" fill="url(#ha-or)">
              <circle cx="160" cy="146" r="112" />
              <circle cx="282" cy="136" r="112" />
            </g>
            <circle className="art-step s3" fill="url(#ha-minus)" cx="160" cy="146" r="112" mask="url(#ha-d)" />
          </g>
          <circle className="ia-ring" cx="160" cy="146" r="112" />
          <circle className="ia-ring" cx="282" cy="136" r="112" />
          <text className="venn-letter" x="104" y="162">A</text>
          <text className="venn-letter" x="338" y="150">B</text>
        </svg>
      </div>

      <span className="glass venn-chip">
        <span className="art-step s1">A ∩ B</span>
        <span className="art-step s2">A ∪ B</span>
        <span className="art-step s3">A − B</span>
      </span>

      <div className="glass card-bits">
        {[1, 0, 1, 1].map((b, i) => (
          <span key={i} className="ia-key">
            {i === 1 ? (
              <>
                <span className="art-flip f0">0</span>
                <span className="art-flip f1">1</span>
              </>
            ) : (
              b
            )}
          </span>
        ))}
      </div>

      <div className="glass card-tree">
        <svg viewBox="40 12 160 136" aria-hidden>
          <defs>
            <radialGradient id="ha-node" cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="hsl(24 100% 88%)" />
            </radialGradient>
          </defs>
          <path className="tree-edge" d="M128 44 L76 104 M128 44 L162 116" />
          <g className="tree-node"><circle cx="128" cy="44" r="25" /><text x="128" y="52">×</text></g>
          <g className="tree-node"><circle cx="76" cy="104" r="25" /><text x="76" y="112">+</text></g>
          <g className="tree-node"><circle cx="162" cy="116" r="25" /><text x="162" y="124">2</text></g>
        </svg>
      </div>
    </div>
  );
}

/** "The goal": the same chapter open on a laptop and on a phone. */
export function GoalArt() {
  return (
    <div className="art-stage is-goal" role="img" aria-label="A chapter open on a laptop and on a phone">
      <div className="glass card-laptop">
        <svg viewBox="0 0 420 260" aria-hidden>
          <defs>
            <linearGradient id="hg-a" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="hsl(226 100% 80%)" />
              <stop offset="1" stopColor="hsl(222 100% 92%)" />
            </linearGradient>
            <linearGradient id="hg-b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="hsl(156 70% 74%)" />
              <stop offset="1" stopColor="hsl(156 70% 90%)" />
            </linearGradient>
            <Glow id="hg-glow" />
          </defs>
          <g className="lines">
            <rect x="34" y="44" width="132" height="16" rx="8" />
            <rect x="34" y="80" width="112" height="10" rx="5" />
            <rect x="34" y="100" width="124" height="10" rx="5" />
            <rect x="34" y="120" width="94" height="10" rx="5" />
            <rect x="34" y="152" width="116" height="10" rx="5" />
            <rect x="34" y="172" width="84" height="10" rx="5" />
          </g>
          <g filter="url(#hg-glow)">
            <circle className="art-pulse" fill="url(#hg-a)" cx="270" cy="130" r="62" />
            <circle className="art-pulse is-b" fill="url(#hg-b)" cx="326" cy="130" r="62" />
          </g>
          <circle className="ia-ring" cx="270" cy="130" r="62" />
          <circle className="ia-ring" cx="326" cy="130" r="62" />
        </svg>
      </div>

      <div className="glass card-phone">
        <svg viewBox="0 0 120 230" aria-hidden>
          <rect className="notch" x="44" y="12" width="32" height="6" rx="3" />
          <path className="tree-edge" d="M60 62 L36 118 M60 62 L84 118 M36 118 L24 174 M36 118 L50 174" />
          <circle className="lv2" cx="60" cy="62" r="14" />
          <circle className="lv1" cx="36" cy="118" r="13" />
          <circle className="lv0" cx="84" cy="118" r="13" />
          <circle className="lv0" cx="24" cy="174" r="12" />
          <circle className="lv0" cx="50" cy="174" r="12" />
        </svg>
      </div>
    </div>
  );
}

/** Paths for the home boxes' corner shapes, drawn in a 200 × 200 box. */
const HUB_PATHS: Record<string, { d: string; turn: number }> = {
  "shape-circle": { d: "M100 4 A96 96 0 1 1 99.9 4 Z", turn: 0 },
  "shape-triangle": { d: "M106 8 Q112 6 116 12 L194 176 Q197 186 186 188 L18 192 Q6 192 10 180 L94 14 Q98 8 106 8 Z", turn: -12 },
  "shape-hexagon": { d: "M54 12 L146 12 L194 100 L146 188 L54 188 L6 100 Z", turn: 10 },
};

/** A home box's corner shape: a smooth gradient in the box's hue (set by --h on the box). */
export function HubShape({ shape, id }: { shape: string; id: string }) {
  const { d, turn } = HUB_PATHS[shape] ?? HUB_PATHS["shape-circle"];
  return (
    <span className="hub-shape" aria-hidden>
      <svg viewBox="0 0 200 200">
        <defs>
          <linearGradient id={`hub-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="hub-shape-from" />
            <stop offset="1" className="hub-shape-to" />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#hub-${id})`} transform={`rotate(${turn} 100 100)`} />
      </svg>
    </span>
  );
}
