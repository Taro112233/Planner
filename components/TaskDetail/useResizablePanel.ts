// components/TaskDetail/useResizablePanel.ts
// Drag-to-resize for the task slide-over. The panel is anchored to the right
// edge, so the width is simply the distance from the pointer to that edge.
//
// The chosen width is remembered per browser: it is a personal display
// preference, not shared state, so localStorage is the right home for it.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'planner-task-panel-width';
const MIN_WIDTH = 380;
const DEFAULT_WIDTH = 512;
/** Never eat the whole viewport — the board behind stays reachable. */
const VIEWPORT_MARGIN = 120;

function clampWidth(width: number, viewportWidth: number): number {
  const max = Math.max(MIN_WIDTH, viewportWidth - VIEWPORT_MARGIN);
  return Math.min(Math.max(width, MIN_WIDTH), max);
}

export interface ResizablePanel {
  width: number;
  isResizing: boolean;
  /** Spread onto the drag handle sitting on the panel's left edge. */
  handleProps: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onDoubleClick: () => void;
  };
}

export function useResizablePanel(): ResizablePanel {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);

  // Read once on mount rather than during render: the server has no
  // localStorage, and a mismatched first paint would hydrate badly.
  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(STORAGE_KEY));
      if (Number.isFinite(stored) && stored > 0) {
        const next = clampWidth(stored, window.innerWidth);
        widthRef.current = next;
        setWidth(next);
      }
    } catch {
      // Private mode or blocked storage — the default width is fine.
    }
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    setIsResizing(true);

    const handleMove = (moveEvent: PointerEvent) => {
      const next = clampWidth(window.innerWidth - moveEvent.clientX, window.innerWidth);
      widthRef.current = next;
      setWidth(next);
    };

    const handleUp = () => {
      setIsResizing(false);
      target.releasePointerCapture?.(event.pointerId);
      target.removeEventListener('pointermove', handleMove);
      target.removeEventListener('pointerup', handleUp);
      target.removeEventListener('pointercancel', handleUp);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(widthRef.current));
      } catch {
        // Not being able to remember the width is not worth failing over.
      }
    };

    // Listening on the captured element, not the window, keeps the drag alive
    // over iframes and stops it when the pointer is lost.
    target.addEventListener('pointermove', handleMove);
    target.addEventListener('pointerup', handleUp);
    target.addEventListener('pointercancel', handleUp);
  }, []);

  /** Double-click the handle to return to the default width. */
  const onDoubleClick = useCallback(() => {
    widthRef.current = DEFAULT_WIDTH;
    setWidth(DEFAULT_WIDTH);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
    } catch {
      // ignored — see above
    }
  }, []);

  // Shrinking the window must not leave the panel wider than the viewport.
  useEffect(() => {
    const onResize = () => {
      setWidth((current) => {
        const next = clampWidth(current, window.innerWidth);
        widthRef.current = next;
        return next;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { width, isResizing, handleProps: { onPointerDown, onDoubleClick } };
}
