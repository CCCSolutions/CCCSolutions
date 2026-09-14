import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(50000),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
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
