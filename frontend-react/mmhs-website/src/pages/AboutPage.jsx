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

      {/* Tribute Section */}
      <div className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-6">A Special Tribute</h2>
          <p className="text-lg text-center mb-16">
            We are incredibly grateful for two teachers from MMHS who have been key in creating and maintaining this website. Enjoy your retirement!
          </p>
          <div className="flex justify-center space-x-8">
            <div className="text-center w-1/2">
              <img
                src="[Chris Robart Photo URL]"
                alt="Chris Robart"
                className="w-32 h-32 rounded-full mx-auto mb-4"
              />
              <h3 className="text-2xl font-semibold mb-2">Chris Robart</h3>
              <p className="text-lg">Computer Science, 1996-2015</p>
            </div>
            <div className="text-center w-1/2">
              <img
                src="[Don Smith Photo URL]"
                alt="Don Smith"
                className="w-32 h-32 rounded-full mx-auto mb-4"
              />
              <h3 className="text-2xl font-semibold mb-2">Don Smith</h3>
              <p className="text-lg">Math & Computer Science, 1988-2022</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revampers Section */}
      <div className="bg-gray-200 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">The Revamp Team</h2>
          <p className="text-lg text-center mb-10">

          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="w-1/3 flex flex-col items-center">
              <img src="https://cdn.discordapp.com/attachments/1174486466961866793/1279247554969604207/william_yang.jpg?ex=66d3bfa0&is=66d26e20&hm=a6ce984e7a879974cd07459e7661093b8e836942975efbc711fa4bc4aec5e950&" alt="../assets/william_yang.jpg" className="w-32 h-32 rounded-full mb-4" />
              <h3 className="text-xl font-semibold">William Yang</h3>
              <p>Milliken Mills H.S.</p>
            </div>
            <div className="w-1/3 flex flex-col items-center">
              <img src="https://media.licdn.com/dms/image/v2/D4E03AQHWDwWmAWQXzQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1721608220428?e=1730332800&v=beta&t=zSJan6bXI4Mb6vJH9YmQ9yODA4GEq1O-R3SfBZG9SGg" alt="[Revamper Name 2]" className="w-32 h-32 rounded-full mb-4" />
              <h3 className="text-xl font-semibold">Daniel Zhang</h3>
              <p>Pinetree S.S.</p>
            </div>
            <div className="w-1/3 flex flex-col items-center">
              <img src="https://cdn.discordapp.com/attachments/1174486466961866793/1279248182911438858/image.png?ex=66d3c036&is=66d26eb6&hm=8ecc1e6807d1f543a1da4d26b3d346ebb5f019cddfbc4ab6902393e4b76539b5&" alt=" " className="w-32 h-32 rounded-full mb-4" />
              <h3 className="text-xl font-semibold">John Liao</h3>
              <p>Lo-Ellen Park S.S.</p>
            </div>
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
          <ul className="text-center space-y-4">
            <li><strong>AJ</strong> - Amlesh Jayakumar of Waterloo Collegiate Institute (2008 S5: 2009 S4, S5: 2012 S4,
              2014 S4)
            </li>
            <li><strong>AL</strong> - Anton Likhtarov of Burnaby North S.S. (2005 S5)</li>
            <li><strong>AS</strong> - Ahmed Sabie of Glenforest Secondary School (2000 J5/S3, 1996 P5)</li>
            <li><strong>AT</strong> - Alex Tung of Hong Kong (2014 S4)</li>
            <li><strong>AV</strong> - Aaron Voelker of Bell High School (2007 S3: 2000 S4: 1999 P5)</li>
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
            <li><strong>KL</strong> - Konstantin Lopyrev of the University of Waterloo (2008 S3, S4, S5: 2007 J5, S5)
            </li>
            <li><strong>ML</strong> - Matthew Lai of Steveston-London Secondary School (2008 S5: 2007 S4)</li>
            <li><strong>ML2</strong> - Matthew Lee of Galt Collegiate Institute (2015 S3)</li>
            <li><strong>NB</strong> - Nenad Bauk of Richview Collegiate Institute (2013 S2)</li>
            <li><strong>NV</strong> - Nazar Viznytsya (2016-2019)</li>
            <li><strong>PS</strong> - Peter Sun of St. Francis Xavier S.S. (2010 J5)</li>
            <li><strong>RC</strong> - Robin Cheng of Pinetree Secondary (2005 S5)</li>
            <li><strong>RH</strong> - Rich Hong of St. George's School, Vancouver (2006 S5)</li>
            <li><strong>RP</strong> - Richard Peng of Vaughan Road Academy (2004 S4: 2001 S4: 2000 S5)</li>
            <li><strong>SH</strong> - Sean Henderson of the University of Toronto (2005 S5)</li>
            <li><strong>SF</strong> - Sumudu Fernando of the University of Alberta (2011 J5, 2011 S5, 2010 S3)</li>
            <li><strong>VL</strong> - Victor Liu of Dr. Norman Bethune C.I. (2010 S5)</li>
            <li><strong>VW</strong> - Victor Wang of Tecumseh Elementary (2013 S2)</li>
            <li><strong>VS</strong> - Vassili Skarine of Northview Heights S.S. (2003 S4, S5: 2002 S4)</li>
            <li><strong>VSi</strong> - Vincent Siao of St George's School (S010 S3)</li>
            <li><strong>WZ</strong> - Weiwei Zhong of Glenforest Secondary School (2015 S3)</li>
            <li><strong>WC</strong> - Wonjohn Choi of St. Francis Xavier S.S. (2010 J5)</li>
            <li><strong>WHL</strong> - Wen-Hao Lue of Bayview Glen Private School (2007 J5: 2009 S4)</li>
            <li><strong>YL</strong> - Yikuan Li of Don Mills Collegiate Institute (2014 S4)</li>
            <li><strong>ZZ</strong> - Zihao Zhang of Vincent Massey Secondary School (2014 S4)</li>
            {/* Add more contributors as needed */}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;