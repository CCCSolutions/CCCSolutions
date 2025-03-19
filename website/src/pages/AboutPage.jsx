import React from 'react';
import DonSmithImage from '../assets/donsmith.jpeg';
import { contributors } from '../../constants';

const About = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <title>About</title>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-16 px-4">
        <div className="container mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl md:text-2xl max-w-2xl mb-5">
            Learn more about our journey in becoming a comprehensive platform offering CCC solutions
            since 1996.
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white py-16 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-4xl font-bold text-center mb-10 text-blue-900">Our Journey</h2>
          <div className="space-y-8">
            {[
              {
                year: 2001,
                title: "The Beginning",
                content: "Chris Robart of Milliken Mills High School started offering CCC solutions using Turing and Ready: Java.",
              },
              {
                year: 2011,
                title: "Transition to Python",
                content: "Solutions were transitioned to Python, continuing the legacy of comprehensive CCC solutions.",
              },
              {
                year: 2024,
                title: "Ongoing Contributions",
                content:
                  "The repository has been modernized with a new forum feature added for users to submit new solutions for C++, Python, and Java.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-blue-800 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {item.year}
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tribute Section */}
      <div className="bg-gray-50 py-16 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-6 text-blue-900">A Special Thanks</h2>
          <p className="text-lg text-center mb-8 max-w-2xl m-auto">
            We are incredibly grateful for two teachers from MMHS who have been key in creating and
            maintaining this website. Enjoy your retirement!
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              {
                name: "Chris Robart",
                role: "Computer Science, <br />1996-2015",
                image:
                  "https://live.staticflickr.com/5725/buddyicons/7374177@N03_l.jpg?1451326165",
              },
              {
                name: "Don Smith",
                role: "Math & Computer Science, 1988-2022",
                image: DonSmithImage,
              },
            ].map((teacher, index) => (
              <div
                key={index}
                className="w-64 text-center bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <img
                  src={teacher.image}
                  alt={teacher.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-2xl font-semibold mb-2">{teacher.name}</h3>
                <p
                  className="text-lg"
                  dangerouslySetInnerHTML={{ __html: teacher.role }}
                ></p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contributors Section */}
      <div className="bg-white py-16 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-7 text-blue-900">Major Contributors</h2>
          <p className="text-lg text-center mb-10">
            We are grateful for the following individuals who have helped contribute solutions to
            this website:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 m-8">
            {contributors.map((contributor, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {contributor.initials}
                  </div>
                  <h3 className="font-semibold">{contributor.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">{contributor.school}</p>
                <p className="text-xs text-gray-500">Contributions: {contributor.contributions}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About the School Section */}
      <div className="bg-gray-50 py-16 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-blue-900 mb-6">About Milliken Mills High School</h2>
          <p className="text-xl mb-4">
            Milliken Mills High School is a public school offering the IB Diploma Programme in
            Markham, Ontario, Canada.
          </p>
          <p className="text-lg">
            This site has been re-built and maintained with the help of the MMHS Computer Science
            club and several other contributors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;