import './globals.css';
import { Theme } from '@radix-ui/themes';
import Navbar from '../components/Navbar';
import FooterWithLogo from '../components/Footer';

export const metadata = {
  metadataBase: new URL('https://cccsolutions.ca'),
  title: 'CCC Solutions 2025 | Canadian Computing Competition Solutions (1996-2025)',
  description: 'Master the Canadian Computing Competition with 270+ detailed solutions in C++, Python & Java. Complete CCC solutions from 1996-2025 with test cases, multiple approaches & explanations. Prepare for University of Waterloo CCC.',
  keywords: 'CCC, Canadian Computing Competition, CCC solutions, CCC 2025, CCC 2024, University of Waterloo, Waterloo CCC, CEMC, competitive programming, CCC preparation, CCC past problems, CCC contest, CCC test cases, programming contest Canada, algorithm practice, coding competition, CCC Senior, CCC Junior, s1 s2 s3 s4 s5, j1 j2 j3 j4 j5, graph theory, dynamic programming, data structures',
  authors: [{ name: 'CCCSolutions Community' }],
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://cccsolutions.ca',
    title: 'CCC Solutions 2025 | Canadian Computing Competition Solutions',
    description: 'Master the Canadian Computing Competition with 270+ detailed solutions in C++, Python & Java. Complete CCC solutions from 1996-2025 with test cases and explanations.',
    siteName: 'CCC Solutions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CCC Solutions 2025 | Canadian Computing Competition Solutions',
    description: 'Master the Canadian Computing Competition with 270+ detailed solutions in C++, Python & Java from 1996-2025.',
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
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LD181T6802" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LD181T6802');
            `,
          }}
        />

        {/* Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />

        {/* Structured Data: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "CCC Solutions",
              "alternateName": ["Canadian Computing Competition Solutions", "CCCSolutions"],
              "url": "https://cccsolutions.ca",
              "logo": "https://cccsolutions.ca/icon.png",
              "description": "The most comprehensive Canadian Computing Competition solution repository with 270+ solutions from 1996 to 2025",
              "educationalLevel": ["High School", "University"],
              "teaches": ["Competitive Programming", "Algorithms", "Data Structures", "Problem Solving"],
              "sameAs": ["https://github.com/Tankman61/CCCSolutions"],
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
              "name": "CCC Solutions",
              "url": "https://cccsolutions.ca",
              "description": "Complete Canadian Computing Competition solution repository from 1996-2025",
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
                  "text": "CCCSolutions.ca provides 270+ detailed solutions to CCC problems from 1996 to 2025, including code in C++, Python, and Java, along with test cases and multiple solution approaches for each problem."
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
      <body className="bg-gray-100">
        <Theme accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <FooterWithLogo />
          </div>
        </Theme>
      </body>
    </html>
  );
}
