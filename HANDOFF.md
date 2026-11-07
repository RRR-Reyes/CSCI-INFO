# Handoff: CSCI-INFO (formerly LearnCS; Seeing Theory–style visual CS chapters)

_Last updated: 2026-11-07. Written for the next Claude session picking this up._

## Hosting and deployment (read this first)

- **The live site runs on Cloudflare Pages, not GitHub Pages.** The main link is
  **https://csci-info.pages.dev**. Give students that link.
  (An earlier Pages project, `typeurl`, is retired; ignore `typeurl.pages.dev`.)
- The Pages project is connected to `RRR-Reyes/LearnCS`. Production branch is `main`, and every
  push to `main` redeploys automatically.
- Cloudflare build settings: build command `npm run build`, build output directory `build`,
  root directory blank. If these are blank, Cloudflare skips the build and deploys the raw repo,
  and the site returns an empty 404 (this happened once).
- `homepage` in `package.json` is `""`, so the build loads its files from `/`. Do not set it
  back to a `/LearnCS` path or a github.io URL, and do not add `public/CNAME` (it is a
  GitHub Pages file and was deleted on purpose).
- Routing uses the URL hash (`#/discrete/sets`), so no redirect rules are needed.
- `.github/workflows/deploy.yml` is a leftover GitHub Pages workflow. GitHub Pages is **not** in
  use. Ignore it, or delete it if it causes failing checks.
- Cloudflare's build image uses npm 10. `package-lock.json` must stay installable with npm 10
  (`npm ci`); a lock file written by npm 11 failed there with "Missing: yaml@2.9.1 from lock file".
  If that error comes back, regenerate with `npm install --package-lock-only` on npm 10.
- Tried and abandoned: `click.soon.it` on FreeDNS. That shared dynamic-DNS domain refuses CNAME
  records and GitHub could not issue a certificate for it, so students saw "Not secure".
- If a Cloudflare Access policy is turned on for the project (Settings → General), preview
  deployment URLs redirect to a sign-in page. Keep it off.

## The goal (in the owner's words, summarized)

The site was renamed from LearnCS to **CSCI-INFO** (2026-11-07). The GitHub repo is still `RRR-Reyes/LearnCS`,
and `package.json` still says `learncs`; both are internal and were left alone on purpose.

CSCI-INFO is a **visualization tool for students**, not a Q&A review site. It was split off
from the owner's personal ReviewApp (`C:\Users\User\IdeaProjects\ReviewApp`) so ReviewApp
keeps its question banks while LearnCS goes visual-first.

