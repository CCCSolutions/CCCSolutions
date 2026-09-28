import { problems, type Problem } from '../constants';

// Where a problem's solutions live: the Senior page for a shared Junior problem.
export const problemHref = (problem: Problem) => problem.sameAs ?? problem.link;

// The problem at /contest/{year}/{code}. A Senior problem shared with a Junior one is titled
// "2013 J5 / S3 - Chances of Winning".
export function findProblem(year: string, code: string): Problem | undefined {
  const link = `/contest/${year}/${code}`;
  const problem = problems.find((p) => p.link === link);
  const junior = problems.find((p) => p.sameAs === link);
  if (!problem || !junior) return problem;
  const juniorCode = junior.name.split(' ')[1];
  return { ...problem, name: problem.name.replace(/^(\d{4}) /, `$1 ${juniorCode} / `) };
}
