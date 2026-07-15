import type { Metadata } from 'next';
import { cache } from 'react';
import PocketBase from 'pocketbase';
import PostPageClient from './PostPageClient';

const getPost = cache(async (id: string) => {
  const pb = new PocketBase('https://mmhs.pockethost.io');
  try {
    return await pb.collection('posts').getOne(id, { expand: 'author' });
  } catch {
    return null;
  }
});

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: 'Post Not Found | CCC Forum' };
  }

  const authorName = post.expand?.author?.username || 'Unknown';
  const plainBody = (post.body || '').replace(/<[^>]*>/g, '').trim();
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
      authors: post.expand?.author?.username ? [post.expand.author.username] : undefined,
      publishedTime: post.created,
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
  const post = await getPost(id);

  return <PostPageClient id={id} initialPost={post} />;
}
