import type { Metadata } from 'next';
import SolutionPreviewClient from './SolutionPreviewClient';

export const metadata: Metadata = {
  title: 'Solution workspace preview | CCCSolutions',
  robots: { index: false, follow: false },
};

export default function NewSolutionPreviewPage() {
  return <SolutionPreviewClient />;
}
