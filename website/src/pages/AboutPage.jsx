  import React from 'react';
  import DonSmithImage from '../assets/donsmith.jpeg';
    const contributors = [
      { initials: "AJ", name: "Amlesh Jayakumar", school: "Waterloo Collegiate Institute", contributions: "2008 S5: 2009 S4, S5: 2012 S4, 2014 S4" },
      { initials: "AL", name: "Anton Likhtarov", school: "Burnaby North S.S.", contributions: "2005 S5" },
      { initials: "AS", name: "Ahmed Sabie", school: "Glenforest Secondary School", contributions: "2000 J5/S3, 1996 P5" },
      { initials: "AT", name: "Alex Tung", school: "Hong Kong", contributions: "2014 S4" },
      { initials: "AV", name: "Aaron Voelker", school: "Bell High School", contributions: "2007 S3: 2000 S4: 1999 P5" },
      { initials: "BB", name: "Brian Bi", school: "Woburn Collegiate Institute", contributions: "2009 S5" },
      { initials: "CL", name: "Calvin Liu", school: "Glenforest Secondary School", contributions: "2003 S4: 2014 S4, 2015 S4" },
      { initials: "DC", name: "Daniel Cressman", school: "Westdale Secondary School", contributions: "2011 J5: 2012 S1: 2012 S4" },
      { initials: "DG", name: "Daniel Galperin", school: "Waterloo Collegiate Institute", contributions: "2009 S5" },
      { initials: "DH", name: "Daniel Hui", school: "Woburn Collegiate Institute", contributions: "2012 S4" },
      { initials: "DW", name: "Daniel Whitney", school: "Newmarket High School", contributions: "2015 S4, 2015 S5" },
      { initials: "GV", name: "Goutam Venkatramanan", school: "Harry Ainlay High School", contributions: "2009 S1" },
      { initials: "HT", name: "Hubert Tong", school: "Queens University", contributions: "2008 S4: 2001 S5" },
      { initials: "JC", name: "Johnson Chen", school: "Nepean High School", contributions: "2013 J5, S3" },
      { initials: "JJ", name: "Jason Jackson", school: "Aurora High School", contributions: "2006 S3, S5: 2005 J5" },
      { initials: "JJ2", name: "Jacob Jackson", school: "University of Toronto Schools", contributions: "2014 S5" },
      { initials: "KK", name: "Kunal Khamar", school: "Middlefield Collegiate Institute", contributions: "2013 S3" },
      { initials: "KL2", name: "Kevin Luo", school: "Eric Hamber Secondary School", contributions: "2012 S5, 2012 S4" },
      { initials: "KL", name: "Konstantin Lopyrev", school: "University of Waterloo", contributions: "2008 S3, S4, S5: 2007 J5, S5" },
      { initials: "ML", name: "Matthew Lai", school: "Steveston-London Secondary School", contributions: "2008 S5: 2007 S4" },
      { initials: "ML2", name: "Matthew Lee", school: "Galt Collegiate Institute", contributions: "2015 S3" },
      { initials: "NB", name: "Nenad Bauk", school: "Richview Collegiate Institute", contributions: "2013 S2" },
      { initials: "NV", name: "Nazar Viznytsya", school: "", contributions: "2016-2019" },
      { initials: "PS", name: "Peter Sun", school: "St. Francis Xavier S.S.", contributions: "2010 J5" },
      { initials: "RC", name: "Robin Cheng", school: "Pinetree Secondary", contributions: "2005 S5" },
      { initials: "RH", name: "Rich Hong", school: "St. George's School, Vancouver", contributions: "2006 S5" },
      { initials: "RP", name: "Richard Peng", school: "Vaughan Road Academy", contributions: "2004 S4: 2001 S4: 2000 S5" },
      { initials: "SH", name: "Sean Henderson", school: "University of Toronto", contributions: "2005 S5" },
      { initials: "SF", name: "Sumudu Fernando", school: "University of Alberta", contributions: "2011 J5, 2011 S5, 2010 S3" },
      { initials: "VL", name: "Victor Liu", school: "Dr. Norman Bethune C.I.", contributions: "2010 S5" },
      { initials: "VW", name: "Victor Wang", school: "Tecumseh Elementary", contributions: "2013 S2" },
      { initials: "VS", name: "Vassili Skarine", school: "Northview Heights S.S.", contributions: "2003 S4, S5: 2002 S4" },
      { initials: "VSi", name: "Vincent Siao", school: "St George's School", contributions: "S010 S3" },
      { initials: "WZ", name: "Weiwei Zhong", school: "Glenforest Secondary School", contributions: "2015 S3" },
      { initials: "WC", name: "Wonjohn Choi", school: "St. Francis Xavier S.S.", contributions: "2010 J5" },
      { initials: "WHL", name: "Wen-Hao Lue", school: "Bayview Glen Private School", contributions: "2007 J5: 2009 S4" },
      { initials: "YL", name: "Yikuan Li", school: "Don Mills Collegiate Institute", contributions: "2014 S4" },
      { initials: "ZZ", name: "Zihao Zhang", school: "Vincent Massey Secondary School", contributions: "2014 S4" },
      { initials: "WY", name: "William Yang", school: "Milliken Mills High School", contributions: "Website revamp"},
      { initials: "DZ", name: "Daniel Zhang", school: "Pinetree Secondary School", contributions: "Website revamp, 2019 S4"},
      { initials: "JL", name: "John Liao", school: "Lo-Ellen Park Secondary School", contributions: "Website revamp, 2017 S1-S3"},
      { initials: "OZ", name: "Oscar Zhou", school: "Abbey Park High School", contributions: "Various solutions from 2016-2024"},
      { initials: "TS", name: "Timothy Shnayder", school: "Newmarket High School", contributions: "2017, 2021, 2023 S5"},
      { initials: "AC", name: "Advay Chandorkar", school: "Glenforest Secondary School", contributions: "2025 S4"},
      { initials: "W", name: "WATER", school: "N/A", contributions: "2025 J2"}
    ];

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