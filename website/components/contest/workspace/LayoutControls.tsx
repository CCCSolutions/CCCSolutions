'use client';

import { ResetIcon } from '@radix-ui/react-icons';

export type ViewMode = 'classic' | 'new';

export function LayoutControls({
  view,
  onViewChange,
  onReset,
  showReset = true,
}: {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onReset?: () => void;
  showReset?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div
        className="inline-flex rounded-md border border-border-default bg-background p-0.5"
        aria-label="Solution page layout"
      >
        {(['classic', 'new'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onViewChange(option)}
            aria-pressed={view === option}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              view === option
                ? 'bg-brand-500 text-white'
                : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
            }`}
          >
            {option === 'classic' ? 'Classic' : 'New'}
          </button>
        ))}
      </div>
      {showReset && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground"
        >
          <ResetIcon width="12" height="12" />
          Reset layout
        </button>
      )}
    </div>
  );
}
