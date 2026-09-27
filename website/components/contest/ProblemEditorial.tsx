import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { MarkdownPreview } from '../forum/MarkdownPreview';
import { cn } from '../../lib/utils';
import { cemcCommentaryUrl } from '../../lib/cemc';
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
  markdown,
  loading = false,
  className,
}: {
  contestYear: string;
  problemCode: string;
  markdown: string | null;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="size-5 animate-spin rounded-full border-2 border-surface-300 border-t-brand" />
      </div>
    );
  }

  if (markdown) {
    const sourceUrl = cemcCommentaryUrl(contestYear, problemCode);
    return (
      <div
        className={cn(
          '[&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1:first-child]:mt-0 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-foreground [&_blockquote]:rounded-r-md [&_blockquote]:border-l-2 [&_blockquote]:border-brand-400 [&_blockquote]:bg-surface-200 [&_blockquote]:px-3 [&_blockquote]:py-2',
          className
        )}
      >
        <MarkdownPreview content={markdown} gfm />
        {sourceUrl && (
          <p className="mt-6 text-xs text-foreground-lighter">
            Source:{' '}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              CEMC commentary
            </a>
          </p>
        )}
      </div>
    );
  }

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
