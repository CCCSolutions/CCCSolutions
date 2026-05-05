'use client';

import {
  MagnifyingGlassIcon,
  ChatBubbleIcon,
  ArrowUpIcon,
} from '@radix-ui/react-icons';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { SectionContainer } from '../../../../components/ui/section-container';

export default function ForumPreviewLoggedIn() {
  return (
    <div className="bg-background text-foreground">
      <SectionContainer size="large" className="py-16">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar — single placeholder category */}
          <aside className="hidden lg:block">
            <p className="text-[11px] uppercase tracking-wider text-foreground-lighter mb-3 px-3">
              Categories
            </p>
            <nav className="flex flex-col gap-0.5">
              <button
                type="button"
                className="flex items-center justify-between px-3 py-2 rounded-md text-sm bg-surface-200 text-foreground"
              >
                <span>Coming soon</span>
              </button>
            </nav>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            {/* Search bar */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon
                width="16"
                height="16"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-lighter pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search…"
                className="w-full h-10 pl-10 pr-4 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
              />
              <span className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded border border-border-default text-[10px] text-foreground-lighter font-mono">
                ⌘K
              </span>
            </div>

            {/* Filter row */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex gap-1.5">
                <Button type="primary" size="tiny">Recent</Button>
              </div>
              <Button type="primary" size="small">+ New thread</Button>
            </div>

            {/* Single placeholder thread */}
            <div className="flex flex-col gap-2">
              <Card className="hover:bg-surface-200/40 transition-colors">
                <div className="flex gap-4 px-5 py-4">
                  <div className="flex flex-col items-center justify-start gap-3 pt-1 shrink-0 w-12">
                    <div className="flex flex-col items-center text-foreground">
                      <ArrowUpIcon width="14" height="14" className="text-foreground-lighter" />
                      <span className="text-sm font-semibold">—</span>
                    </div>
                    <div className="flex flex-col items-center text-foreground-lighter">
                      <ChatBubbleIcon width="14" height="14" />
                      <span className="text-xs">—</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate mb-2">
                      Coming soon coming soon
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-foreground-lighter">
                      <span>Coming soon</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </SectionContainer>
    </div>
  );
}
