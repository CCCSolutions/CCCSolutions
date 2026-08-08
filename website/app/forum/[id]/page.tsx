import type { Metadata } from 'next';
import PostPageClient from './PostPageClient';

type ApiPost = {
  title: string;
  content: string;
  createdAt: string;
  author: { username: string | null };
};

// GET /forum/posts/:id is public, so metadata generation can hit it directly
// with plain fetch — no JWT needed, and apiFetch only works client-side anyway
// (it reads the session from the browser's local storage).
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.cccsolutions.ca';

async function getPost(id: string): Promise<ApiPost | null> {
  try {
    const res = await fetch(`${apiBase}/forum/posts/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const { post } = (await res.json()) as { post: ApiPost };
    return post;
  } catch {
    return null;
  }
}

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: 'Post Not Found | CCC Forum' };
  }

  const authorName = post.author?.username ?? 'Unknown';
  const plainBody = (post.content || '').replace(/<[^>]*>/g, '').trim();
  const description =
    plainBody.length > 155
      ? plainBody.slice(0, 155) + '…'
      : plainBody || 'Discussion on the CCC Solutions forum.';

  const title = `${post.title} by ${authorName} | CCC Forum`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://cccsolutions.ca/forum/${id}`,
    },
    openGraph: {
      title: `${post.title} by ${authorName}`,
      description,
      url: `https://cccsolutions.ca/forum/${id}`,
      type: 'article',
      authors: post.author?.username ? [post.author.username] : undefined,
      publishedTime: post.createdAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} by ${authorName}`,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <PostPageClient id={id} />;
}
