import type { Metadata } from 'next';
import { problems } from '../../../../constants';
import { findProblem } from '../../../../lib/problems';
import SolutionPageClient from './SolutionPageClient';

type Props = {
  params: Promise<{ contestYear: string; problemCode: string }>;
};

export function generateStaticParams() {
  // A shared Junior problem redirects to its Senior page, so it gets no page of its own.
  return problems.flatMap((problem) => {
    const match = /^\/contest\/([^/]+)\/([^/]+)$/.exec(problem.link);
    if (!match || problem.sameAs) return [];
    return [{ contestYear: match[1], problemCode: match[2] }];
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { contestYear, problemCode } = await params;
  const url = `/contest/${contestYear}/${problemCode}`;
  const problem = findProblem(contestYear, problemCode);

  if (!problem) {
    return { title: 'Problem Not Found | CCCSolutions' };
  }

  const tags = problem.tags.join(', ');
  const description = `${problem.difficulty} difficulty${
    tags ? ` — ${tags}` : ''
  }. Read community solutions, sample test cases, and full test data for ${problem.name} from the Canadian Computing Competition.`;

  const title = `${problem.name} | CCC ${contestYear} Solution`;

  return {
    title,
    description,
    keywords: [problem.name, `CCC ${contestYear}`, problem.difficulty, ...problem.tags],
    alternates: {
      canonical: `https://cccsolutions.ca${url}`,
    },
    openGraph: {
      title: `${problem.name} — CCC ${contestYear} Solution`,
      description,
      url: `https://cccsolutions.ca${url}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${problem.name} — CCC ${contestYear} Solution`,
      description,
    },
  };
}

export default function Page() {
  return <SolutionPageClient />;
}
