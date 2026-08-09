import type { Metadata } from 'next';
import { SectionContainer } from '../../components/ui/section-container';
import { GraphPattern } from '../../components/effects/GraphPattern';
import { NoiseTexture } from '../../components/effects/NoiseTexture';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What data CCCSolutions collects, why, and the third-party services involved.',
};

const CONTACT_EMAIL = 'william@cccsolutions.ca';
const EFFECTIVE_DATE = 'August 9, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground-light md:text-base">
        {children}
      </div>
    </section>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
      {children}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <div className="bg-background text-foreground">
      <div
        data-theme="dark"
        className="relative overflow-hidden border-b border-border-default text-white"
        style={{ backgroundColor: 'hsl(239 58% 45%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(150% 140% at 50% -45%, hsl(239 70% 70% / 0.25), transparent 90%)',
          }}
        />
        <NoiseTexture opacity={0.26} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-3/4 lg:w-3/5"
        >
          <GraphPattern className="h-full w-full text-white opacity-80" />
        </div>

        <SectionContainer size="large" className="relative z-10 pb-10 pt-16">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-white/70">Last updated: {EFFECTIVE_DATE}</p>
        </SectionContainer>
      </div>

      <SectionContainer size="small" className="py-14">
        <Section title="Who we are">
          <p>
            CCCSolutions is a volunteer, non-commercial project. We do not sell your data or run
            ads, and the site&apos;s source code is public on{' '}
            <ExtLink href="https://github.com/CCCSolutions/CCCSolutions">GitHub</ExtLink>.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <span className="font-medium text-foreground">Account details:</span> your email
              address and the username you choose. If you sign in with Google, we also receive your
              name and profile picture.
            </li>
            <li>
              <span className="font-medium text-foreground">Content you post:</span> the threads,
              comments, and votes you create, shown publicly next to your username.
            </li>
            <li>
              <span className="font-medium text-foreground">Usage analytics:</span> Google Analytics
              records aggregate traffic such as pages visited, device and browser type, and
              approximate region from your IP address.
            </li>
            <li>
              <span className="font-medium text-foreground">Security signals:</span> Cloudflare
              Turnstile processes a challenge token and your IP address to block bots at sign-up and
              sign-in.
            </li>
            <li>
              <span className="font-medium text-foreground">Technical logs:</span> our host receives
              standard request data such as your IP address and browser user-agent.
            </li>
          </ul>
        </Section>

        <Section title="Third-party services">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <span className="font-medium text-foreground">Supabase:</span> authentication and the
              database that stores your account and forum content.{' '}
              <ExtLink href="https://supabase.com/privacy">Privacy policy</ExtLink>.
            </li>
            <li>
              <span className="font-medium text-foreground">Google:</span> optional Google sign-in
              and Google Analytics.{' '}
              <ExtLink href="https://policies.google.com/privacy">Privacy policy</ExtLink>.
            </li>
            <li>
              <span className="font-medium text-foreground">Cloudflare:</span> hosting, content
              delivery, and Turnstile bot protection.{' '}
              <ExtLink href="https://www.cloudflare.com/privacypolicy/">Privacy policy</ExtLink>.
            </li>
          </ul>
        </Section>

        <Section title="Cookies we use">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <span className="font-medium text-foreground">Essential cookies</span> to keep you
              signed in.
            </li>
            <li>
              <span className="font-medium text-foreground">Analytics cookies</span> from Google
              Analytics, so we can see how the site is used.
            </li>
          </ul>
        </Section>

        <Section title="Data retention">
          <p>
            We keep your account and the posts you make for as long as your account exists. Ask us
            to delete them and we will. Analytics data is held by Google under its own retention
            settings.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            Want to see or remove your data? Just email us and we&apos;ll take care of it. You can
            also opt out of analytics by blocking cookies in your browser.
          </p>
        </Section>

        <Section title="Children">
          <p>
            CCCSolutions is built for students and teachers. We only collect the account and forum
            details covered above, and if you&apos;re a younger student, we&apos;d suggest using the
            site with a parent or teacher.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We&apos;ll update this page if things change, and the date at the top always shows the
            latest version.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about any of this? Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </SectionContainer>
    </div>
  );
}
