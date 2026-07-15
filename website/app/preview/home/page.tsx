import { MarketingHome } from '../../../components/home/MarketingHome';

export const metadata = {
  title: 'Home redesign (marketing) — preview | CCCSolutions',
  description: 'Design mock of the redesigned logged-out homepage. Reference only, not wired up.',
};

async function getGithubStars(): Promise<number | null> {
  try {
    const res = await fetch('https://api.github.com/repos/CCCSolutions/CCCSolutions', {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

export default async function MarketingHomePreview() {
  const githubStars = await getGithubStars();
  return <MarketingHome githubStars={githubStars} />;
}
