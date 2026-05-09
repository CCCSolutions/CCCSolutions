import React from 'react';
import Link from 'next/link';
import {
  PersonIcon,
  FileTextIcon,
  GitHubLogoIcon,
  CodeIcon,
  CheckCircledIcon,
  MagnifyingGlassIcon,
  ChatBubbleIcon,
  ReaderIcon,
  ExternalLinkIcon,
} from '@radix-ui/react-icons';
import { FlickeringGrid } from '../components/FlickeringGrid';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '../components/ui/card';
import { SectionContainer } from '../components/ui/section-container';

import { stats } from '../constants';
import { kFormatter } from '../lib/utils';
import { SolutionPreview } from '../components/SolutionPreview';

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

const features = [
  {
    icon: <PersonIcon width="28" height="28" className="text-brand" />,
    title: 'Interactive Forum',
    body: 'Discuss with peers to tackle challenging CCC problems and improve your skills.',
  },
  {
    icon: <FileTextIcon width="28" height="28" className="text-brand" />,
    title: 'Comprehensive Solutions',
    body: 'Explanations, test files, and multiple approaches to problems back to 1996.',
  },
  {
    icon: <CodeIcon width="28" height="28" className="text-brand" />,
    title: 'Multiple Languages',
    body: 'Solutions in C++, Python, and Java so you can read in the language you know.',
  },
  {
    icon: <CheckCircledIcon width="28" height="28" className="text-brand" />,
    title: 'Test Cases Included',
    body: 'Verify your own solutions against the official test data for every problem.',
  },
  {
    icon: <MagnifyingGlassIcon width="28" height="28" className="text-brand" />,
    title: 'Searchable Archive',
    body: 'Find problems by year, division, or keyword with instant search built into the site.',
  },
  {
    icon: <GitHubLogoIcon width="28" height="28" className="text-brand" />,
    title: 'Open Source',
    body: 'Check out our GitHub repository, contribute, or suggest improvements.',
  },
];

