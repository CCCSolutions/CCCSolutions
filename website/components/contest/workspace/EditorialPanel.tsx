'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnterFullScreenIcon,
  ReaderIcon,
} from '@radix-ui/react-icons';
import { Tooltip } from '../../ui/tooltip';
import type { Problem } from '../../../constants';
import { EditorialContent, ProblemActions } from '../ProblemEditorial';
import { PanelHeader, PanelIconButton, type PanelControlProps } from './PanelChrome';
import { difficultyClass } from './shared';

export function EditorialPanel({
  problemInfo,
  contestYear,
  problemCode,
  layoutControls,
  editorial,
  loading,
  minimized,
  fullscreen,
  onMinimize,
  onFullscreen,
  showPanelControls,
}: PanelControlProps & {
  problemInfo: Problem | undefined;
  contestYear: string;
  problemCode: string;
  layoutControls?: React.ReactNode;
  editorial: string | null;
  loading: boolean;
}) {
  const title = problemInfo?.name || `${contestYear} ${problemCode.toUpperCase()}`;

  if (minimized && showPanelControls) {
    return (
      <section
        className="flex size-full min-h-0 flex-col items-center bg-surface-200 py-2"
        aria-label={`${title} editorial`}
      >
        <Tooltip
          content={`Restore ${title}`}
          side="bottom"
          triggerClassName="flex min-h-0 flex-1 flex-col"
        >
          <button
            type="button"
            onClick={onMinimize}
            className="flex min-h-0 flex-1 flex-col items-center gap-2 text-foreground-light transition-colors hover:text-foreground"
            aria-label={`Restore ${title} editorial panel`}
          >
            <ReaderIcon width="16" height="16" className="shrink-0 text-brand" />
            <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-semibold tracking-wide">
              {title}
            </span>
          </button>
        </Tooltip>
        <div className="mt-auto flex flex-col items-center gap-1">
          <PanelIconButton
            label="Fullscreen editorial panel"
            tooltip="Fullscreen"
            onClick={onFullscreen}
            className="p-2"
          >
            <EnterFullScreenIcon width="14" height="14" />
          </PanelIconButton>
          <PanelIconButton
            label="Restore editorial panel"
            tooltip="Restore"
            onClick={onMinimize}
            className="p-2"
          >
            <ChevronRightIcon width="15" height="15" />
          </PanelIconButton>
        </div>
      </section>
    );
  }

  return (
    <section className="flex size-full min-h-0 flex-col" aria-label="Editorial">
      <PanelHeader
        icon={<ReaderIcon width="15" height="15" />}
        title={title}
        minimized={minimized}
        fullscreen={fullscreen}
        onMinimize={onMinimize}
        onFullscreen={onFullscreen}
        showPanelControls={showPanelControls}
        minimizeIcon={<ChevronLeftIcon width="13" height="13" />}
      >
        {layoutControls}
      </PanelHeader>
      {!minimized && (
        <article className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="mx-auto mb-6 max-w-3xl border-b border-border-default pb-5">
            <Link
              href="/solutions"
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-foreground-lighter transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon width="13" height="13" />
              Back to solutions
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {problemInfo?.difficulty && (
                    <span
                      className={`inline-flex items-center rounded-xs px-2.5 py-1 text-[11px] font-medium leading-none ${difficultyClass(
                        problemInfo.difficulty
                      )}`}
                    >
                      {problemInfo.difficulty}
                    </span>
                  )}
                  {problemInfo?.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-xs border border-border-default bg-surface-200 px-2 py-0.5 text-[10px] font-medium text-foreground-light"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ProblemActions contestYear={contestYear} problemCode={problemCode} size="tiny" />
            </div>
          </div>
          <div className="mx-auto max-w-3xl">
            <EditorialContent
              contestYear={contestYear}
              problemCode={problemCode}
              markdown={editorial}
              loading={loading}
            />
          </div>
        </article>
      )}
    </section>
  );
}
