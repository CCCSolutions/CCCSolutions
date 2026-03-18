'use client';

import React, { useState } from 'react';
import PocketBase from 'pocketbase';
import { useRouter } from 'next/navigation';
import { Button, Card, Theme } from '@radix-ui/themes';
import { FlickeringGrid } from './FlickeringGrid';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function AuthForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Login logic
        const authData = await pb.collection('users').authWithPassword(username, password);
        console.log(authData);
        setSuccess('Login successful!');
        router.push('/forum');
      } else {
        // Registration logic
        const data = {
          username,
          password,
          passwordConfirm: password,
        };

        // Create the user
        const record = await pb.collection('users').create(data);
        console.log(record);
        setSuccess('User created successfully!');

        // Automatically log in the newly created user
        const authData = await pb.collection('users').authWithPassword(username, password);
        console.log(authData);
        router.push('/forum');
      }
    } catch (error) {
      setError(isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.');
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-900 to-indigo-950 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <FlickeringGrid
          className="size-full"
          squareSize={4}
          gridGap={6}
          color="#6366f1"
          maxOpacity={0.3}
          flickerChance={0.05}
        />
      </div>
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Theme panelBackground="solid">
        <Card size="3" variant="surface">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button type="submit" color="indigo" variant="solid" size="2" className="w-full" style={{ justifyContent: 'center' }}>
                {isLogin ? 'Sign in' : 'Create account'}
              </Button>
            </div>
          </form>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => setIsLogin(!isLogin)}
              variant="ghost"
              color="indigo"
              size="1"
            >
              {isLogin ? 'Need to create an account?' : 'Already have an account?'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 text-center text-sm text-green-600">
              {success}
            </div>
          )}
        </Card>
        </Theme>
      </div>
    </div>
  );
}
