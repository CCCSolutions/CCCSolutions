'use client';

import React from 'react';
import BookOutlined from '@ant-design/icons/BookOutlined';
import GlobalOutlined from '@ant-design/icons/GlobalOutlined';

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
      title: "📌 Competitive Programmer's Handbook",
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
    <div className="bg-gray-100">
      {/* Hero Section with Gradient */}
      <div className="bg-linear-to-r from-blue-800 to-indigo-900 text-white py-16 px-4">
        <div className="container mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold mb-4">Resources</h1>
          <p className="text-xl md:text-2xl max-w-2xl mb-5">
            A list of useful resources to prepare for the CCC.
          </p>
        </div>
      </div>

      <div className="space-y-8 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {/* Books Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <div className="text-2xl mr-4 rounded-lg bg-linear-to-br from-red-500 to-orange-400 text-white flex items-center justify-center w-10 h-10 flex-shrink-0 shadow-sm">
              <BookOutlined />
            </div>
            Books
          </h2>
          <ul className="space-y-4">
            {books.map((book, index) => (
              <li key={index} className="border-b pb-4 last:border-b-0">
                <h3 className="font-semibold">{book.title}</h3>
                <p className="text-sm text-gray-600">
                  {book.author}
                  {book.edition && ` - ${book.edition}`}
                  {book.course && ` (${book.course})`}
                </p>
                {book.link && (
                  <a
                    href={book.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Download PDF
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Websites Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <div className="text-2xl mr-4 rounded-lg bg-linear-to-br from-indigo-600 to-blue-400 text-white flex items-center justify-center w-10 h-10 flex-shrink-0 shadow-sm">
              <GlobalOutlined />
            </div>
            Websites
          </h2>
          <ul className="space-y-4">
            {websites.map((site, index) => (
              <li key={index} className="border-b pb-4 last:border-b-0">
                <h3 className="font-semibold">{site.title}</h3>
                {site.author && (
                  <p className="text-sm text-gray-600">by {site.author}</p>
                )}
                {site.description && (
                  <p className="text-sm text-gray-700 mt-1">{site.description}</p>
                )}
                {site.link && (
                  <a
                    href={site.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                  >
                    Visit Site
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Resources;
