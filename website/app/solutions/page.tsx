'use client';

import React, { Suspense } from 'react';
import ProblemsTable from '../../components/solutions/ProblemTable';
import SearchBar from '../../components/solutions/Searchbar';
import { SectionContainer } from '../../components/ui/section-container';
import { FlickeringGrid } from '../../components/effects/FlickeringGrid';
import { problems } from '../../constants';

function SolutionsContent() {
  return (
    <div className="bg-background text-foreground">
      {/* Header — always dark themed (white text on dark blue) regardless of global mode.
          Title/subtitle use explicit light colors; data-theme="dark" propagates to SearchBar. */}
      <div
        data-theme="dark"
        className="relative border-b border-border-default"
        style={{ backgroundColor: 'hsl(228 50% 27%)' }}
      >
        {/* overflow-hidden lives on this grid wrapper (not the band) so the SearchBar
            dropdown can overflow the band and overlay the table below without being clipped. */}
        <div aria-hidden className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <FlickeringGrid
            className="size-full"
            squareSize={4}
            gridGap={6}
            color="hsl(228, 90%, 78%)"
            maxOpacity={0.11}
            flickerChance={0.03}
          />
        </div>
        <SectionContainer size="large" className="relative z-10 pt-16 pb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Solutions
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/75 max-w-2xl mx-auto">
            Every CCC problem from 1996 to 2026, with detailed solutions and test data.
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <SearchBar problems={problems} />
          </div>
        </SectionContainer>
      </div>

      <SectionContainer size="large" className="pt-12 pb-20">
        <ProblemsTable />
      </SectionContainer>
    </div>
  );
}

export default function Solutions() {
  return (
    <Suspense
      fallback={
        <div className="bg-background text-foreground">
          <SectionContainer size="large" className="py-16">
            <p className="text-foreground-light">Loading…</p>
          </SectionContainer>
        </div>
      }
    >
      <SolutionsContent />
    </Suspense>
  );
}
