import Link from 'next/link';
import type { Metadata } from 'next';
import { SectionContainer } from '../../components/ui/section-container';
import { GraphPattern } from '../../components/effects/GraphPattern';
import { NoiseTexture } from '../../components/effects/NoiseTexture';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What data CCCSolutions collects, why, and the third-party services involved.',
};

const CONTACT_EMAIL = 'willi64645@gmail.com';
const EFFECTIVE_DATE = 'August 9, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm md:text-base leading-relaxed text-foreground-light">
        {children}
      </div>
    </section>
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

        <SectionContainer size="large" className="relative z-10 pt-16 pb-10">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/85 max-w-2xl">
            CCCSolutions is a free, open-source, community-run archive. This page explains what data
            the site collects, why, and which third-party services are involved.
          </p>
          <p className="mt-3 text-sm text-white/70">Last updated: {EFFECTIVE_DATE}</p>
        </SectionContainer>
      </div>

      <SectionContainer size="small" className="py-14">
        <Section title="Who we are">
          <p>
            CCCSolutions is a volunteer, non-commercial project that publishes solutions to the
            Canadian Computing Competition and hosts a community forum. We do not sell data or run
            advertising. The site&apos;s source code is public on{' '}
            <a
              href="https://github.com/CCCSolutions/CCCSolutions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </Section>

        <Section title="What we collect">
          <p>We only collect what the site needs to function:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <span className="font-medium text-foreground">Account details.</span> When you sign
              up, we store your email address and the username you choose. If you sign in with
              Google, we also receive your name and profile picture from Google.
            </li>
            <li>
              <span className="font-medium text-foreground">Content you post.</span> The threads,
              comments, and votes you create in the forum are stored and shown publicly next to your
              username.
            </li>
            <li>
              <span className="font-medium text-foreground">Usage analytics.</span> We use Google
              Analytics to understand aggregate traffic (pages visited, device and browser type,
              approximate region from IP address). This is used in aggregate, not to identify you.
            </li>
            <li>
              <span className="font-medium text-foreground">Security signals.</span> Sign-up and
              sign-in are protected by Cloudflare Turnstile, which processes a challenge token and
              your IP address to tell humans from bots.
            </li>
            <li>
              <span className="font-medium text-foreground">Technical logs.</span> As with any
              website, our host receives standard request data such as your IP address and browser
              user-agent to serve pages and keep the site secure.
            </li>
          </ul>
        </Section>

        <Section title="Third-party services we rely on">
          <p>Your data is handled by a small number of providers, each for a specific purpose:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <span className="font-medium text-foreground">Supabase</span> — authentication and the
              database that stores your account and forum content.
            </li>
            <li>
              <span className="font-medium text-foreground">Google</span> — optional Google sign-in
              (OAuth) and Google Analytics for usage statistics.
            </li>
            <li>
              <span className="font-medium text-foreground">Cloudflare</span> — hosting and content
              delivery, plus Turnstile bot protection.
            </li>
          </ul>
          <p>
            Each provider processes data under its own privacy policy. We share only what those
            services need to do their job, and never sell your information.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use cookies for two things: keeping you signed in (a session cookie set by Supabase)
            and Google Analytics (which sets its own analytics cookies). You can block or clear
            cookies in your browser; blocking the session cookie will sign you out, and blocking
            analytics cookies has no effect on using the site.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Your account and the content you post remain until you ask us to delete them. Analytics
            data is retained according to Google&apos;s standard retention settings. If you delete
            your account, your posts and comments may be retained in anonymized form to keep
            existing discussions readable.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can edit your profile at any time, and you can request deletion of your account and
            associated data by emailing us. To opt out of analytics, block analytics cookies in your
            browser or use a tracker-blocking extension.
          </p>
        </Section>

        <Section title="Children">
          <p>
            CCCSolutions is aimed at students and educators. We do not knowingly collect more than
            the account and forum information described above from anyone, and we ask that younger
            students use the site with a parent or teacher&apos;s awareness.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy as the site evolves. When we do, we&apos;ll change the
            &quot;last updated&quot; date above. Material changes will be noted on the site.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions, or want your data removed? Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
              {CONTACT_EMAIL}
            </a>
            . You can also reach the project through{' '}
            <Link href="/about" className="text-brand hover:underline">
              the About page
            </Link>
            .
          </p>
        </Section>
      </SectionContainer>
    </div>
  );
}
