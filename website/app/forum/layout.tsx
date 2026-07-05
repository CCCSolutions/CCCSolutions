export const metadata = {
  title: 'CCC Forum | Ask Questions & Discuss Canadian Computing Competition Solutions',
  description:
    'Join the CCCSolutions community forum. Ask questions, share solutions, and discuss Canadian Computing Competition problems with fellow competitive programmers. Active community of 2,700+ students.',
  keywords:
    'CCC forum, Canadian Computing Competition forum, CCC discussion, CCC help, competitive programming community, CCC questions, algorithm discussion, programming help',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://cccsolutions.ca/forum',
  },
  openGraph: {
    title: 'CCC Forum | Discuss Solutions & Ask Questions',
    description:
      'Community forum for Canadian Computing Competition discussion, questions, and solution sharing.',
    url: 'https://cccsolutions.ca/forum',
  },
};

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
