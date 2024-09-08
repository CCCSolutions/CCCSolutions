import React from 'react';
import JohnLiao from '../assets/john_liao.jpg';
import WilliamYang from '../assets/william_yang.jpg';

const About = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white min-h-[35vh] flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">About MMHS</h1>
        <p className="text-xl md:text-2xl max-w-2xl mb-10">
          Learn more about our journey, from humble beginnings to a comprehensive platform offering CCC solutions since 1996.
        </p>
      </div>

      {/* Timeline Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Our Journey</h2>
          <div className="space-y-8">
            {[
              { year: 1996, title: "The Beginning", content: "Chris Robart of Milliken Mills High School started offering CCC solutions using Turing and Ready: Java." },
              { year: 2011, title: "Transition to Python", content: "Solutions were transitioned to Python, continuing the legacy of comprehensive CCC solutions." },
              { year: 2024, title: "Ongoing Contributions", content: "The repository has been modernized with a new forum feature added for users to submit new solutions for C++, Python and Java" },
            ].map((item, index) => (
              <div key={index} className="flex items-center bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl">
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
      <div className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-6">A Special Tribute</h2>
          <p className="text-lg text-center mb-16">
            We are incredibly grateful for two teachers from MMHS who have been key in creating and maintaining this website. Enjoy your retirement!
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { name: "Chris Robart", role: "Computer Science, 1996-2015", image: "https://live.staticflickr.com/5725/buddyicons/7374177@N03_l.jpg?1451326165" },
              { name: "Don Smith", role: "Math & Computer Science, 1988-2022", image: "https://media.licdn.com/dms/image/v2/C5603AQGWsDKiYJdxIQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1626640887337?e=1731542400&v=beta&t=zT-32kfQKSwhPOnLgd5nMKL8shWR9KPgtbhT9wJRmug" },
            ].map((teacher, index) => (
              <div key={index} className="w-64 text-center bg-gray-100 rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300">
                <img src={teacher.image} alt={teacher.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                <h3 className="text-2xl font-semibold mb-2">{teacher.name}</h3>
                <p className="text-lg">{teacher.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revampers Section */}
      <div className="bg-gray-200 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">The Revamp Team</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { name: "William Yang", school: "Milliken Mills H.S.", image: WilliamYang },
              { name: "Daniel Zhang", school: "Pinetree S.S.", image: "https://media.licdn.com/dms/image/v2/D4E03AQHWDwWmAWQXzQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1721608220428?e=1730332800&v=beta&t=zSJan6bXI4Mb6vJH9YmQ9yODA4GEq1O-R3SfBZG9SGg" },
              { name: "John Liao", school: "Lo-Ellen Park S.S.", image: JohnLiao },
            ].map((member, index) => (
              <div key={index} className="w-64 flex flex-col items-center bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition duration-300">
                <img src={member.image} alt={member.name} className="w-32 h-32 rounded-full mb-4 object-cover" />
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p>{member.school}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contributors Section */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Major Contributors</h2>
          <p className="text-lg text-center mb-10">
            We are grateful for the contributions of the following individuals who have helped contribute solutions to this website
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "AJ - Amlesh Jayakumar of Waterloo Collegiate Institute",
              "AL - Anton Likhtarov of Burnaby North S.S.",
              "AS - Ahmed Sabie of Glenforest Secondary School",
              "AT - Alex Tung of Hong Kong",
              "AV - Aaron Voelker of Bell High School",
              "BB - Brian Bi of Woburn Collegiate Institute",
              // ... (add all contributors here)
            ].map((contributor, index) => (
              <div key={index} className="bg-gray-100 rounded-lg p-4 hover:shadow-md transition duration-300">
                <p>{contributor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
