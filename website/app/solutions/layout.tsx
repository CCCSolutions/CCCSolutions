import React from 'react';

export const metadata = {
  title: 'All CCC Solutions (1996-2026) | Browse 270+ Canadian Computing Competition Problems',
  description: 'Browse 270+ Canadian Computing Competition solutions from 1996-2026. Filter by year, difficulty (Easy to Wicked), or topic (graph theory, DP, greedy). Solutions in C++, Python & Java with test cases.',
  keywords: 'CCC solutions, Canadian Computing Competition problems, CCC all years, CCC 1996-2026, CCC past contests, CCC problem list, graph theory CCC, dynamic programming CCC, CCC difficulty, CCC Junior problems, CCC Senior problems, competitive programming solutions',
  robots: 'index, follow, max-image-preview:large',
  alternates: {
    canonical: 'https://cccsolutions.ca/solutions',
  },
  openGraph: {
    title: 'All CCC Solutions (1996-2026) | 270+ Problems',
    description: 'Browse all Canadian Computing Competition solutions. Filter by year, difficulty, or algorithm topic.',
    url: 'https://cccsolutions.ca/solutions',
  },
};

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