The model is **Seeing Theory** (https://seeing-theory.brown.edu). A local copy of its source
is at `C:\Users\User\IdeaProjects\seeing-theory`; the mechanics are in `js/chapter.js` and the
layout in `css/chapter-style.css`:

- One long scroll per unit. The left 40% is a tinted reading column that scrolls.
- The right 60% is **fixed to the window and never moves**. Each concept's visual lives
  there; scrolling only switches which one is visible.
- The intro shows section tiles (number, title, small clipart) on the right.
- Copy the **design and mechanics**, not Seeing Theory's text.

Owner feedback so far:
- Visual-first, with "quick checks" (inline multiple choice) but no question banks, review bell or practice drawer.
- **Sharp** corners and the Assistant font. They dislike rounded, bubbly fonts and pills.
- LaTeX for math, open-source clipart for tile thumbnails.
- Visuals should feel like **physical toys and instruments**, not rows of buttons. The house
  style is now **wood**: oak (0) and walnut (1) flip tiles with white digits, a cream "shelf"
  board with a dark wood lip, brass pipes, pegs and borders. They want **colors, not textures**:
  no wood grain and no line across the middle of a tile.
- **One idea at a time:** a section's tool should only offer what the reading has introduced
  so far, and by the end of a unit everything is available (see the staged tools below).
- Each section's visual must **match its own reading**. They noticed when one didn't.
- They liked Clawd (the Claude Code mascot) as a recolorable, fidgeting character in the color tool.

## Repo state

- Folder: `C:\Users\User\IdeaProjects\LearnCS`, git repo on `main`, **no remote, nothing pushed**.
- Commits, oldest first:
  1. `4eaee12` Start LearnCS: Seeing Theory-style visual chapters
  2. `458241a` Split Discrete visuals into reading controls and a fixed stage
  3. `eb911f0` Make Module 2 visuals physical, add visual lab and float explorer
  4. `7dcaf7d` Give every System Architecture section a visual that matches its reading
  5. (this HANDOFF update, if committed)
- Commit messages must end with the attribution line from the session's system reminder.
- `node_modules` was copied from ReviewApp, so `npm start` works as is.
- `package.json` name is `learncs`. `homepage` is `""`, so the dev server and the build both serve
  the app at the root, `/` (see "Hosting and deployment" above).
- **Don't modify ReviewApp.** It has the owner's uncommitted edits and a tracked `build/` folder.
  Reading it is fine: its question bank `src/modules/system/questions.ts` is the best record of
  what the System Architecture course actually tests.
- `.claude/launch.json` in this repo starts the dev server (`learncs`, port 3005).
- `notes/system-architecture-audit.md`: section-by-section audit of System Architecture against
  its visuals and the course bank, with a status block. Everything in it is done except an
  optional Luhn checksum section.

## Architecture

- `src/courses/`
  - `types.ts`: `Course`, `Unit`, `Section`, `Lesson`, `Checkpoint`, `Thumb`.
  - `index.ts`: `COURSES` (Discrete, Data Structures, Systems), `unitHue`, and `sectionsOf(unit)`,
    which turns old-style `lessons` units into one section per lesson that shares the unit's visual.
  - `discrete.ts`: 6 units, 18 sections, full section shape with thumbnails and split visuals.
  - `system.ts`: **5 modules, 20 sections, full section shape with one visual per section**
    (no thumbnails yet). See the table below.
  - `data.ts`: still the older shape (`lessons` plus one whole-unit `Visual`). It has not been
    audited or converted.
- `src/components/CoursePage.tsx`: the chapter. Fixed header with progress bar, `.st-left`
  reading column, `.st-right` fixed stage column, intro tiles, previous/next footer. At 960px or
  narrower, visuals render inline under each section.
- `src/components/Lab.tsx` (**#/lab**): a test bench listing every visual from every course once
  (deduplicated by component), with a course filter and a name search. Routed in `App.tsx`
  (`courseId === "lab"`). Open http://localhost:3005/#/lab. Visuals render in place there,
  so split visuals show their stage under their controls.
- `src/useActiveSection.ts`: the active section is the last one whose top crossed 45% of the viewport.
- `src/visuals/Stage.tsx`: `<Stage>` portals a split visual's display into the right column;
  `split(Component)` marks it. The convention is that controls stay outside `<Stage>` and
  displays go inside. The System Architecture visuals are **not split**: each is drawn whole on the right.
- **Per-section variants of one tool** are made with tiny wrapper components, because
  `Section.Visual` takes no props. For example `bitwiseStage(ops, fresh)` in `BitwiseOps.tsx`,
  `BitsPositional`/`BitsSigned`/`BitsExtend` in `BitFlipper.tsx`, `CallStepper` in
  `MipsStepper.tsx`, `ArrayToMips` in `ArrayAddress.tsx`. Define them at module level (stable
  identity) so they don't remount.
- `src/components/MathText.tsx`: KaTeX. `\( … \)` inline, a paragraph that is only `\[ … \]`
  is a display formula. In `.ts` files write `\\(`.
- Styling: one file, `src/styles.css`. New blocks are appended at the end with a comment header
  per visual (`/* float builder */`, `/* hi/lo machine */`, …).

### System Architecture sections and visuals

| Module | Section | Visual (file) |
|---|---|---|
| 1 Number Systems | Positional notation | `BitsPositional` (BitFlipper): unsigned, nibble brackets → hex digit |
| | Two's complement | `BitsSigned`: −2⁷ weight, Invert, Negate |
| | Extension and overflow | `BitsExtend`: starts 4-bit, sign/zero-extend to 8, ±1 overflow |
| 2 Data Representation | Text: ASCII | `AsciiTool`: type a word, flip a char's 7 bits, case bit (32) |
| | Color: RGB | `ColorTool` + `Clawd`: color wheel, channels as bits and hex |
| | Error detection | `HammingCode` (+ `hammingLogic.ts`): wood tiles, brass check pipes, syndrome lamps |
| | Information | `InfoGame`: halving yes/no questions, answers spell the number in binary |
| | Special float values | `FloatExplorer`: flip bits → value, 16/32-bit, ∞/NaN presets (decode) |
| 3 MIPS Instructions | Logic: and, or → Shifting right (4 sections) | `bitwiseStage(...)`: chips grow per stage, new ones get an orange dot |
| | Multiply and divide | `HiLoMachine`: mult/div fill HI and LO, mfhi/mflo lines |
| | Branches | `BranchViz`: beq/bne, offset slider, PC + 4 + offset × 4 |
| | Instruction encoding | `InstrDecoder`: hex word → R/I/J fields → assembly, random R-type |
| | Floating-point fields | `FloatBuilder`: number → bits in five steps, 32/16-bit, rounding (encode) |
| 4 MIPS Program Simulation | Tracing a program | `MipsStepper` (loop program) |
| | Subroutines | `CallStepper`: jal, jr $ra, $ra saved on the stack |
| 5 C to Assembly & Memory | Addressing arrays | `ArrayAddress` |
| | From C to MIPS | `ArrayToMips`: generated MIPS with live register values |

### Shared wood-style pieces (reuse these)

- `.flip-inner` + `.flip-face.flip-front` (0, oak) / `.flip-back` (1, walnut): a two-sided tile
  that rotates on `rotateX(180deg)` when its container has `.is-on`. Containers: `.flip-card`
  (BitFlipper, large), `.hm-tile` (Hamming), `.fx-tile` (floats), `.hl-tile` (small; add
  `.is-btn` when it is a button).
- Per-tile shade variation: inline `--wh` (hue shift) and `--wl` (lightness shift) cycling over
  `[-3, 2, 5, -1]` / `[2%, -2%, 1%, -3%]`.
- Board: `linear-gradient(180deg, hsl(36 40% 90%), hsl(34 34% 84%))` with a
  `border-bottom: 4–6px solid hsl(26 38% 36%)`. Brass: `hsl(40 70% 58%)`. Group colors used
  for fields: sign/red `hsl(2 75% 52%)`, exponent/green `hsl(140 55% 38%)`, mantissa/blue `hsl(212 80% 50%)`.
- `.fx-group.is-sign/.is-exp/.is-man` + `.fx-label` + `.fx-tiles`: labeled, color-topped bit groups.
- `.chip.is-new`: orange dot for what a stage just introduced.

## Verification done (2026-10-18)

- The dev server's type checker reports "No issues found" (read it with `preview_logs`).
- Production build into a temp folder compiles with no warnings (~190 kB JS gzip).
- In the browser pane, every System Architecture section renders a visual, with zero console
  errors. Values were checked: float32 and half-float encodings against real bit patterns,
  Hamming syndromes, HI/LO for mult/div and divide by zero, branch targets, decoder presets
  (add/sll/lw/beq/jal), the subroutine trace ($ra = 0x40001c after `jal twice`, result 11),
  array MIPS (A[1][2] → 0x2018), the ASCII case bit, the information game, and sign/zero extension.
- At 375px: no horizontal scroll on the pages checked (Hamming, lab, color tool).

## Commands

```bash
cd /c/Users/User/IdeaProjects/LearnCS
PORT=3005 BROWSER=none npm start       # http://localhost:3005/#/system/numbers
BUILD_PATH="$HOME/AppData/Local/Temp/learncs-build" npx react-scripts build
```

**Type checking:** don't trust `npx tsc` here. TS 4.4 hits syntax errors in newer `node_modules/@types`
files and never reports `src` errors, so it looks clean when it isn't. The dev server's checker
(fork-ts-checker) is the real one: after an edit, its log ends with "No issues found" or lists
`ERROR in src/...`. A production build also catches them. Known trap: spreading a `Set` or a
`Map` iterator (`[...set]`) needs `downlevelIteration`, so use `Array.from(...)`.

In the desktop app, `preview_start` with name `learncs` uses this repo's `.claude/launch.json`.

## Gotchas

- **Hash changes don't always re-render in the browser pane.** After changing the hash,
  dispatch `new HashChangeEvent('hashchange')` (or reload), and after `scrollTo` dispatch
  `new Event('scroll')`. Screenshots from the pane are sometimes stale or mid-animation, so take
  another before trusting a visual bug. Read values from the DOM with `javascript_tool` when you can.
- Viewport emulation at 1440 sometimes crops the screenshot. The pane's own size (~800px)
  shows the narrow inline layout, where every section's visual is under its text.
- **Shell quoting eats backslashes.** There is no Python. For edits that contain `\\(`, `\n` in
  JSX strings or template literals, use the Edit/Write tools or a `.js` script file. A `"\\n"`
  written through a heredoc script once became a raw newline inside a JSX string and broke the build.
- A CSS `animation` that sets `transform` on an SVG `<g>` that has a `transform=` attribute
  overrides it (this once sent everything to the origin). Animate a child element, or use
  `style.transform` with `transform-box: fill-box` (as `Clawd.tsx` does).
- The ESLint config doesn't load `react-hooks`, so `// eslint-disable-next-line react-hooks/...` fails the build.
- `git` warns that LF will become CRLF. It's harmless.
- Old CSS from ReviewApp (`.chapter`, `.lesson`, `.viz-panel`, `.foot-link`, `.unit-chip`) is still in `styles.css` but unused.

## Discrete Module 1 (Logic & Arithmetic), reworked 2026-10-18

The owner asked for Discrete to keep its **own look, not the wood style**, and for tools students can
play with instead of fixed lists.
- `src/visuals/logic/prop.ts`: propositional engine. It parses typed input (symbols or ASCII such as
  `->`, `and`, `~`), evaluates, lists sub-expressions innermost first, and applies one law at a
  time (`pushNot`, `onlyAndOrNot`, `dual`, `negate`). `show()` always parenthesizes mixed operators.
- `src/visuals/logic/pred.ts`: a safe predicate parser in x and y for quantifiers (no eval).
- `src/visuals/logic/ExprInput.tsx`: the symbol keypad and expression field (caret-aware insert, errors point at the position).
- `TruthTable.tsx`: the student types any expression (up to 4 variables) and gets one column per step.
- `LogicLab.tsx`: Equivalence (A vs B, law presets, rewrite buttons, counterexample row) and
  Quantifiers (own predicate, ∀/∃ for x and y, swap order, negate, adjustable domain, 2D grid with witnesses ringed).
- `ExprTree.tsx`: tidy layout (leaves get columns, operators centered), so wide trees no longer clip.
- Styles: `/* logic: symbol keypad, expression fields, step-by-step tables */` in `styles.css` (classes `lk-`, `lt-`, `lq-`), using the unit's `--accent`.

## Suggested next steps (ask the owner first)

1. Owner review of the new System Architecture visuals. Expect style feedback (they care about
   look and feel) and requests to make tools match the reading more closely.
2. Optional Luhn checksum section after Hamming (the course bank tests it).
3. Audit Data Structures (`data.ts`) the same way as System Architecture: convert it to sections,
   give each a matching visual, compare with ReviewApp's `src/modules/data/questions.ts`.
4. Consider bringing Discrete's visuals into the wood style, but only if the owner asks.
5. Home page still has ReviewApp's dark dot-field hero and rounded Nunito tiles. Confirm before redesigning.
6. Section thumbnails for System Architecture and Data Structures.
7. ~~Create a GitHub repo and set up hosting~~ Done: GitHub repo exists, hosting is Cloudflare Pages at csci-info.pages.dev.
8. Delete the dead CSS.
