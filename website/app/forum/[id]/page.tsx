import type { Metadata } from 'next';
import PostPageClient from './PostPageClient';

// We can't call the Hono API during SSR metadata generation without a JWT,
// so we fall back to a generic title that's overridden client-side.
// If you add a public (no-auth) GET /forum/posts/:id that works without a token,
// you can use that here instead.

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Attempt a public fetch for metadata (the Hono GET /forum/posts/:id endpoint is public)
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
  try {
    const res = await fetch(`${apiBase}/forum/posts/${id}`, {
      next: { revalidate: 60 }, // cache for 60s
    });
    if (res.ok) {
      const { post } = await res.json() as {
        post: {
          title: string;
          content: string;
          authorUsername: string | null;
          createdAt: string;
        };
      };

      const authorName = post.authorUsername ?? 'Unknown';
      const plainContent = (post.content ?? '').replace(/<[^>]*>/g, '').trim();
      const description =
        plainContent.length > 155
          ? plainContent.slice(0, 155) + '…'
          : plainContent || 'Discussion on the CCC Solutions forum.';

      return {
        title: `${post.title} by ${authorName} | CCC Forum`,
        description,
        alternates: { canonical: `https://cccsolutions.ca/forum/${id}` },
        openGraph: {
          title: `${post.title} by ${authorName}`,
          description,
          url: `https://cccsolutions.ca/forum/${id}`,
          type: 'article',
          authors: post.authorUsername ? [post.authorUsername] : undefined,
          publishedTime: post.createdAt,
        },
        twitter: {
          card: 'summary_large_image',
          title: `${post.title} by ${authorName}`,
          description,
        },
      };
    }
  } catch {
    // Silently fall back to generic title
  }

  return { title: 'Forum Post | CCC Solutions' };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <PostPageClient id={id} />;
}
