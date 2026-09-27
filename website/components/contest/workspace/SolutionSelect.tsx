'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import type { SolutionEntry } from '../useContestData';
import { languageLabel } from './shared';

export function SolutionSelect({
  solutions,
  value,
  onChange,
}: {
  solutions: SolutionEntry[];
  value: number;
  onChange: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(value);
  const [position, setPosition] = useState<{ top: number; left: number; minWidth: number } | null>(
    null
  );
  const selectId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const reposition = () => updatePosition();
    document.addEventListener('pointerdown', closeOnOutsideClick);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, updatePosition]);

  const choose = (index: number) => {
    onChange(index);
    setFocusedIndex(index);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveFocus = (direction: 1 | -1) => {
    setFocusedIndex((current) => (current + direction + solutions.length) % solutions.length);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setFocusedIndex(value);
        setOpen(true);
      } else {
        moveFocus(event.key === 'ArrowDown' ? 1 : -1);
      }
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === 'Enter' && open) {
      event.preventDefault();
      choose(focusedIndex);
    }
  };

  const selected = solutions[value];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setFocusedIndex(value);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
        className="inline-flex h-7 max-w-36 items-center justify-between gap-2 rounded-md border border-border-strong bg-surface-100 px-2 text-[11px] text-foreground transition-colors hover:bg-surface-300 focus:border-brand-highlight focus:outline-none"
        aria-label="Choose solution"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`solution-select-${selectId}`}
      >
        <span className="truncate">
          {value + 1} · {languageLabel(selected?.language ?? '')}
        </span>
        <ChevronDownIcon
          width="12"
          height="12"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            id={`solution-select-${selectId}`}
            role="listbox"
            aria-label="Solutions"
            className="fixed z-[100] max-h-56 min-w-28 overflow-y-auto rounded-md border border-border-strong bg-surface-100 p-1 shadow-xl"
            style={position}
          >
            {solutions.map((entry, index) => {
              const selectedOption = index === value;
              const focusedOption = index === focusedIndex;
              return (
                <button
                  key={`${entry.n}.${entry.ext}`}
                  id={`solution-option-${selectId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selectedOption}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onClick={() => choose(index)}
                  className={`flex w-full items-center rounded px-2 py-1.5 text-left text-[11px] transition-colors ${
                    focusedOption ? 'bg-surface-300 text-foreground' : 'text-foreground-light'
                  }`}
                >
                  <span className="whitespace-nowrap">
                    {index + 1} · {languageLabel(entry.language)}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
