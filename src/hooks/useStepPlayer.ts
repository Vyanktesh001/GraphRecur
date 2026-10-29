import { useCallback, useEffect, useState } from 'react';

interface PlayerState<T> {
  items: readonly T[];
  index: number;
  playing: boolean;
}

export interface StepPlayer<T> {
  index: number;
  total: number;
  item: T | undefined;
  playing: boolean;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  prev: () => void;
  reset: () => void;
  goTo: (index: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

/**
 * Navigates a list of PRE-RECORDED items (algorithm steps). Previous/Next only change an
 * index into the recorded list, so going backwards never re-runs anything. When the `items`
 * array changes (a new run), the player returns to the first item and stops.
 */
export function useStepPlayer<T>(items: readonly T[], intervalMs = 900): StepPlayer<T> {
  const [state, setState] = useState<PlayerState<T>>({ items, index: 0, playing: false });
  const current: PlayerState<T> = state.items === items ? state : { items, index: 0, playing: false };
  const total = items.length;

  const update = useCallback(
    (fn: (s: PlayerState<T>) => Partial<PlayerState<T>>) =>
      setState((prev) => {
        const base: PlayerState<T> = prev.items === items ? prev : { items, index: 0, playing: false };
        return { ...base, ...fn(base) };
      }),
    [items],
  );

  const next = useCallback(
    () => update((s) => (s.index < items.length - 1 ? { index: s.index + 1 } : { playing: false })),
    [update, items.length],
  );
  const prev = useCallback(() => update((s) => ({ index: Math.max(0, s.index - 1), playing: false })), [update]);
  const reset = useCallback(() => update(() => ({ index: 0, playing: false })), [update]);
  const goTo = useCallback(
    (i: number) => update(() => ({ index: Math.min(Math.max(0, Math.floor(i)), Math.max(0, items.length - 1)), playing: false })),
    [update, items.length],
  );
  const play = useCallback(
    () => update((s) => (items.length <= 1 ? { playing: false } : s.index >= items.length - 1 ? { index: 0, playing: true } : { playing: true })),
    [update, items.length],
  );
  const pause = useCallback(() => update(() => ({ playing: false })), [update]);
  const toggle = useCallback(() => (current.playing ? pause() : play()), [current.playing, pause, play]);

  useEffect(() => {
    if (!current.playing) return;
    const id = window.setInterval(() => {
      setState((prevState) => {
        const base: PlayerState<T> = prevState.items === items ? prevState : { items, index: 0, playing: false };
        if (!base.playing) return base;
        if (base.index >= items.length - 1) return { ...base, playing: false };
        return { ...base, index: base.index + 1 };
      });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [current.playing, intervalMs, items]);

  return {
    index: current.index,
    total,
    item: items[current.index],
    playing: current.playing,
    isFirst: current.index === 0,
    isLast: total === 0 || current.index >= total - 1,
    next,
    prev,
    reset,
    goTo,
    play,
    pause,
    toggle,
  };
}
