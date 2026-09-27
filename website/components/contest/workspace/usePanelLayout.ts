'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';

export type PanelName = 'editorial' | 'solution' | 'tests';
type MinimizedState = Record<PanelName, boolean>;

const DEFAULT_LEFT_SIZE = 54;
const DEFAULT_SOLUTION_SIZE = 64;
const DEFAULT_COMMENT_SIZE = 272;
export const LAYOUT_STORAGE_KEY = 'cccsolutions-solution-layout-v1';
const DEFAULT_MINIMIZED: MinimizedState = {
  editorial: false,
  solution: false,
  tests: false,
};

export const LEFT_SIZE_RANGE = [28, 72] as const;
export const SOLUTION_SIZE_RANGE = [30, 78] as const;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Panel sizes, comment width and minimized panels, saved to localStorage across reloads.
export function usePanelLayout() {
  const [minimized, setMinimized] = useState<MinimizedState>(DEFAULT_MINIMIZED);
  const [fullscreen, setFullscreen] = useState<PanelName | null>(null);
  const [leftSize, setLeftSize] = useState(DEFAULT_LEFT_SIZE);
  const [solutionSize, setSolutionSize] = useState(DEFAULT_SOLUTION_SIZE);
  const [commentSize, setCommentSize] = useState(DEFAULT_COMMENT_SIZE);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const editorialPanelRef = useRef<HTMLDivElement>(null);
  const solutionPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const layout = JSON.parse(saved) as {
          leftSize?: number;
          solutionSize?: number;
          commentSize?: number;
          minimized?: Partial<MinimizedState>;
        };
        if (typeof layout.leftSize === 'number') {
          setLeftSize(clamp(layout.leftSize, ...LEFT_SIZE_RANGE));
        }
        if (typeof layout.solutionSize === 'number') {
          setSolutionSize(clamp(layout.solutionSize, ...SOLUTION_SIZE_RANGE));
        }
        if (typeof layout.commentSize === 'number') {
          setCommentSize(clamp(layout.commentSize, 176, 440));
        }
        if (layout.minimized) {
          const restored = { ...DEFAULT_MINIMIZED, ...layout.minimized };
          if (restored.solution && restored.tests) restored.tests = false;
          setMinimized(restored);
        }
      }
    } catch {
      try {
        window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
      } catch {}
    } finally {
      setLayoutLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!layoutLoaded) return;
    try {
      window.localStorage.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify({ leftSize, solutionSize, commentSize, minimized })
      );
    } catch {}
  }, [commentSize, layoutLoaded, leftSize, minimized, solutionSize]);

  const toggleMinimized = (panel: PanelName) => {
    setFullscreen(null);
    setMinimized((current) => {
      const next = {
        ...current,
        [panel]: fullscreen === panel ? true : !current[panel],
      };

      // At least one of Solution or Test cases stays open.
      if (next.solution && next.tests) {
        const otherPanel = panel === 'solution' ? 'tests' : 'solution';
        next[otherPanel] = false;
      }

      return next;
    });
  };

  const toggleFullscreen = (panel: PanelName) => {
    setFullscreen((current) => (current === panel ? null : panel));
  };

  const resetLayout = () => {
    setMinimized(DEFAULT_MINIMIZED);
    setFullscreen(null);
    setLeftSize(DEFAULT_LEFT_SIZE);
    setSolutionSize(DEFAULT_SOLUTION_SIZE);
    setCommentSize(DEFAULT_COMMENT_SIZE);
    try {
      window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch {}
  };

  const startResize = (
    axis: 'vertical' | 'horizontal',
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    const container = axis === 'vertical' ? desktopRef.current : rightColumnRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    // While dragging, size the panel element directly so React doesn't re-render the panels
    // (and their highlighted code) on every pointer move. State and localStorage update on release.
    const panel = axis === 'vertical' ? editorialPanelRef.current : solutionPanelRef.current;
    let size: number | null = null;
    let frame = 0;

    const move = (pointerEvent: PointerEvent) => {
      size =
        axis === 'vertical'
          ? clamp(((pointerEvent.clientX - rect.left) / rect.width) * 100, ...LEFT_SIZE_RANGE)
          : clamp(((pointerEvent.clientY - rect.top) / rect.height) * 100, ...SOLUTION_SIZE_RANGE);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!panel || size === null) return;
        if (axis === 'vertical') panel.style.width = `${size}%`;
        else panel.style.height = `${size}%`;
      });
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      if (size !== null) {
        if (axis === 'vertical') setLeftSize(size);
        else setSolutionSize(size);
      }
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return {
    minimized,
    fullscreen,
    leftSize,
    setLeftSize,
    solutionSize,
    setSolutionSize,
    commentSize,
    setCommentSize,
    desktopRef,
    rightColumnRef,
    editorialPanelRef,
    solutionPanelRef,
    toggleMinimized,
    toggleFullscreen,
    resetLayout,
    startResize,
  };
}
