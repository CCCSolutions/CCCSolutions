import Image from "next/image";
import Link from "next/link";
const Footer = () => {
  return (
    <footer className="w-full bg-[#f2f2f2] text-[#1f1f28] border-t border-gray-200 py-14 px-8 md:px-16">
      <div className="max-w-6xl mx-auto flex flex-wrap items-start justify-between gap-x-16 gap-y-6">
        <div className="flex flex-wrap gap-x-16 gap-y-6">
          <div>
            <h4 className="font-bold mb-3 text-sm opacity-60">Navigate</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/solutions" className="hover:underline">Solutions</Link></li>
              <li><Link href="/forum" className="hover:underline">Forum</Link></li>
              <li><Link href="/resources" className="hover:underline">Resources</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm opacity-60">Project</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:underline">About</Link></li>
              <li><a href="https://github.com/Tankman61/CCCSolutions/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:underline">License</a></li>
              <li><a href="https://github.com/Tankman61/CCCSolutions" target="_blank" rel="noopener noreferrer" className="hover:underline">Contribute</a></li>
              <li><a href="mailto:willi64645@gmail.com" className="hover:underline">Contact</a></li>
            </ul>
          </div>
        </div>
        <Image src="/images/mmhs_logo_transparent.png" alt="MMHS Logo" width={80} height={80} />
      </div>

      <hr className="my-8 border-gray-300" />
      <p className="text-center text-sm opacity-60">
        Made with love by the CCCSolutions team
      </p>
    </footer>
  );
};

export default Footer;
