import React from 'react';
import Image from 'next/image';
import { Avatar, Card } from '@radix-ui/themes';
import { contributors } from '../../constants';

const About = () => {
  const timeline = [
    {
      year: 2001,
      title: 'The Beginning',
      content: 'Chris Robart of Milliken Mills High School started offering CCC solutions using Turing and Ready: Java.',
    },
    {
      year: 2011,
      title: 'Transition to Python',
      content: 'Solutions were transitioned to Python, continuing the legacy of comprehensive CCC solutions.',
    },
    {
      year: 2024,
      title: 'Ongoing Contributions',
      content: 'The repository has been modernized with a new forum feature added for users to submit new solutions for C++, Python, and Java.',
    },
  ];

  const teachers = [
    {
      name: 'Chris Robart',
      role: 'Computer Science, 1996–2015',
      image: 'https://live.staticflickr.com/5725/buddyicons/7374177@N03_l.jpg?1451326165',
    },
    {
      name: 'Don Smith',
      role: 'Math & Computer Science, 1988–2022',
      image: '/images/donsmith.jpeg',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-blue-900 text-white py-20 px-4">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">About CCC Solutions</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Learn more about our journey in becoming the most comprehensive platform for Canadian Computing Competition solutions since 1996.
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Our Journey</h2>

          <div className="relative pl-8 border-l-2 border-indigo-200 space-y-6">
            {timeline.map((item, index) => (
              <div key={index} className="relative">
                <Card size="2" variant="surface">
                  <div className="flex items-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-indigo-600 shrink-0">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-indigo-600 font-semibold">{item.year}</p>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{item.title}</div>
                  <p className="text-gray-600 text-sm">{item.content}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      <hr className="mx-auto max-w-5xl border-gray-200" />

      {/* Tribute Section */}
      <div className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-gray-900">A Special Thanks</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            We are incredibly grateful for two teachers from MMHS who have been key in creating and
            maintaining this website. Enjoy your retirement!
          </p>
          <div className="flex flex-wrap justify-center gap-10">
            {teachers.map((teacher, index) => (
              <Card key={index} size="3" variant="surface" className="w-64" style={{ boxShadow: '-4px -2px 24px 2px rgba(59, 130, 246, 0.10), 0 0 28px 4px rgba(139, 92, 246, 0.07)' }}>
                <div className="flex flex-col items-center text-center gap-3">
                  <Avatar
                    size="7"
                    src={teacher.image}
                    fallback={teacher.name[0]}
                    radius="full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{teacher.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <hr className="mx-auto max-w-5xl border-gray-200" />

      {/* Contributors Section */}
      <div className="py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3 text-gray-900">Major Contributors</h2>
          <p className="text-gray-600 text-center mb-8">
            Thank you to those who have helped contribute solutions to this website!
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contributors.map((contributor, index) => (
              <Card key={index} size="2" variant="surface">
                <div className="flex items-center gap-3">
                  <Avatar
                    size="3"
                    fallback={contributor.initials}
                    color="indigo"
                    variant="solid"
                    radius="full"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">{contributor.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{contributor.school}</p>
                    <p className="text-xs text-gray-400 truncate">{contributor.contributions}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <hr className="mx-auto max-w-5xl border-gray-200" />

      {/* About the School Section */}
      <div className="py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">About Milliken Mills High School</h2>
          <p className="text-gray-600">
            Milliken Mills High School is a public school offering the IB Diploma Programme in
            Markham, Ontario, Canada. This site has been re-built and maintained with the help of the
            MMHS Computer Science club and several other contributors.
          </p>
          <Image
            src="/images/mmhs_4.jpg"
            alt="Milliken Mills High School"
            width={800}
            height={450}
            className="mt-6 rounded-lg mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default About;
