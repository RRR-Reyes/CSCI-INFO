# LearnCS

Learn everything you need to know about the CS/IT major for DSU! 
This includes a range of lower- and upper-level classes with interactive visuals!
Look around to see what you can expect when you take these courses in the future!

Started as a copy of [ReviewApp](https://github.com/RRR-Reyes/ReviewApp), keeping the
chapter engine and visuals and leaving the question banks and practice drawer behind.

## Run

```bash
npm install
npm start        # http://localhost:3000
```

## Hosting

The site is hosted on **Cloudflare Pages** at **https://typeurl.pages.dev**, rebuilt on every push
to `main` (build command `npm run build`, output directory `build`). It is not on GitHub Pages.
See "Hosting and deployment" in `HANDOFF.md` for the gotchas.

## Where things live

- `src/courses/`: course and unit data. `discrete.ts` is the full scrolling-chapter shape
  (sections with reading, `\( … \)` LaTeX, checks, a visual and a tile thumbnail);
  `data.ts` and `system.ts` still use the lighter one-visual-per-unit lesson shape.
- `src/visuals/`: one component per visual. Wrap the display part of a visual in
  `<Stage>` and export it with `split(...)` to keep its controls in the reading and draw
  only the display on the right (see `ExpectedDie.tsx`).
- `src/components/CoursePage.tsx`: the chapter page; `src/useActiveSection.ts`: which
  section owns the right column as you scroll.

Layout and mechanics inspired by [Seeing Theory](https://seeing-theory.brown.edu/)
(Brown University, Apache-2.0). Icons: [Phosphor](https://phosphoricons.com/) (MIT).
Math: [KaTeX](https://katex.org/) (MIT). Font: Assistant (OFL).
