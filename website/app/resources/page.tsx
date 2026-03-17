'use client';

import React from 'react';
import { Card, Heading, Text } from '@radix-ui/themes';
import { ReaderIcon, GlobeIcon } from '@radix-ui/react-icons';

interface Book {
  title: string;
  author?: string;
  link?: string;
  edition?: string;
  course?: string;
}

interface Website {
  title: string;
  link?: string;
  description?: string;
  author?: string;
}

const Resources = () => {
  const books: Book[] = [
    {
      title: "Competitive Programmer's Handbook",
      author: 'Antti Laaksonen',
      link: 'https://cses.fi/book/book.pdf',
    },
  ];

  const websites: Website[] = [
    {
      title: 'DMOJ: Modern Online Judge',
      link: 'https://dmoj.ca/',
      description: 'A modern platform for programming contests with an extensive problem library and support for multiple programming languages.',
    },
    {
      title: 'Codeforces',
      link: 'https://codeforces.com/',
      description: 'One of the most popular competitive programming platforms featuring regular contests and a vast problem archive sorted by difficulty.',
    },
    {
      title: 'USACO Guide',
      link: 'https://usaco.guide',
      description: 'Contains harder problems for those seeking a challenge, although mostly targeted towards C++ users.',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-indigo-900 text-white py-16 px-4">
        <div className="relative z-10 container mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold mb-4">Resources</h1>
          <p className="text-xl md:text-2xl max-w-2xl mb-5">
            A list of useful resources to prepare for the CCC.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4 space-y-10">
        {/* Books Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <ReaderIcon width="24" height="24" className="shrink-0 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Books</h2>
          </div>
          <div className="space-y-4">
            {books.map((book, index) => (
              <Card key={index} size="3" variant="surface">
                <Heading as="h3" size="3" weight="bold">{book.title}</Heading>
                <Text as="p" size="2" color="gray" mt="1">
                  {book.author}
                  {book.edition && ` — ${book.edition}`}
                  {book.course && ` (${book.course})`}
                </Text>
                {book.link && (
                  <a
                    href={book.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Download PDF
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Websites Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <GlobeIcon width="24" height="24" className="shrink-0 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Websites</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {websites.map((site, index) => (
              <Card key={index} size="3" variant="surface">
                <Heading as="h3" size="3" weight="bold">{site.title}</Heading>
                {site.author && (
                  <Text as="p" size="2" color="gray">by {site.author}</Text>
                )}
                {site.description && (
                  <Text as="p" size="2" color="gray" mt="1">{site.description}</Text>
                )}
                {site.link && (
                  <a
                    href={site.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Visit Site
                  </a>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
