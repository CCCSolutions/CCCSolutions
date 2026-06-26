import './globals.css';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Providers } from '../components/layout/Providers';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://cccsolutions.ca'),
  title: 'CCCSolutions 2026 | Canadian Computing Competition Solutions (1996-2026)',
  description: 'Master the Canadian Computing Competition with 270+ detailed solutions in C++, Python & Java. Complete CCC solutions from 1996-2026 with test cases, multiple approaches & explanations. Prepare for University of Waterloo CCC.',
  keywords: 'CCC, Canadian Computing Competition, CCC solutions, CCC 2026, CCC 2025, CCC 2024, University of Waterloo, Waterloo CCC, CEMC, competitive programming, CCC preparation, CCC past problems, CCC contest, CCC test cases, programming contest Canada, algorithm practice, coding competition, CCC Senior, CCC Junior, s1 s2 s3 s4 s5, j1 j2 j3 j4 j5, graph theory, dynamic programming, data structures',
  authors: [{ name: 'CCCSolutions Community' }],
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://cccsolutions.ca',
    title: 'CCCSolutions 2026 | Canadian Computing Competition Solutions',
    description: 'Master the Canadian Computing Competition with 270+ detailed solutions in C++, Python & Java. Complete CCC solutions from 1996-2026 with test cases and explanations.',
    siteName: 'CCCSolutions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CCCSolutions 2026 | Canadian Computing Competition Solutions',
    description: 'Master the Canadian Computing Competition with 270+ detailed solutions in C++, Python & Java from 1996-2026.',
  },
  other: {
    'theme-color': '#1e3a8a',
  },
  alternates: {
    canonical: 'https://cccsolutions.ca',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />

        {/* Structured Data: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "CCCSolutions",
              "alternateName": ["Canadian Computing Competition Solutions", "CCC Solutions"],
              "url": "https://cccsolutions.ca",
              "logo": "https://cccsolutions.ca/icon.png",
              "description": "The most comprehensive Canadian Computing Competition solution repository with 270+ solutions from 1996 to 2026",
              "educationalLevel": ["High School", "University"],
              "teaches": ["Competitive Programming", "Algorithms", "Data Structures", "Problem Solving"],
              "sameAs": ["https://github.com/CCCSolutions/CCCSolutions"],
              "audience": {
                "@type": "EducationalAudience",
                "educationalRole": "student"
              }
            }),
          }}
        />

        {/* Structured Data: WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "CCCSolutions",
              "url": "https://cccsolutions.ca",
              "description": "Complete Canadian Computing Competition solution repository from 1996-2026",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://cccsolutions.ca/solutions?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />

        {/* Structured Data: FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": "What is the Canadian Computing Competition (CCC)?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Canadian Computing Competition (CCC) is an annual programming contest organized by the University of Waterloo's Centre for Education in Mathematics and Computing (CEMC). It's open to students across Canada and internationally, featuring Junior and Senior divisions with 5 problems each."
                }
              },{
                "@type": "Question",
                "name": "Where can I find CCC solutions?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "CCCSolutions.ca provides 270+ detailed solutions to CCC problems from 1996 to 2026, including code in C++, Python, and Java, along with test cases and multiple solution approaches for each problem."
                }
              },{
                "@type": "Question",
                "name": "How do I prepare for the CCC?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Practice past CCC problems starting with easier difficulties, study core algorithms (graph theory, dynamic programming, greedy algorithms), and use solution repositories like CCCSolutions to learn different approaches and techniques."
                }
              },{
                "@type": "Question",
                "name": "What programming languages can I use for CCC?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The CCC accepts submissions in multiple languages including C++, Python, Java, Pascal, and PHP. Most competitive programmers use C++ or Python. CCCSolutions provides solutions in C++, Python, and Java."
                }
              }]
            }),
          }}
        />
      </head>
      <body className="bg-background">
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-LD181T6802" />
        <Script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LD181T6802');
            `,
          }}
        />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
