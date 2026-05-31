import {
  ReaderIcon,
  GlobeIcon,
  ExternalLinkIcon,
  GitHubLogoIcon,
} from '@radix-ui/react-icons';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { SectionContainer } from '../../components/ui/section-container';
import { NoiseTexture } from '../../components/effects/NoiseTexture';

interface Resource {
  title: string;
  link: string;
  description?: string;
  meta?: string;
}

const websites: Resource[] = [
  {
    title: 'DMOJ',
    link: 'https://dmoj.ca/',
    description:
      'A modern online judge with an extensive problem library, including every CCC contest.',
  },
  {
    title: 'Codeforces',
    link: 'https://codeforces.com/',
    description:
      'One of the most popular competitive programming platforms — regular contests and a huge problem archive sorted by difficulty.',
  },
  {
    title: 'AtCoder',
    link: 'https://atcoder.jp/',
    description:
      'Japanese contest platform known for clean, well-tested problems and beginner-friendly contests every weekend.',
  },
  {
    title: 'CSES Problem Set',
    link: 'https://cses.fi/problemset/',
    description:
      '200+ classical problems covering sorting, graphs, DP, and more. Pairs perfectly with the Competitive Programmer\'s Handbook.',
    meta: 'by Antti Laaksonen',
  },
  {
    title: 'USACO Guide',
    link: 'https://usaco.guide',
    description:
      'Comprehensive USACO prep guide with harder problems and editorials, mostly targeted at C++ users.',
  },
  {
    title: 'CP-Algorithms',
    link: 'https://cp-algorithms.com/',
    description:
      'Encyclopedic reference for competitive programming algorithms with explanations, code, and complexity analysis for almost every standard technique.',
  },
];

const books: Resource[] = [
  {
    title: "Competitive Programmer's Handbook",
    link: 'https://cses.fi/book/book.pdf',
    description:
      'Free PDF book covering algorithms and data structures used in competitive programming.',
    meta: 'by Antti Laaksonen',
  },
  {
    title: 'Competitive Programming 3',
    link: 'https://files.gitter.im/SamZhangQingChuan/sam/DA1g/Steven-Halim_-Felix-Halim-Competitive-Programming-3_-The-New-Lower-Bound-of-Programming-Contests-Lulu.com-_2013_.pdf',
    description:
      'A widely-used textbook covering basics to advanced topics with hundreds of UVa problem references for practice.',
    meta: 'by Steven & Felix Halim',
  },
];

function ResourceCard({ r }: { r: Resource }) {
  return (
    <a
      href={r.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight rounded-lg"
    >
      <Card className="h-full hover:bg-surface-200/50 transition-colors">
        <CardContent className="flex flex-col gap-2 py-6 px-5 border-none">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-foreground group-hover:text-brand transition-colors">
              {r.title}
            </h3>
            <ExternalLinkIcon
              width="14"
              height="14"
              className="text-foreground-lighter group-hover:text-brand transition-colors shrink-0"
            />
          </div>
          {r.meta && <p className="text-xs text-foreground-lighter">{r.meta}</p>}
          {r.description && (
            <p className="text-sm text-foreground-light leading-relaxed">{r.description}</p>
          )}
        </CardContent>
      </Card>
    </a>
  );
}

export default function ResourcesPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Header band — dark indigo "stage" with a light-from-above beam.
          Forced dark; header centered so it sits directly under the light. */}
      <div className="relative overflow-hidden border-b border-border-default text-white bg-[hsl(245_44%_25%)]">
        {/* Soft light from above — static, long gradual falloff. The source sits
            off-screen above the top edge, so only the soft tail shows (no hard
            core or ring). The grain below also smooths any gradient banding. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(150% 140% at 50% -45%, hsl(244 78% 80% / 0.20), hsl(244 72% 66% / 0.06) 50%, transparent 96%)',
          }}
        />
        {/* Film grain — cinematic texture. */}
        <NoiseTexture opacity={0.16} />
        <SectionContainer size="large" className="relative z-10 pt-20 pb-14 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Resources
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/70 max-w-xl mx-auto">
            Useful sites and books for CCC preparation.
          </p>
        </SectionContainer>
      </div>

      {/* Online judges + tutorials */}
      <SectionContainer id="judges" size="large" className="scroll-mt-24 pt-12 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <GlobeIcon width="18" height="18" className="text-brand" />
          <h2 className="text-xl font-bold text-foreground">Online judges and tutorials</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((r) => (
            <ResourceCard key={r.title} r={r} />
          ))}
        </div>
      </SectionContainer>

      {/* Books */}
      <SectionContainer id="books" size="large" className="scroll-mt-24 border-t border-border-default pt-16 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <ReaderIcon width="18" height="18" className="text-brand" />
          <h2 className="text-xl font-bold text-foreground">Books</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((r) => (
            <ResourceCard key={r.title} r={r} />
          ))}
        </div>
      </SectionContainer>

      {/* Contribute callout */}
      <SectionContainer size="large" className="border-t border-border-default pt-16 pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Have a resource we should add?
          </h2>
          <p className="mt-3 text-base text-foreground-light">
            Open a pull request on GitHub or suggest one in the forum.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild type="default" size="medium">
              <a
                href="https://github.com/CCCSolutions/CCCSolutions"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubLogoIcon width="18" height="18" />
                <span>GitHub</span>
              </a>
            </Button>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
