import Link from 'next/link';
import { FlickeringGrid } from '../components/effects/FlickeringGrid';
import { Button } from '../components/ui/button';

export const metadata = {
  title: 'Page Not Found',
};

const NotFound = () => {
  return (
    <div className="relative min-h-[calc(100svh-var(--nav-h))] flex flex-col justify-center items-center px-4 bg-background overflow-hidden text-center">
      {/* Hero flickering grid background — same color/density as the home page and login page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <FlickeringGrid
          className="size-full"
          squareSize={4}
          gridGap={6}
          color="hsl(239, 84%, 67%)"
          maxOpacity={0.15}
          flickerChance={0.03}
        />
      </div>

      <div className="relative z-10">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-brand">
          404: <span className="text-foreground">Page not found</span>
        </h1>
        <p className="mt-4 text-base text-foreground-light max-w-md mx-auto">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="mt-8">
          <Button type="primary" size="medium" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
