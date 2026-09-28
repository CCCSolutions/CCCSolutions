'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useContestData } from '../../../../components/contest/useContestData';
import {
  LayoutControls,
  type ViewMode,
} from '../../../../components/contest/workspace/LayoutControls';
import { WorkspaceView } from '../../../../components/contest/workspace/WorkspaceView';
import { findProblem } from '../../../../lib/problems';
import ProblemPageClient from './ProblemPageClient';

const VIEW_STORAGE_KEY = 'cccsolutions-solution-view';

export default function SolutionPageClient() {
  const { contestYear, problemCode } = useParams<{
    contestYear: string;
    problemCode: string;
  }>();
  const problemInfo = useMemo(
    () => findProblem(contestYear, problemCode),
    [contestYear, problemCode]
  );
  const data = useContestData(contestYear, problemCode);
  // null until the saved choice is read, so the page never flashes the wrong view.
  const [view, setView] = useState<ViewMode | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    } catch {}
    setView(saved === 'classic' ? 'classic' : 'new');
  }, []);

  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {}
  };

  return (
    <>
      {/* SEO structured data — escape "<" to prevent breaking out of the <script> tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cccsolutions.ca' },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Solutions',
                item: 'https://cccsolutions.ca/solutions',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `CCC ${contestYear}`,
                item: `https://cccsolutions.ca/solutions?year=${contestYear}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: problemInfo?.name || `${contestYear} ${problemCode.toUpperCase()}`,
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline:
              problemInfo?.name || `CCC ${contestYear} ${problemCode.toUpperCase()} Solution`,
            description: `Solution to ${
              problemInfo?.name || `CCC ${contestYear} ${problemCode.toUpperCase()}`
            } from the Canadian Computing Competition`,
            author: { '@type': 'Organization', name: 'CCCSolutions Community' },
            publisher: {
              '@type': 'Organization',
              name: 'CCCSolutions',
              logo: { '@type': 'ImageObject', url: 'https://cccsolutions.ca/icon.png' },
            },
            datePublished: `${contestYear}-02-01`,
            dateModified: `${contestYear}-02-01`,
            proficiencyLevel: problemInfo?.difficulty || 'Intermediate',
            dependencies: problemInfo?.tags?.join(', ') || 'algorithms',
          }).replace(/</g, '\\u003c'),
        }}
      />
      {view === null ? (
        <div className="min-h-[calc(100dvh-var(--nav-h))] lg:h-[calc(100dvh-var(--nav-h))]" />
      ) : view === 'classic' ? (
        <ProblemPageClient
          contestYear={contestYear}
          problemCode={problemCode}
          problemInfo={problemInfo}
          data={data}
          headerControls={
            <LayoutControls view={view} onViewChange={changeView} showReset={false} />
          }
        />
      ) : (
        <WorkspaceView
          view={view}
          onViewChange={changeView}
          contestYear={contestYear}
          problemCode={problemCode}
          problemInfo={problemInfo}
          data={data}
        />
      )}
    </>
  );
}
