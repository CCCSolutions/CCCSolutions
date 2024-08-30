import React from 'react';

const About = () => {
  return (
    <div className="bg-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white min-h-[40vh] flex flex-col justify-center items-center text-center px-4">
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
            {/* Timeline Item 1 */}
            <div className="flex items-center">
              <div className="bg-blue-600 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold">1996</div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold">The Beginning</h3>
                <p>Chris Robart of Milliken Mills High School started offering CCC solutions using Turing and Ready: Java.</p>
              </div>
            </div>
            {/* Timeline Item 2 */}
            <div className="flex items-center">
              <div className="bg-blue-600 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold">2011</div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold">Transition to Python</h3>
                <p>Solutions were transitioned to Python, continuing the legacy of comprehensive CCC solutions.</p>
              </div>
            </div>
            {/* Timeline Item 3 */}
            <div className="flex items-center">
              <div className="bg-blue-600 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold">2024</div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold">Ongoing Contributions</h3>
                <p>The repository has been modernized with a new forum feature added for users to submit new solutions for C++, Python and Java</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revampers Section */}
      <div className="bg-gray-200 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Revamp</h2>
          <p className="text-lg text-center mb-10">
            Special thanks to the following individuals who helped revamp this website:
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="w-1/3 flex flex-col items-center">
              <img src="[Photo URL 1]" alt="[Revamper Name 1]" className="w-32 h-32 rounded-full mb-4" />
              <h3 className="text-xl font-semibold">[Revamper Name 1]</h3>
              <p>Description of their contributions.</p>
            </div>
            <div className="w-1/3 flex flex-col items-center">
              <img src="[Photo URL 2]" alt="[Revamper Name 2]" className="w-32 h-32 rounded-full mb-4" />
              <h3 className="text-xl font-semibold">[Revamper Name 2]</h3>
              <p>Description of their contributions.</p>
            </div>
            <div className="w-1/3 flex flex-col items-center">
              <img src="[Photo URL 3]" alt="[Revamper Name 3]" className="w-32 h-32 rounded-full mb-4" />
              <h3 className="text-xl font-semibold">[Revamper Name 3]</h3>
              <p>Description of their contributions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contributors Section */}
      <div className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Contributors</h2>
          <p className="text-lg text-center mb-10">
            We are grateful for the contributions of the following individuals who have helped build and maintain this platform:
          </p>
          <ul className="text-center space-y-4">
            <li><strong>AJ</strong> - Amlesh Jayakumar of Waterloo Collegiate Institute (2008 S5: 2009 S4, S5: 2012 S4, 2014 S4)</li>
            <li><strong>AL</strong> - Anton Likhtarov of Burnaby North S.S. (2005 S5)</li>
            <li><strong>AS</strong> - Ahmed Sabie of Glenforest Secondary School (2000 J5/S3, 1996 P5)</li>
            <li><strong>AT</strong> - Alex Tung of Hong Kong (2014 S4)</li>
            <li><strong>AV</strong> - Aaron Voelker of Bell High School. (2007 S3: 2000 S4: 1999 P5)</li>
            <li><strong>BB</strong> - Brian Bi of Woburn Collegiate Institute (2009 S5)</li>
            <li><strong>CL</strong> - Calvin Liu of Glenforest Secondary School (2003 S4: 2014 S4, 2015 S4)</li>
            <li><strong>DC</strong> - Daniel Cressman of Westdale Secondary School (2011 J5: 2012 S1: 2012 S4)</li>
            <li><strong>DG</strong> - Daniel Galperin of Waterloo Collegiate Institute (2009 S5)</li>
            <li><strong>DH</strong> - Daniel Hui of Woburn Collegiate Institute (2012 S4)</li>
            <li><strong>DW</strong> - Daniel Whitney of Newmarket High School (2015 S4, 2015 S5)</li>
            <li><strong>GV</strong> - Goutam Venkatramanan of Harry Ainlay High School (2009 S1)</li>
            <li><strong>HT</strong> - Hubert Tong of Queens University (2008 S4: 2001 S5)</li>
            <li><strong>JC</strong> - Johnson Chen of Nepean High School (2013 J5, S3)</li>
            <li><strong>JJ</strong> - Jason Jackson of Aurora High School (2006 S3, S5: 2005 J5)</li>
            <li><strong>JJ2</strong> - Jacob Jackson of University of Toronto Schools (2014 S5)</li>
            <li><strong>KK</strong> - Kunal Khamar of Middlefield Collegiate Institute (2013 S3)</li>
            <li><strong>KL2</strong> - Kevin Luo of Eric Hamber Secondary School (2012 S5, 2012 S4)</li>
            <li><strong>KL</strong> - Konstantin Lopyrev of the University of Waterloo. (2008 S3, S4, S5: 2007 J5, S5)</li>
            <li><strong>ML</strong> - Matthew Lai of Steveston-London Secondary School. (2008 S5: 2007 S4)</li>
            <li><strong>ML2</strong> - Matthew Lee of Galt Collegiate Institute (2015 S3)</li>
            <li><strong>NB</strong> - Nenad Bauk of Richview Collegiate Institute (2013 S2)</li>
            <li><strong>NV</strong> - Nazar Viznytsya (2016-2019)</li>
            <li><strong>PS</strong> - Peter Sun of St. Francis Xavier S.S. (2010 J5)</li>
            <li><strong>RC</strong> - Robin Cheng of Pinetree Secondary (2005: S5)</li>
            <li><strong>RH</strong> - Rich Hong of St. George's School, Vancouver (2006 S5)</li>
            <li><strong>RP</strong> - Richard Peng of Vaughan Road Academy (2004 S4: 2001 S4: 2000 S5)</li>
            <li><strong>SH</strong> - Sean Henderson of the University of Toronto (2005 J5)</li>
            <li><strong>TH</strong> - Tim Hu of University of Toronto (2010 S5)</li>
            <li><strong>TK</strong> - Tamer Khater of Oakville Trafalgar High School (2007 S4)</li>
            <li><strong>TM</strong> - Taufik Mohd of Danforth Collegiate and Technical Institute (2011 S5)</li>
            <li><strong>WD</strong> - William Do of St. Michael's College School (2012 S4)</li>
            <li><strong>ZH</strong> - Zeyu Huang of Yates Collegiate Institute (2013 S5)</li>
            <li><strong>ZY</strong> - Zhanqi Yang of Humberside Collegiate Institute (2013 S5)</li>
            {/* Add more contributors as needed */}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
