import { HomeAuthSwitch } from '../components/home/HomeAuthSwitch';
import { MarketingHome } from '../components/home/MarketingHome';
import { LoggedInHome } from '../components/home/LoggedInHome';

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

export default async function Home() {
  const githubStars = await getGithubStars();
  return (
    <HomeAuthSwitch
      loggedOut={<MarketingHome githubStars={githubStars} />}
      loggedIn={<LoggedInHome />}
    />
  );
}
