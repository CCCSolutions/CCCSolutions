'use client';

// FIXME: preview for the /forum/preview mockups — no HTML sanitization yet
// (rehype-sanitize). See docs/V2Roadmap.md "Content storage and rendering"
// for the full target pipeline.

import 'katex/dist/katex.min.css';
// Code blocks always render on a dark background regardless of site theme
// (same pattern as GitHub/most doc sites) — avoids needing a second
// light-mode hljs theme.
import 'highlight.js/styles/github-dark.css';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

// gfm turns on GitHub Markdown extras such as tables. The editorials need it; forum posts don't use it yet.
// resolveImage maps an image path in the Markdown (e.g. editorial/fig-1.png) to a URL.
export function MarkdownPreview({
  content,
  gfm = false,
  resolveImage,
}: {
  content: string;
  gfm?: boolean;
  resolveImage?: (src: string) => string;
}) {
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
        [&_a]:text-brand [&_a:hover]:underline
        [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs
        [&_th]:border [&_th]:border-border-default [&_th]:bg-surface-200 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left
        [&_td]:border [&_td]:border-border-default [&_td]:px-2 [&_td]:py-1
        [&_img]:mx-auto [&_img]:max-w-full [&_img]:rounded-md [&_img]:bg-white [&_img]:p-2"
    >
      <ReactMarkdown
        remarkPlugins={gfm ? [remarkGfm, remarkMath] : [remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        urlTransform={(url, key) =>
          defaultUrlTransform(resolveImage && key === 'src' ? resolveImage(url) : url)
        }
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
