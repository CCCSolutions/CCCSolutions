import { describe, it, expect } from 'vitest';
import { app } from '../../src/index';
import { createPostSchema, createCommentSchema, idParamSchema, myVotesQuerySchema } from '../../src/forum/validation';

const id = '3f2b8c1e-9a4d-4c7e-8b21-5d6f7a8b9c0d';

describe('createPostSchema', () => {
  it('trims the title and rejects a blank one', () => {
    expect(createPostSchema.parse({ title: '  hi  ', content: 'x' }).title).toBe('hi');
    expect(createPostSchema.safeParse({ title: '   ', content: 'x' }).success).toBe(false);
  });

  it('rejects an empty Quill body', () => {
    for (const content of ['', '<p><br></p>', '<p>&nbsp; </p><p><br></p>']) {
      expect(createPostSchema.safeParse({ title: 't', content }).success).toBe(false);
    }
  });

  it('accepts a body with text or only an image', () => {
    for (const content of ['<p>hello</p>', 'plain text', '<p><img src="data:image/png;base64,AA=="></p>']) {
      expect(createPostSchema.safeParse({ title: 't', content }).success).toBe(true);
    }
  });
});

describe('createCommentSchema', () => {
  it('trims and rejects a blank comment', () => {
    expect(createCommentSchema.parse({ content: ' ok ' }).content).toBe('ok');
    expect(createCommentSchema.safeParse({ content: ' \n ' }).success).toBe(false);
  });
});

describe('idParamSchema / myVotesQuerySchema', () => {
  it('accepts a uuid and rejects anything else', () => {
    expect(idParamSchema.safeParse(id).success).toBe(true);
    expect(idParamSchema.safeParse('not-a-uuid').success).toBe(false);
  });

  it('rejects a bad type, a non-uuid id, or too many ids', () => {
    expect(myVotesQuerySchema.safeParse({ type: 'post', ids: [id] }).success).toBe(true);
    expect(myVotesQuerySchema.safeParse({ type: 'banana', ids: [id] }).success).toBe(false);
    expect(myVotesQuerySchema.safeParse({ type: 'post', ids: [id, 'abc'] }).success).toBe(false);
    expect(myVotesQuerySchema.safeParse({ type: 'post', ids: Array(501).fill(id) }).success).toBe(false);
  });
});

// Route-level: a malformed :id is a 400 before any DB work, so no Supabase needed.
describe('GET /forum/posts/:id (unit)', () => {
  it('400s on a malformed id instead of reaching Postgres', async () => {
    const res = await app.request('/forum/posts/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