const Home = async () => {
  const githubStars = await getGithubStars();
  return (
    <div className="bg-background text-foreground">
      {/* Announcement + Hero share the first viewport — flex column sized to (100svh - navbar).
          Hero uses flex-1, so flex auto-subtracts the announcement's natural height. */}
      <div className="flex flex-col min-h-[calc(100svh-var(--nav-h))]">
        {/* Announcement strip — original Tailwind indigo (more violet than our brand-600) */}
        <div className="bg-indigo-600 text-white text-center px-4 flex-none">
          <Link
            href="/forum"
            className="block py-2 px-4 text-center text-sm text-white hover:text-indigo-100 transition-colors"
          >
            Help us expand our repository — submit your 2026 solutions{' '}
            <span className="underline underline-offset-2">here</span>.
          </Link>
        </div>

        {/* Hero */}
        <div className="relative bg-background overflow-hidden flex-1 flex flex-col justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <FlickeringGrid
            className="size-full"
            squareSize={4}
            gridGap={6}
            color="hsl(239, 84%, 67%)"
            maxOpacity={0.15}
            flickerChance={0.03}
          />
        </div>

        <SectionContainer
          size="large"
          className="relative z-10 py-12 max-w-[1440px]"
        >
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-20 items-center">
            {/* Left: hero copy — centered on mobile, left-aligned on desktop */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl tracking-tight font-semibold text-balance max-w-2xl mx-auto lg:mx-0">
                <span className="block text-foreground">The most comprehensive</span>
                <span className="block text-brand">CCC solution repository</span>
              </h1>
              <p className="mt-6 text-base lg:text-lg text-foreground-light max-w-xl mx-auto lg:mx-0 text-pretty">
                  Detailed Canadian Computing Competition solutions, all in one place.
              </p>
              <div className="mt-10 flex justify-center lg:justify-start gap-3">
                <Button asChild type="primary" size="large">
                  <Link href="/solutions">Explore solutions</Link>
                </Button>
                <Button asChild type="default" size="large">
                  <Link href="/forum">Visit forum</Link>
                </Button>
              </div>
            </div>

            {/* Right: solution-page mockup */}
            <SolutionPreview />
          </div>
        </SectionContainer>
        </div>
      </div>

      {/* Feature cards — bare icons (no tinted square wrapper) */}
      <SectionContainer size="large" className="py-14">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 max-w-3xl">
          <span className="text-foreground">Everything you need to prepare. </span>
          <span className="text-foreground-light">Forum, archive, and tools in one place.</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon, title, body }) => (
            <Card key={title}>
              <CardContent className="flex flex-col gap-4 py-8 px-6 border-none">
                {icon}
                <CardTitle>{title}</CardTitle>
                <CardDescription>{body}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
          <Card className="mt-4">
              <CardContent className="grid md:grid-cols-3 gap-8 py-12 px-8 border-none text-center">
                  <div>
                      <p className="text-4xl md:text-5xl font-bold text-brand">{stats.activeUsers}</p>
                      <p className="mt-1 text-base text-foreground-light">Active Users</p>
                  </div>
                  <div>
                      <p className="text-4xl md:text-5xl font-bold text-brand">{stats.numSolutions}</p>
                      <p className="mt-1 text-base text-foreground-light">CCC Solutions</p>
                  </div>
                  <div>
                      <p className="text-4xl md:text-5xl font-bold text-brand">{stats.history}</p>
                      <p className="mt-1 text-base text-foreground-light">Providing Answers</p>
                  </div>
              </CardContent>
          </Card>
      </SectionContainer>

      {/* Get started */}
      <SectionContainer size="large" className="py-14">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12 max-w-3xl mx-auto">
          <span className="text-foreground">Three ways to get started:</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="flex flex-col">
            <CardContent className="flex flex-col gap-4 py-8 px-6 border-none flex-1">
              <ChatBubbleIcon width="28" height="28" className="text-brand" />
              <CardTitle>Start a forum post</CardTitle>
              <CardDescription>
                Stuck on a problem or have a better approach to share?
              </CardDescription>
              <div className="mt-auto pt-2">
                <Button asChild type="primary" size="small">
                  <Link href="/create-post">Write post</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardContent className="flex flex-col gap-4 py-8 px-6 border-none flex-1">
              <ReaderIcon width="28" height="28" className="text-brand" />
              <CardTitle>Browse the archive</CardTitle>
              <CardDescription>
                Every CCC problem + test data from 1996 to 2026.
              </CardDescription>
              <div className="mt-auto pt-2">
                <Button asChild type="primary" size="small">
                  <Link href="/solutions">View archive</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardContent className="flex flex-col gap-4 py-8 px-6 border-none flex-1">
              <ExternalLinkIcon width="28" height="28" className="text-brand" />
              <CardTitle>Resources</CardTitle>
              <CardDescription>
                Helpful links to other CP sites, editorials, and references.
              </CardDescription>
              <div className="mt-auto pt-2">
                <Button asChild type="primary" size="small">
                  <Link href="/resources">See links</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionContainer>

      {/* Open source — centered Supabase-style section with longer subtext + repo handle in CTA */}
      <SectionContainer size="large" className="py-14">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Free and open source.
          </h2>
          <p className="mt-6 text-base md:text-lg text-foreground-light leading-relaxed">
            CCCSolutions is maintained through GitHub. Read the code, create an issue, or open a pull
            request. Every contribution helps!
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild type="default" size="medium">
              <a
                href="https://github.com/CCCSolutions/CCCSolutions"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubLogoIcon width="18" height="18" />
                <span>cccsolutions</span>
                {githubStars !== null && (
                  <>
                    <span className="text-foreground-muted px-1">|</span>
                    <span>{kFormatter(githubStars)}</span>
                  </>
                )}
              </a>
            </Button>
          </div>
        </div>
      </SectionContainer>

    </div>
  );
};

export default Home;

