'use client';

// FIXME: preview for the /forum/preview mockups — no HTML sanitization yet
// (rehype-sanitize). See docs/V2Roadmap.md "Content storage and rendering"
// for the full target pipeline.

import 'katex/dist/katex.min.css';
// Code blocks always render on a dark background regardless of site theme
// (same pattern as GitHub/most doc sites) — avoids needing a second
// light-mode hljs theme.
import 'highlight.js/styles/github-dark.css';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-sm text-foreground-lighter italic">Nothing to preview yet.</p>;
  }

  return (
    <div
      className="flex flex-col gap-3 text-sm text-foreground leading-relaxed break-words
        [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden
        [&_p]:m-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
        [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-surface-200 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-xs
        [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:text-xs [&_pre]:leading-relaxed
        [&_a]:text-brand [&_a:hover]:underline"
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
