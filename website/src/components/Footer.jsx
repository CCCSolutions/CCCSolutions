import { Typography } from "@material-tailwind/react";
import logoImage from "../assets/mmhs_logo.png";

const FooterWithLogo = () => {
  return (
    <footer className="w-full px-16 py-6 bg-white">
      <div className="flex flex-row flex-wrap items-center justify-center gap-x-12 text-center md:justify-between">
        <img src={logoImage} alt="logo-ct" className="h-[75px]" />
        <ul className="flex flex-wrap items-center gap-y-2 gap-x-8">
          <li>
            <Typography
              as="a"
              href="/About"
              color="blue-gray"
              className="font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              About Us
            </Typography>
          </li>
          <li>
            <Typography
              as="a"
              href="https://github.com/Tankman61/CCCSolutions/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              color="blue-gray"
              className="font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              License
            </Typography>
          </li>
          <li>
            <Typography
              as="a"
              href="https://github.com/Tankman61/CCCSolutions"
              color="blue-gray"
              className="font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              Contribute
            </Typography>
          </li>
          <li>
            <Typography
              as="a"
              href="mailto:willi64645@gmail.com"
              color="blue-gray"
              className="font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              Contact Us
            </Typography>
          </li>
        </ul>
      </div>
      <hr className="my-8 border-gray-400" />
      <Typography color="blue-gray" className="text-center font-normal">
        &copy; 2025 Milken Mills High School
      </Typography>
    </footer>
  );
}

export default FooterWithLogo;
