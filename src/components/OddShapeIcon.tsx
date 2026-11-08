import { COURSES } from "../courses";
import { ODD_SHAPES } from "./oddShapes";

/** Index of a unit across every course, so each unit keeps one shape wherever it's shown. */
export const unitShapeIndex = (courseIndex: number, unitIndex: number) =>
  COURSES.slice(0, courseIndex).reduce((t, c) => t + c.units.length, 0) + unitIndex;

/** An unusual shape, filled (or traced) with a gradient from --shape-from to --shape-to. */
export function OddShapeIcon({ k, id, className }: { k: number; id: string; className: string }) {
  const s = ODD_SHAPES[k % ODD_SHAPES.length];
  const grad = `odd-${id}`;
  return (
    <span className={className} title={s.name}>
      <svg viewBox="0 0 100 100" role="img" aria-label={s.name}>
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--shape-from)" }} />
            <stop offset="1" style={{ stopColor: "var(--shape-to)" }} />
          </linearGradient>
        </defs>
        <path
          d={s.d}
          fill={s.stroke ? "none" : `url(#${grad})`}
          stroke={s.stroke ? `url(#${grad})` : "none"}
          strokeWidth={s.stroke ? 4 : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
          fillRule={s.evenodd ? "evenodd" : "nonzero"}
        />
      </svg>
    </span>
  );
}
