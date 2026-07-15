import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../src/index';
import { profiles, posts, comments, votes } from '../../src/db/schema';

// Mock jose for JWT verification
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(),
  jwtVerify: vi.fn(async (token) => {
    if (token === 'invalid-token') {
      throw new Error('Invalid JWT');
    }
    return {
      payload: {
        sub: 'mock-auth-user-id',
        aud: 'authenticated',
        iss: 'https://mock-supabase.supabase.co/auth/v1',
      },
    };
  }),
}));

let profileExists = true;
let mockProfile = {
  id: 'mock-profile-id',
  authUserId: 'mock-auth-user-id',
  username: 'valid_user',
  role: 'user',
};

let postExists = true;
let commentExists = true;
let existingVoteValue: number | null = null; // null means no existing vote

const mockPosts = [{
  id: 'mock-post-id',
  title: 'Mock Title',
  content: 'Mock Content',
  score: 5,
  createdAt: '2026-07-15T12:00:00Z',
  authorUsername: 'valid_user',
  authorAvatarUrl: null,
  authorRole: 'user',
}];

const mockComments = [{
  id: 'mock-comment-id',
  content: 'Mock Comment Content',
  score: 2,
  createdAt: '2026-07-15T12:05:00Z',
  authorUsername: 'valid_user',
  authorAvatarUrl: null,
  authorRole: 'user',
}];

class MockQueryBuilder {
  private _result: any;

  constructor(result: any) {
    this._result = result;
  }

  from = vi.fn().mockImplementation((table) => {
    if (table === profiles) {
      this._result = profileExists ? [mockProfile] : [];
    } else if (table === posts) {
      this._result = postExists ? mockPosts : [];
    } else if (table === comments) {
      this._result = commentExists ? mockComments : [];
    } else if (table === votes) {
      this._result = existingVoteValue !== null ? [{ value: existingVoteValue }] : [];
    }
    return this;
  });

  leftJoin = vi.fn().mockReturnThis();
  orderBy = vi.fn().mockReturnThis();
  where = vi.fn().mockReturnThis();
  values = vi.fn().mockReturnThis();
  onConflictDoUpdate = vi.fn().mockReturnThis();
  limit = vi.fn().mockImplementation(async () => this._result);
  returning = vi.fn().mockImplementation(async () => this._result);

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return Promise.resolve(this._result).then(onfulfilled, onrejected);
  }
}

const mockSelect = vi.fn().mockImplementation(() => new MockQueryBuilder([]));
const mockDelete = vi.fn().mockImplementation(() => new MockQueryBuilder(undefined));
const mockInsert = vi.fn().mockImplementation((table) => {
  if (table === posts) {
    return new MockQueryBuilder([{ id: 'new-post-id', title: 'New Post', content: 'New Content' }]);
  }
  if (table === comments) {
    return new MockQueryBuilder([{ id: 'new-comment-id', content: 'New Comment' }]);
  }
  return new MockQueryBuilder([{ id: 'mock-vote-id' }]);
});

const mockDb = {
  select: mockSelect,
  delete: mockDelete,
  insert: mockInsert,
};

vi.mock('../../src/db', () => ({
  getDb: () => mockDb,
}));

