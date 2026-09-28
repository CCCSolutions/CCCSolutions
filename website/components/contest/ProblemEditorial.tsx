import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { dmojEditorialUrl, dmojProblemUrl } from '../../lib/dmoj';

function DmojLogo({ size }: { size: number }) {
  return (
    <Image src="/images/dmoj-logo.png" alt="" width={size} height={size} className="shrink-0" />
  );
}

// "Ask a question" and "View on DMOJ". They show whether or not an editorial exists.
export function ProblemActions({
  contestYear,
  problemCode,
  size = 'small',
  className,
}: {
  contestYear: string;
  problemCode: string;
  size?: 'tiny' | 'small';
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', className)}>
      <Button asChild type="primary" size={size}>
        <Link href="/create-post">Ask a question</Link>
      </Button>
      <Button asChild type="default" size={size}>
        <a
          href={dmojProblemUrl(contestYear, problemCode)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <DmojLogo size={size === 'tiny' ? 14 : 16} />
          <span>View on DMOJ</span>
        </a>
      </Button>
    </div>
  );
}

export function EditorialContent({
  contestYear,
  problemCode,
}: {
  contestYear: string;
  problemCode: string;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        This editorial isn&apos;t available yet
      </h2>
      <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
        <Button asChild type="outline" size="medium" block className="justify-center">
          <a
            href={dmojEditorialUrl(contestYear, problemCode)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DmojLogo size={18} />
            <span>Read the editorial on DMOJ</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
