import { FlickeringGrid } from '../../../components/effects/FlickeringGrid';
import { Button } from '../../../components/ui/button';
import { SectionContainer } from '../../../components/ui/section-container';

export const metadata = {
  title: 'Forum — Coming soon | CCCSolutions',
  description: 'A better forum for CCC solvers. In the works.',
};

export default function ForumPreview() {
  return (
    <div className="bg-background text-foreground">
      <div className="relative bg-background overflow-hidden min-h-[85vh] flex flex-col justify-center">
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

        <SectionContainer size="medium" className="relative z-10 text-center py-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight font-semibold">
            <span className="block text-foreground">A better forum for</span>
            <span className="block text-brand">CCC solvers.</span>
          </h1>
          <p className="mt-6 text-base lg:text-lg text-foreground-light max-w-md mx-auto">
            In the works!
          </p>
          <div className="mt-10 flex justify-center">
            <Button type="primary" size="large" disabled>
              Coming soon
            </Button>
          </div>
        </SectionContainer>
      </div>
    </div>
  );
}
