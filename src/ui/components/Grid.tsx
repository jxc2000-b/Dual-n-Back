import type { Position } from '@app-types';
import './Grid.css';

// SKELETON — render 9 cells, highlight the active one when stim is visible.
// UI agent: add subtle stim animation (scale-in 80ms, hold, fade-out).
// See PLAN.md → "UI / Components / Grid".

export interface GridProps {
  /** The cell currently lit. null when no stim is showing. */
  activeCell: Position | null;
  /** Optional fixed visual size in pixels. Defaults to a responsive clamp(). */
  size?: number;
}

const CELLS: Position[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function Grid({ activeCell, size }: GridProps) {
  const style = size != null ? { width: size, height: size } : undefined;
  return (
    <div
      className="grid"
      style={style}
      role="img"
      aria-label="Dual N-Back grid"
    >
      {CELLS.map((c) => (
        <div
          key={c}
          className={`grid__cell${activeCell === c ? ' grid__cell--active' : ''}`}
          data-cell={c}
        />
      ))}
    </div>
  );
}