// Helper for authorized requests headers
function authHeaders(token = 'valid-token') {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

describe('Forum API Router', () => {
  beforeEach(() => {
    profileExists = true;
    mockProfile = {
      id: 'mock-profile-id',
      authUserId: 'mock-auth-user-id',
      username: 'valid_user',
      role: 'user',
    };
    postExists = true;
    commentExists = true;
    existingVoteValue = null;
    vi.clearAllMocks();
  });

  describe('GET /forum/posts', () => {
    it('returns list of posts (newest first by default)', async () => {
      const res = await app.request('/forum/posts');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockPosts);
    });

    it('returns list of posts sorted by top score', async () => {
      const res = await app.request('/forum/posts?sort=top');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockPosts);
    });
  });

  describe('GET /forum/posts/:id', () => {
    it('returns 404 when post is not found', async () => {
      postExists = false;
      const res = await app.request('/forum/posts/non-existent-id');
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Post not found' });
    });

    it('returns the post and comments when post is found', async () => {
      const res = await app.request('/forum/posts/mock-post-id');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        post: mockPosts[0],
        comments: mockComments,
      });
    });
  });

  describe('POST /forum/posts', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await app.request('/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Hello',
          content: 'World',
        }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 403 when onboarding is incomplete (placeholder username)', async () => {
      mockProfile.username = 'user_12345';
      const res = await app.request('/forum/posts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: 'Hello',
          content: 'World',
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        error: 'You must complete onboarding and set a username before posting.',
      });
    });

    it('creates post successfully when request is valid', async () => {
      const res = await app.request('/forum/posts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: 'New Post Title',
          content: 'New Post Content',
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({
        id: 'new-post-id',
        title: 'New Post',
        content: 'New Content',
      });
      expect(mockInsert).toHaveBeenCalledWith(posts);
    });
  });

  describe('POST /forum/posts/:id/comments', () => {
    it('returns 403 when onboarding is incomplete (placeholder username)', async () => {
      mockProfile.username = 'user_12345';
      const res = await app.request('/forum/posts/mock-post-id/comments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          content: 'Nice post',
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });
      expect(res.status).toBe(403);
    });

    it('returns 404 when target post is not found', async () => {
      postExists = false;
      const res = await app.request('/forum/posts/non-existent-id/comments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          content: 'Nice post',
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Post not found' });
    });

    it('creates comment successfully when request is valid', async () => {
      const res = await app.request('/forum/posts/mock-post-id/comments', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          content: 'This is comment content',
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({
        id: 'new-comment-id',
        content: 'New Comment',
      });
      expect(mockInsert).toHaveBeenCalledWith(comments);
    });
  });

  describe('DELETE /forum/vote', () => {
    const validUuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

    it('returns 401 when Authorization header is missing', async () => {
      const res = await app.request('/forum/vote', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('returns 401 when JWT verification fails', async () => {
      const res = await app.request('/forum/vote', {
        method: 'DELETE',
        headers: authHeaders('invalid-token'),
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('returns 500 when profile is not found in database', async () => {
      profileExists = false;

      const res = await app.request('/forum/vote', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Profile not found. Please contact support.' });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('returns 403 when onboarding is incomplete (placeholder username)', async () => {
      mockProfile.username = 'user_12345';

      const res = await app.request('/forum/vote', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'You must complete onboarding before voting.' });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('returns 400 when payload is invalid (invalid UUID)', async () => {
      const res = await app.request('/forum/vote', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'post',
          votableId: 'not-a-uuid',
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(400);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('successfully deletes a vote on a post', async () => {
      const res = await app.request('/forum/vote', {
        method: 'DELETE',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(mockDelete).toHaveBeenCalledWith(votes);
    });
  });

  describe('POST /forum/vote', () => {
    const validUuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

    it('returns 403 when onboarding is incomplete', async () => {
      mockProfile.username = 'user_12345';

      const res = await app.request('/forum/vote', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
          value: 1,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        error: 'You must complete onboarding and set a username before voting.',
      });
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('returns 404 if target post not found', async () => {
      postExists = false;

      const res = await app.request('/forum/vote', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
          value: 1,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Post not found' });
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('returns 404 if target comment not found', async () => {
      commentExists = false;

      const res = await app.request('/forum/vote', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'comment',
          votableId: validUuid,
          value: -1,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Comment not found' });
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('creates a new vote successfully (no existing vote)', async () => {
      existingVoteValue = null;

      const res = await app.request('/forum/vote', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
          value: 1,
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, delta: 1 });
      expect(mockInsert).toHaveBeenCalledWith(votes);
    });

    it('updates existing vote and returns correct delta', async () => {
      existingVoteValue = 1; // user already upvoted (+1)

      const res = await app.request('/forum/vote', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          votableType: 'post',
          votableId: validUuid,
          value: -1, // changing to downvote (-1)
        }),
      }, {
        SUPABASE_URL: 'https://mock-supabase.supabase.co',
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, delta: -2 }); // -1 - 1 = -2
      expect(mockInsert).toHaveBeenCalledWith(votes);
    });
  });
});
