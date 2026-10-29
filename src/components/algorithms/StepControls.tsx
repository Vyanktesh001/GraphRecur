import { Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';
import type { StepPlayer } from '../../hooks/useStepPlayer';
import { Button } from '../ui/Button';

export const SPEEDS = [
  { label: 'Slow', ms: 1600 },
  { label: 'Normal', ms: 900 },
  { label: 'Fast', ms: 350 },
] as const;

interface Props {
  player: StepPlayer<unknown>;
  speedMs: number;
  onSpeedChange: (ms: number) => void;
}

/** Play / Pause / Previous / Next / Reset plus a scrubber. All of them only move an index over recorded steps. */
export function StepControls({ player, speedMs, onSpeedChange }: Props) {
  const last = Math.max(0, player.total - 1);
  return (
    <div className="space-y-3" role="group" aria-label="Step controls">
      <div className="flex flex-wrap items-center gap-2">
        <Button icon={RotateCcw} onClick={player.reset} disabled={player.isFirst && !player.playing}>
          Reset
        </Button>
        <Button icon={StepBack} onClick={player.prev} disabled={player.isFirst}>
          Previous step
        </Button>
        {player.playing ? (
          <Button variant="primary" icon={Pause} onClick={player.pause}>
            Pause
          </Button>
        ) : (
          <Button variant="primary" icon={Play} onClick={player.play} disabled={player.total <= 1}>
            {player.isLast && player.total > 1 ? 'Replay' : 'Play'}
          </Button>
        )}
        <Button icon={StepForward} onClick={player.next} disabled={player.isLast}>
          Next step
        </Button>
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          Speed
          <select
            value={speedMs}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          >
            {SPEEDS.map((s) => (
              <option key={s.ms} value={s.ms}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 shrink-0 text-sm font-medium text-navy-900" aria-live="polite">
          Step {player.total === 0 ? 0 : player.index + 1} of {player.total}
        </span>
        <input
          type="range"
          min={0}
          max={last}
          value={player.index}
          onChange={(e) => player.goTo(Number(e.target.value))}
          aria-label="Jump to step"
          disabled={player.total <= 1}
          className="h-2 w-full cursor-pointer accent-navy-800"
        />
      </div>
    </div>
  );
}
