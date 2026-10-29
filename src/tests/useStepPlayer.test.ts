import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bfs } from '../algorithms/bfs';
import { useStepPlayer } from '../hooks/useStepPlayer';
import { makeGraph } from './helpers';

describe('useStepPlayer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const items = ['a', 'b', 'c', 'd'];

  it('moves forward and BACKWARD through recorded items', () => {
    const { result } = renderHook(() => useStepPlayer(items));
    expect(result.current.item).toBe('a');
    expect(result.current.isFirst).toBe(true);
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.item).toBe('c');
    act(() => result.current.prev());
    expect(result.current.item).toBe('b');
    act(() => result.current.prev());
    act(() => result.current.prev());
    expect(result.current.item).toBe('a'); // clamps at the first step
  });

  it('clamps at the last step and reports isLast', () => {
    const { result } = renderHook(() => useStepPlayer(items));
    for (let i = 0; i < 10; i += 1) act(() => result.current.next());
    expect(result.current.index).toBe(3);
    expect(result.current.isLast).toBe(true);
  });

  it('reset returns to the first step and goTo jumps', () => {
    const { result } = renderHook(() => useStepPlayer(items));
    act(() => result.current.goTo(2));
    expect(result.current.item).toBe('c');
    act(() => result.current.goTo(99));
    expect(result.current.item).toBe('d');
    act(() => result.current.reset());
    expect(result.current.index).toBe(0);
  });

  it('plays automatically, stops at the end, and can be paused', () => {
    const { result } = renderHook(() => useStepPlayer(items, 100));
    act(() => result.current.play());
    expect(result.current.playing).toBe(true);
    act(() => void vi.advanceTimersByTime(100));
    expect(result.current.index).toBe(1);
    act(() => result.current.pause());
    act(() => void vi.advanceTimersByTime(500));
    expect(result.current.index).toBe(1);
    act(() => result.current.play());
    act(() => void vi.advanceTimersByTime(1000));
    expect(result.current.index).toBe(3);
    expect(result.current.playing).toBe(false);
  });

  it('manual navigation pauses playback', () => {
    const { result } = renderHook(() => useStepPlayer(items, 100));
    act(() => result.current.play());
    act(() => result.current.prev());
    expect(result.current.playing).toBe(false);
  });

  it('starts over when the recorded list changes (new run)', () => {
    const { result, rerender } = renderHook(({ list }) => useStepPlayer(list), { initialProps: { list: items } });
    act(() => result.current.goTo(3));
    rerender({ list: ['x', 'y'] });
    expect(result.current.index).toBe(0);
    expect(result.current.item).toBe('x');
    expect(result.current.total).toBe(2);
  });

  it('handles an empty list', () => {
    const { result } = renderHook(() => useStepPlayer<string>([]));
    expect(result.current.item).toBeUndefined();
    expect(result.current.isLast).toBe(true);
    act(() => result.current.next());
    expect(result.current.index).toBe(0);
  });

  it('Previous after Next shows exactly the same recorded BFS snapshot (no recomputation)', () => {
    const g = makeGraph(['A', 'B', 'C', 'D', 'E'], [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']]);
    const trace = bfs(g, 'A');
    const { result } = renderHook(() => useStepPlayer(trace.steps));
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    const atThree = result.current.item;
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.prev());
    act(() => result.current.prev());
    expect(result.current.index).toBe(3);
    expect(result.current.item).toBe(atThree); // same object: snapshot reuse
    expect(result.current.item).toBe(trace.steps[3]);
  });
});
