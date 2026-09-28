'use client';

import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../lib/utils';

// Opens on mouse hover, keyboard focus and touch tap. Closes on Escape and a click outside.
// Hover-only popovers never open on touch screens (see website/AGENTS.md).
// The content renders in a portal so overflow-hidden panels can't clip it.

const GAP = 6;
const VIEWPORT_MARGIN = 8;
const CLOSE_DELAY_MS = 100;

type Side = 'top' | 'bottom';

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
  triggerClassName,
}: {
  content: ReactNode;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  side?: Side;
  className?: string;
  triggerClassName?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const show = () => {
    cancelClose();
    setOpen(true);
  };

  const hide = () => {
    cancelClose();
    setOpen(false);
  };

  const hideSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = contentRef.current;
    if (!trigger || !tip) return;
    const t = trigger.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;

    let top = side === 'top' ? t.top - GAP - h : t.bottom + GAP;
    if (side === 'top' && top < VIEWPORT_MARGIN) top = t.bottom + GAP;
    if (side === 'bottom' && top + h > window.innerHeight - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, t.top - GAP - h);
    }

    const maxLeft = window.innerWidth - VIEWPORT_MARGIN - w;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(t.left + t.width / 2 - w / 2, maxLeft));
    setPosition({ top, left });
  }, [side]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const hide = () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return;
      hide();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => cancelClose, []);

  const isMouse = (e: ReactPointerEvent) => e.pointerType === 'mouse';

  return (
    <span
      ref={triggerRef}
      className={cn('inline-flex', triggerClassName)}
      onPointerEnter={(e) => isMouse(e) && show()}
      onPointerLeave={(e) => isMouse(e) && hideSoon()}
      onPointerUp={(e) => {
        // React bubbles portal events to this span, so ignore taps inside the content.
        if (isMouse(e) || contentRef.current?.contains(e.target as Node)) return;
        if (open) hide();
        else show();
      }}
      onFocus={(e) => {
        if (e.target.matches(':focus-visible')) show();
      }}
      onBlur={hide}
    >
      {cloneElement(children, { 'aria-describedby': open ? id : undefined })}
      {open &&
        createPortal(
          <div
            ref={contentRef}
            id={id}
            role="tooltip"
            onPointerEnter={(e) => isMouse(e) && cancelClose()}
            onPointerLeave={(e) => isMouse(e) && hideSoon()}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
            className={cn(
              'fixed z-50 max-w-xs px-2 py-1 text-xs font-normal text-left whitespace-normal rounded-md border border-border-default bg-surface-100 text-foreground-light shadow-md',
              className
            )}
          >
            {content}
          </div>,
          document.body
        )}
    </span>
  );
}
