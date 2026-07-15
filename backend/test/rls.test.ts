import { describe, it, expect } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { profiles, posts, comments, votes } from '../src/db/schema';

describe('Row Level Security (RLS) Policy Assertions', () => {
  it('asserts RLS policies on profiles table', () => {
    const config = getTableConfig(profiles);
    const policies = config.policies || [];
    
    expect(policies).toHaveLength(3);
    
    const selectAll = policies.find(p => p.name === 'profiles_select_all');
    expect(selectAll).toBeDefined();
    expect(selectAll?.for).toBe('select');
    
    const insertSelf = policies.find(p => p.name === 'profiles_insert_self');
    expect(insertSelf).toBeDefined();
    expect(insertSelf?.for).toBe('insert');
    
    const updateSelf = policies.find(p => p.name === 'profiles_update_self');
    expect(updateSelf).toBeDefined();
    expect(updateSelf?.for).toBe('update');
  });

  it('asserts RLS policies on posts table', () => {
    const config = getTableConfig(posts);
    const policies = config.policies || [];
    
    expect(policies).toHaveLength(4);
    
    const selectAll = policies.find(p => p.name === 'posts_select_all');
    expect(selectAll).toBeDefined();
    expect(selectAll?.for).toBe('select');
    
    const insertOwn = policies.find(p => p.name === 'posts_insert_own');
    expect(insertOwn).toBeDefined();
    expect(insertOwn?.for).toBe('insert');
    
    const updateOwn = policies.find(p => p.name === 'posts_update_own');
    expect(updateOwn).toBeDefined();
    expect(updateOwn?.for).toBe('update');
    
    const deleteOwnOrMod = policies.find(p => p.name === 'posts_delete_own_or_mod');
    expect(deleteOwnOrMod).toBeDefined();
    expect(deleteOwnOrMod?.for).toBe('delete');
  });

  it('asserts RLS policies on comments table', () => {
    const config = getTableConfig(comments);
    const policies = config.policies || [];
    
    expect(policies).toHaveLength(4);
    
    const selectAll = policies.find(p => p.name === 'comments_select_all');
    expect(selectAll).toBeDefined();
    expect(selectAll?.for).toBe('select');
    
    const insertOwn = policies.find(p => p.name === 'comments_insert_own');
    expect(insertOwn).toBeDefined();
    expect(insertOwn?.for).toBe('insert');
    
    const updateOwn = policies.find(p => p.name === 'comments_update_own');
    expect(updateOwn).toBeDefined();
    expect(updateOwn?.for).toBe('update');
    
    const deleteOwnOrMod = policies.find(p => p.name === 'comments_delete_own_or_mod');
    expect(deleteOwnOrMod).toBeDefined();
    expect(deleteOwnOrMod?.for).toBe('delete');
  });

  it('asserts RLS policies on votes table', () => {
    const config = getTableConfig(votes);
    const policies = config.policies || [];
    
    expect(policies).toHaveLength(4);
    
    const selectOwn = policies.find(p => p.name === 'votes_select_own');
    expect(selectOwn).toBeDefined();
    expect(selectOwn?.for).toBe('select');
    
    const insertOwnReal = policies.find(p => p.name === 'votes_insert_own_real_user');
    expect(insertOwnReal).toBeDefined();
    expect(insertOwnReal?.for).toBe('insert');
    
    const updateOwn = policies.find(p => p.name === 'votes_update_own');
    expect(updateOwn).toBeDefined();
    expect(updateOwn?.for).toBe('update');
    
    const deleteOwn = policies.find(p => p.name === 'votes_delete_own');
    expect(deleteOwn).toBeDefined();
    expect(deleteOwn?.for).toBe('delete');
  });
});
