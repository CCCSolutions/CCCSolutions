export const metadata = {
  title: 'About CCCSolutions | Canadian Computing Competition Solution Repository Since 1996',
  description: "Learn about CCCSolutions' 20+ year history providing comprehensive Canadian Computing Competition solutions. Founded at Milliken Mills High School in 2001, now serving 2,700+ students worldwide with 270+ CCC problem solutions.",
  keywords: 'about CCCSolutions, Canadian Computing Competition history, CCC repository, Milliken Mills High School, Chris Robart, Don Smith, CCC contributors, competitive programming community',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://cccsolutions.ca/about',
  },
  openGraph: {
    title: 'About CCCSolutions | 20+ Years of CCC solutions',
    description: 'The story behind the most comprehensive Canadian Computing Competition solution repository, serving students since 2001.',
    url: 'https://cccsolutions.ca/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
