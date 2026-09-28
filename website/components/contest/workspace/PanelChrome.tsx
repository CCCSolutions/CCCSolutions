'use client';

import React from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EnterFullScreenIcon,
  ExclamationTriangleIcon,
  ExitFullScreenIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons';
import { Tooltip } from '../../ui/tooltip';
import { LEFT_SIZE_RANGE, SOLUTION_SIZE_RANGE } from './usePanelLayout';

export type PanelControlProps = {
  minimized: boolean;
  fullscreen: boolean;
  onMinimize: () => void;
  onFullscreen: () => void;
  showPanelControls: boolean;
};

export function PanelIconButton({
  label,
  tooltip,
  onClick,
  className = 'p-1.5',
  children,
}: {
  label: string;
  tooltip: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={tooltip}>
      <button
        type="button"
        onClick={onClick}
        className={`rounded text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground ${className}`}
        aria-label={label}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function PanelHeader({
  icon,
  title,
  children,
  minimized,
  fullscreen,
  onMinimize,
  onFullscreen,
  showPanelControls,
  minimizeIcon,
}: PanelControlProps & {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  minimizeIcon?: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-surface-200 px-3">
      <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground">
        <span className="shrink-0 text-brand">{icon}</span>
        <span className="truncate">{title}</span>
      </div>
      {!minimized && (
        <div className="flex min-w-0 items-center gap-1.5">
          {children}
          {showPanelControls && (
            <div className="flex items-center">
              <PanelIconButton
                label={`${fullscreen ? 'Exit fullscreen for' : 'Fullscreen'} ${title} panel`}
                tooltip={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                onClick={onFullscreen}
              >
                {fullscreen ? (
                  <ExitFullScreenIcon width="13" height="13" />
                ) : (
                  <EnterFullScreenIcon width="13" height="13" />
                )}
              </PanelIconButton>
              <PanelIconButton
                label={`Minimize ${title} panel`}
                tooltip="Minimize"
                onClick={onMinimize}
              >
                {minimizeIcon ?? <ChevronDownIcon width="13" height="13" />}
              </PanelIconButton>
            </div>
          )}
        </div>
      )}
      {minimized && showPanelControls && (
        <div className="flex items-center">
          <PanelIconButton
            label={`Fullscreen ${title} panel`}
            tooltip="Fullscreen"
            onClick={onFullscreen}
          >
            <EnterFullScreenIcon width="13" height="13" />
          </PanelIconButton>
          <PanelIconButton label={`Restore ${title} panel`} tooltip="Restore" onClick={onMinimize}>
            <ChevronUpIcon width="13" height="13" />
          </PanelIconButton>
        </div>
      )}
    </div>
  );
}

export function PanelStatus({
  label,
  loading = false,
  error = false,
}: {
  label: string;
  loading?: boolean;
  error?: boolean;
}) {
  return (
    <div
      className={`flex size-full min-h-32 items-center justify-center gap-2 p-6 text-center text-sm ${
        error ? 'text-destructive' : 'text-foreground-lighter'
      }`}
    >
      {loading ? (
        <span className="size-5 animate-spin rounded-full border-2 border-surface-300 border-t-brand" />
      ) : error ? (
        <ExclamationTriangleIcon width="16" height="16" />
      ) : (
        <InfoCircledIcon width="16" height="16" />
      )}
      <span>{label}</span>
    </div>
  );
}

export function ResizeHandle({
  orientation,
  value,
  onPointerDown,
  onChange,
}: {
  orientation: 'vertical' | 'horizontal';
  value: number;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onChange: (delta: number) => void;
}) {
  const vertical = orientation === 'vertical';
  const [min, max] = vertical ? LEFT_SIZE_RANGE : SOLUTION_SIZE_RANGE;

  return (
    <button
      type="button"
      role="separator"
      aria-label={`Resize ${vertical ? 'editorial and solution' : 'solution and test case'} panels`}
      aria-orientation={orientation}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      onPointerDown={onPointerDown}
      onKeyDown={(event) => {
        if (vertical && event.key === 'ArrowLeft') onChange(-2);
        if (vertical && event.key === 'ArrowRight') onChange(2);
        if (!vertical && event.key === 'ArrowUp') onChange(-2);
        if (!vertical && event.key === 'ArrowDown') onChange(2);
      }}
      className={`group relative shrink-0 touch-none focus:outline-none ${
        vertical ? 'w-3 cursor-col-resize' : 'h-3 cursor-row-resize'
      }`}
    >
      <span
        className={`absolute bg-border-strong transition-colors group-hover:bg-brand-400 group-focus:bg-brand-400 ${
          vertical
            ? 'inset-y-2 left-1/2 w-px -translate-x-1/2'
            : 'inset-x-2 top-1/2 h-px -translate-y-1/2'
        }`}
      />
    </button>
  );
}
