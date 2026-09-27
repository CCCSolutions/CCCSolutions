import { z } from 'zod';

// Quill sends HTML, so an empty editor is still markup like <p><br></p>. A post body
// needs visible text or an image.
const hasVisibleContent = (html: string) =>
  /<img\b/i.test(html) ||
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(300),
  content: z.string().max(50000).refine(hasVisibleContent),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(10000),
});

export const voteSchema = z.object({
  votableType: z.enum(['post', 'comment']),
  votableId: z.string().uuid(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const unvoteSchema = z.object({
  votableType: z.enum(['post', 'comment']),
  votableId: z.string().uuid(),
});

export const pinSchema = z.object({
  pinned: z.boolean(),
});

// Route params and query strings get the same treatment as bodies: bad input is a
// 400 here, not a Postgres cast error (a 500) later.
export const idParamSchema = z.string().uuid();

export const myVotesQuerySchema = z.object({
  type: z.enum(['post', 'comment']),
  ids: z.array(z.string().uuid()).max(500),
});
