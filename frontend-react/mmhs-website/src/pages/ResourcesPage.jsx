import React from 'react';
import { BookOutlined, GlobalOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const IconWrapper = styled.div`
  font-size: 1.5rem;
  margin-right: 15px;
  border-radius: 8px;
  background: ${(props) =>
    props.background || 'linear-gradient(135deg, #8a59fa, #7f73ff)'};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BookIconWrapper = styled(IconWrapper)`
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
`;

const WebIconWrapper = styled(IconWrapper)`
  background: linear-gradient(135deg, #4e54c8, #8f94fb);
`;

const Resources = () => {
  const books = [
    {
      title: 'Problems on Algorithms',
      author: 'Ian Parberry and William Gasarch',
      edition: '2nd Edition, July 2002',
      link: 'http://www.eng.unt.edu/ian/books/free/',
    },
    {
      title: 'Foundations of Computer Science',
      author: 'Lawrence Paulson',
      link: 'https://mmhs.ca/ccc/pdfbooks/Founds-FP.pdf',
    },
    {
      title: 'Algorithms Course Materials',
      author: 'Jeff Erickson',
      link: 'http://compgeom.cs.uiuc.edu/~jeffe/teaching/algorithms/',
    },
    {
      title: 'Data Structures',
      author: 'Dave Mount',
      course: 'CMSC 420 (Spring 2001)',
      link: 'https://mmhs.ca/ccc/pdfbooks/420lects.pdf',
    },
    {
      title: 'Design and Analysis of Computer Algorithms',
      author: 'David M. Mount',
      course: 'CMSC 451',
      link: 'https://mmhs.ca/ccc/pdfbooks/451lects.pdf',
    },
    {
      title: 'The Java Language Specification',
      author: 'James Gosling, Bill Joy and Guy Steele',
      link: 'https://mmhs.ca/ccc/pdfbooks/java.pdf',
    },
    {
      title: 'Sorting and Searching Algorithms: A Cookbook',
      author: 'Thomas Niemann',
      link: 'https://mmhs.ca/ccc/pdfbooks/s_man.pdf',
    },
    {
      title: 'Art of Programming Contest',
      author: 'Ahmed Shamsul Arefin',
      link: 'https://mmhs.ca/ccc/pdfbooks/Art_of_Programming_Contest_SE_for_uva.pdf',
    },
    {
      title: 'How to Think Like a Computer Scientist',
      author: 'Allen B. Downey',
      link: 'https://mmhs.ca/ccc/pdfbooks/thinkCScpp.pdf',
    },
    {
      title: 'Algorithms',
      author: 'S. Dasgupta, C.H. Papadimitrou and U.V. Vazirani',
      link: 'https://people.eecs.berkeley.edu/~vazirani/algorithms/all.pdf',
    },
    {
      title: "Competitive Programmer's Handbook",
      author: 'Antti Laaksonen',
      link: 'https://cses.fi/book/book.pdf',
    },
  ];

  const websites = [
    {
      title: 'The Wiki of the Senior Computer Team at TJHSST',
      link: 'https://tjsct.wikidot.com/',
    },
    {
      title: 'Don Mills Online Judge (aka DMOJ: Modern Online Judge)',
      link: 'https://dmoj.ca/',
    },
    {
      title: "The Lectures of TJHSST's Senior Computer Team",
      link: 'https://activities.tjhsst.edu/sct/lectures.php',
    },
    {
      title: 'The Algorithmist',
      link: 'https://algorithmist.com/wiki/Main_Page',
    },
    {
      title:
        'Data Structures and Algorithms with Object-Oriented Design Patterns in Java',
      author: 'Bruno R. Preiss',
      link: 'unavailable',
    },
  ];

  return (
    <div className="bg-gray-100">
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-16 px-4">
        <div className="container mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold mb-4">Resources</h1>
          <p className="text-xl md:text-2xl max-w-2xl mb-5">
            A list of resources for CCC preparation
          </p>
        </div>
      </div>

      <div className="space-y-8 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {/* Books Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <BookIconWrapper>
              <BookOutlined />
            </BookIconWrapper>
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
            <WebIconWrapper>
              <GlobalOutlined />
            </WebIconWrapper>
            Websites
          </h2>
          <ul className="space-y-4">
            {websites.map((site, index) => (
              <li key={index} className="border-b pb-4 last:border-b-0">
                <h3 className="font-semibold">{site.title}</h3>
                {site.author && (
                  <p className="text-sm text-gray-600">by {site.author}</p>
                )}
                {site.link && (
                  <a
                    href={site.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
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
