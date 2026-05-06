import Image from 'next/image';
import { GitCommit } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { SectionContainer } from '../../components/ui/section-container';
import { NoiseTexture } from '../../components/NoiseTexture';
import { contributors } from '../../constants';

const timeline = [
  {
    year: 2001,
    title: 'The beginning',
    body: 'Chris Robart at Milliken Mills HS started publishing CCC solutions in Turing and Java for his students.',
  },
  {
    year: 2011,
    title: 'Transition to Python',
    body: 'Solutions were ported to Python as it became the dominant teaching language for high-school CS.',
  },
  {
    year: 2024,
    title: 'Modernization',
    body: 'The repository was rebuilt as an open-source site with multi-language solutions, full test data, and a community-editable archive.',
  },
  {
    year: 2026,
    title: 'Refresh',
    body: 'A visual rebuild of the site, along with a new forum and backend. Coming soon :)',
  },
];

const teachers = [
  {
    name: 'Chris Robart',
    role: 'Computer Science · 1996–2015',
    image: 'https://live.staticflickr.com/5725/buddyicons/7374177@N03_l.jpg?1451326165',
  },
  {
    name: 'Don Smith',
    role: 'Math & Computer Science · 1988–2022',
    image: '/images/donsmith.jpeg',
  },
];

export default function About() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero band — header + stats wrapped together with brand-tinted noise.
          The band's border-b doubles as the section separator (no hairline below). */}
      <div className="relative bg-surface-100/40 overflow-hidden border-b border-border-default">
        <NoiseTexture opacity={0.12} color="hsl(239, 84%, 67%)" />

        <SectionContainer size="large" className="relative z-10 pt-16 pb-10">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            About
          </h1>
          <p className="mt-4 text-base md:text-lg text-foreground-light max-w-2xl">
            Learn more about our journey in becoming the most comprehensive platform for Canadian Computing Competition solutions since 1996.
          </p>
        </SectionContainer>

        <SectionContainer size="large" className="relative z-10 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <Card>
              <CardContent className="py-6 px-5 border-none">
                <p className="text-3xl md:text-4xl font-bold text-brand">30</p>
                <p className="mt-1 text-sm text-foreground-light">Years of CCC covered</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6 px-5 border-none">
                <p className="text-3xl md:text-4xl font-bold text-brand">270+</p>
                <p className="mt-1 text-sm text-foreground-light">Solutions published</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6 px-5 border-none">
                <p className="text-3xl md:text-4xl font-bold text-brand">50+</p>
                <p className="mt-1 text-sm text-foreground-light">Contributors</p>
              </CardContent>
            </Card>
          </div>
        </SectionContainer>
      </div>

      {/* Timeline — Supabase changelog pattern: 12-col grid, year column on left
          with icon badge, item column on right, vertical line connecting */}
      <SectionContainer size="large" className="pt-16 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Our journey</h2>
        <div className="relative lg:border-l border-border-muted lg:ml-2 lg:pl-8">
          {timeline.map((t, i) => (
            <section
              key={t.year}
              className={`grid lg:grid-cols-12 lg:gap-4 ${
                i === timeline.length - 1 ? '' : 'pb-12 lg:pb-16'
              }`}
            >
              {/* Year column with icon badge — sticky on lg+ */}
              <div className="relative hidden lg:col-span-2 lg:block">
                <div className="ml-[-42px] lg:sticky lg:top-[calc(65px+1rem)] lg:pt-1">
                  <div className="flex items-center gap-2 text-foreground-light">
                    <div className="bg-surface-200 border border-border-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-sm">
                      <GitCommit size={14} strokeWidth={1.5} />
                    </div>
                    <span className="text-base leading-none">{t.year}</span>
                  </div>
                </div>
              </div>

              {/* Mobile year header */}
              <div className="lg:hidden mb-2 flex items-center gap-2 text-foreground-light">
                <div className="bg-surface-200 border border-border-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-sm">
                  <GitCommit size={14} strokeWidth={1.5} />
                </div>
                <span className="text-sm leading-none">{t.year}</span>
              </div>

              {/* Content column */}
              <div className="min-w-0 lg:col-span-10">
                <h3 className="text-lg font-bold text-foreground mb-1">{t.title}</h3>
                <p className="text-base text-foreground-light leading-relaxed">{t.body}</p>
              </div>
            </section>
          ))}
        </div>
      </SectionContainer>

      {/* Teachers tribute */}
      <SectionContainer size="large" className="border-t border-border-default pt-16 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">A special thanks</h2>
        <p className="text-base text-foreground-light max-w-2xl mb-8">
          The original solutions came from two Milliken Mills H.S. teachers who have been key in creating and maintaining this website. Enjoy your retirement!
        </p>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
          {teachers.map((t) => (
            <Card key={t.name}>
              <CardContent className="flex items-center gap-4 py-6 px-5 border-none">
                <div className="relative h-16 w-16 rounded-full overflow-hidden bg-surface-200 shrink-0">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={t.image.startsWith('http')}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground">{t.name}</h3>
                  <p className="text-sm text-foreground-light">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionContainer>

      {/* Contributors */}
      <SectionContainer size="large" className="border-t border-border-default pt-16 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Contributors</h2>
        <p className="text-base text-foreground-light max-w-2xl mb-8">
          Thank you to those who have helped contribute solutions to this website!
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contributors.map((c) => {
            const school = c.school || c.schools;
            return (
              <Card key={c.initials}>
                <CardContent className="flex items-start gap-3 py-4 px-4 border-none">
                  <div className="h-10 w-10 rounded-full bg-brand/15 text-brand flex items-center justify-center font-bold text-xs shrink-0">
                    {c.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{c.name}</h3>
                    {school && (
                      <p className="text-xs text-foreground-lighter truncate">{school}</p>
                    )}
                    <p className="text-xs text-foreground-lighter mt-1 line-clamp-2">
                      {c.contributions}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </SectionContainer>

      {/* School origin — keeps the connection without leading with the school name */}
      <SectionContainer size="large" className="border-t border-border-default pt-16 pb-20">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center max-w-5xl">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Where it started
            </h2>
            <p className="text-base text-foreground-light leading-relaxed">
              Milliken Mills High School is a public school offering the IB Diploma Programme in
              Markham, Ontario, Canada. The CCCSolutions archive began as a CS class resource and
              has been rebuilt and maintained with help from the MMHS Computer Science club and
              contributors from many other schools.
            </p>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-surface-200">
            <Image
              src="/images/mmhs_4.jpg"
              alt="Milliken Mills High School"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </SectionContainer>

    </div>
  );
}
