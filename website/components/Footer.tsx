'use client';

import Image from "next/image";

const FooterWithLogo = () => {
  return (
    <footer className="w-full px-16 py-6 bg-white">
      <div className="flex flex-row flex-wrap items-center justify-center gap-x-12 text-center md:justify-between">
        <Image src="/images/mmhs_logo.png" alt="Milliken Mills High School Logo" width={75} height={75} className="h-[75px] w-auto" />
        <ul className="flex flex-wrap items-center gap-y-2 gap-x-8">
          <li>
            <a
              href="/About"
              className="text-blue-gray-500 font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              About Us
            </a>
          </li>
          <li>
            <a
              href="https://github.com/Tankman61/CCCSolutions/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-gray-500 font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              License
            </a>
          </li>
          <li>
            <a
              href="https://github.com/Tankman61/CCCSolutions"
              className="text-blue-gray-500 font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              Contribute
            </a>
          </li>
          <li>
            <a
              href="mailto:willi64645@gmail.com"
              className="text-blue-gray-500 font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              Contact Us
            </a>
          </li>
        </ul>
      </div>
      <hr className="my-8 border-gray-400" />
      <p className="text-center font-normal text-gray-600">
        &copy; 2025 Milken Mills High School
      </p>
    </footer>
  );
}

export default FooterWithLogo;
