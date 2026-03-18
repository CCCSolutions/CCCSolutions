'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card, Heading, Text } from '@radix-ui/themes';
import { PersonIcon, FileTextIcon, GitHubLogoIcon } from '@radix-ui/react-icons';
import { FlickeringGrid } from '../components/FlickeringGrid';

import { stats } from '../constants';

const Home = () => {
  return (
    <div>
      {/* Announcement Banner */}
      <div className="bg-indigo-600 text-white text-center py-2.5 px-4 font-semibold relative z-10 shadow-sm">
        <Link href="/forum" className="text-white hover:text-indigo-100 transition-colors">
          Help us expand our repository! Submit your 2026 solutions <u>here</u>.
        </Link>
      </div>

      <div className="bg-gray-100">
      {/* Hero Section — FlickeringGrid + AuroraText */}
      <div className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 bg-gradient-to-b from-blue-900 to-indigo-950 overflow-hidden">
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
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            The{' '}
            <span className="bg-linear-to-tr from-indigo-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">
              most comprehensive
            </span>{' '}
            CCC solution repository
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mb-10 mx-auto" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Find <span className="font-bold">detailed solutions</span> to the Canadian Computing Competition, all in one place
          </p>
          <div className="flex justify-center gap-2">
            <Button asChild color="indigo" variant="solid" size="3">
              <Link href="/solutions">
                Explore Solutions
              </Link>
            </Button>
            <Button asChild color="gray" variant="soft" size="3">
              <Link href="/forum" className="!bg-white !text-blue-700">
                Visit Forum
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Old image-based hero (uncomment to switch back):
      <div
        className="relative bg-cover bg-center text-white min-h-screen flex flex-col justify-center items-center text-center px-4"
        style={{ backgroundImage: `url(/images/image.png)` }}
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          The <span className="bg-linear-to-r from-indigo-400 via-indigo-300 to-blue-300 bg-clip-text text-transparent">
            most comprehensive
          </span> CCC solution repository
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mb-10">
          Find <span className="font-bold">detailed solutions</span> to the Canadian Computing Competition, all in one place
        </p>
        <div className="flex space-x-4">
          <Link href="/solutions" className="bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            Explore Solutions
          </Link>
          <Link href="/forum" className="bg-white text-blue-700 font-bold py-3 px-6 rounded-lg">
            Visit Forum
          </Link>
        </div>
      </div>
      */}
      </div>

      {/* Content Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-black">
            Find CCC solutions{' '}
            <span className="bg-linear-to-r from-yellow-400 to-amber-400 px-2 py-1 rounded">
              From 1996 To Present
            </span>
          </h2>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-10 mx-16">
            {[
              {
                title: 'Interactive Forum',
                content: 'Discuss with peers through the forum to tackle challenging CCC problems and improve your skills.',
                icon: <PersonIcon width="28" height="28" className="shrink-0 text-indigo-600" />,
              },
              {
                title: 'Comprehensive Solutions',
                content: 'Access explanations, test files, and multiple approaches to solve CCC problems dating back to 1996.',
                icon: <FileTextIcon width="28" height="28" className="shrink-0 text-indigo-600" />,
              },
              {
                title: 'Open Source',
                content: 'Check out our GitHub repository. Contribute, suggest improvements, or learn from the codebase.',
                icon: <GitHubLogoIcon width="28" height="28" className="shrink-0 text-indigo-600" />,
              },
            ].map((feature, index) => (
              <Card key={index} size="3" variant="surface" className="h-full">
                <div className="flex flex-col items-start gap-4">
                  {feature.icon}
                  <div>
                    <Heading as="h3" size="4" weight="bold" color="indigo">
                      {feature.title}
                    </Heading>
                    <Text as="p" size="3" color="gray" mt="2">
                      {feature.content}
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Statistics */}
          <Card size="3" variant="surface" className="mx-16">
            <div className="grid md:grid-cols-3 gap-16">
              <div className="text-center p-3">
                <Text as="p" size="7" weight="bold" color="indigo">{stats.activeUsers}</Text>
                <Text as="p" size="2" color="gray">Active Users</Text>
              </div>
              <div className="text-center p-3">
                <Text as="p" size="7" weight="bold" color="indigo">{stats.numSolutions}</Text>
                <Text as="p" size="2" color="gray">CCC Solutions</Text>
              </div>
              <div className="text-center p-3">
                <Text as="p" size="7" weight="bold" color="indigo">{stats.history}</Text>
                <Text as="p" size="2" color="gray">Providing Answers</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
