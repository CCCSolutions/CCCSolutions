export const metadata = {
  title: 'CCC Preparation Resources | Books, Websites & Tools for Canadian Computing Competition',
  description: 'Essential resources to prepare for the Canadian Computing Competition (CCC). Recommended books, practice platforms (DMOJ, Codeforces), guides, and competitive programming tools for CCC success.',
  keywords: 'CCC preparation, CCC resources, Canadian Computing Competition study guide, competitive programming books, DMOJ, Codeforces, USACO guide, CCC practice problems, algorithm books, CCC training',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://cccsolutions.ca/resources',
  },
  openGraph: {
    title: 'CCC Preparation Resources | Study Materials & Practice',
    description: 'Curated resources to help you excel at the Canadian Computing Competition: books, websites, and practice platforms.',
    url: 'https://cccsolutions.ca/resources',
  },
};

export default function ResourcesLayout({ children }) {
  return children;
}
