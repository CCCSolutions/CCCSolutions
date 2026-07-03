'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { SectionContainer } from '../../../../components/ui/section-container';
import { MarkdownEditor } from '../../../../components/forum/MarkdownEditor';

// FIXME: visual mockup, not real feature code — no backend wired up, form
// doesn't submit anywhere. Inspo for the real "new thread" build.
type ThreadType = 'question' | 'discussion';

const placeholderByType: Record<ThreadType, string> = {
  question:
    'Be specific. Include what you tried, what you expected, and what actually happened.\n\nMarkdown + code blocks (```) + math ($...$) supported.',
  discussion: 'What do you want to talk about? Open-ended is fine.',
};

const guideByType: Record<
  ThreadType,
  { intro: string; sections: { title: string; bullets: string[] }[] }
> = {
  question: {
    intro: 'The community is here to help you with specific CCC, algorithm, or contest problems.',
    sections: [
      {
        title: 'Summarize the problem',
        bullets: [
          'Lead with the problem code and what you are stuck on',
          'Describe the expected vs actual output',
          'Include any error messages or wrong-answer cases',
        ],
      },
      {
        title: "Describe what you've tried",
        bullets: [
          'Approach you took and where it broke',
          'Specific test case numbers (e.g. WA on test case 7)',
          'What you have already ruled out',
        ],
      },
      {
        title: 'Show some code',
        bullets: [
          'Trim to the relevant function — do not paste main()',
          'Use triple backticks with a language hint: ```cpp',
          'Include input the code was tested on',
        ],
      },
    ],
  },
  discussion: {
    intro:
      'Discussions are open-ended. Frame the topic so others can jump in with their own takes.',
    sections: [
      {
        title: 'Frame the topic',
        bullets: [
          'One sentence on what you want to talk about',
          'Avoid vague titles like "DP question"',
        ],
      },
      {
        title: 'Give context',
        bullets: [
          'Link the problem, thread, or pattern that prompted this',
          'Quote the editorial or comment you are reacting to',
        ],
      },
      {
        title: 'Invite specific responses',
        bullets: [
          'Open prompts get open answers',
          'Ask for examples, comparisons, or opinions on a specific axis',
        ],
      },
    ],
  },
};

export default function NewThreadPreview() {
  const [type, setType] = useState<ThreadType>('question');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState(
    "I think the editorial's complexity is off. A segment tree walk here is $O(N \\log N)$ overall, not $O(\\log^2 N)$ per query — right?\n\n$$\\sum_{i=1}^{N} \\log i = O(N \\log N)$$\n\nHere's what I tried:\n\n```cpp\nfor (int i = 0; i < n; i++) {\n    ans += query(seg, i, i + k);\n}\n```"
  );
  const [tags, setTags] = useState('');

  const canSubmit = title.trim().length >= 15 && body.trim().length >= 30;

  return (
    <div className="bg-background text-foreground">
      <SectionContainer size="large" className="py-8">
        <Link
          href="/forum/preview/logged-in"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground mb-5"
        >
          <ArrowLeftIcon width="14" height="14" />
          Back to forum
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Start a new thread
            </h1>

            {/* Type segmented control */}
            <div className="inline-flex p-0.5 rounded-md border border-border-default bg-surface-100 self-start">
              {(['question', 'discussion'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                    type === t
                      ? 'bg-brand-500 text-white'
                      : 'text-foreground-light hover:text-foreground'
                  }`}
                >
                  {t === 'question' ? 'Ask a question' : 'Start a discussion'}
                </button>
              ))}
            </div>

            <form className="flex flex-col gap-5">
              <Field
                label="Title"
                hint={
                  type === 'question'
                    ? 'Be specific. Imagine you are asking another person. Min 15 characters.'
                    : 'Frame the topic clearly. Min 15 characters.'
                }
              >
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === 'question'
                      ? 'e.g. 2024 S4: why is the editorial complexity O(N log N) and not log²?'
                      : 'e.g. Monotonic stack pattern: when do you reach for it?'
                  }
                  className="w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
                />
              </Field>

              <Field
                label="Body"
                hint="Include all the information someone would need. Min 30 characters."
              >
                <MarkdownEditor
                  value={body}
                  onChange={setBody}
                  placeholder={placeholderByType[type]}
                  rows={12}
                />
              </Field>

              <Field
                label="Tags"
                hint="Up to 5, comma-separated. Use existing tags where they exist. Start typing to see suggestions."
              >
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. dp, segment-tree, 2024"
                  className="w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Link
                  href="/forum/preview/logged-in"
                  className="px-3 py-2 text-sm text-foreground-light hover:text-foreground"
                >
                  Cancel
                </Link>
                <Button type="primary" size="small" disabled={!canSubmit}>
                  Post {type === 'question' ? 'question' : 'discussion'}
                </Button>
              </div>
            </form>
          </div>

          {/* Guide rail — SO-style accordion, aligned with H1 */}
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--nav-h)+1.5rem)]">
              <Guide type={type} />
            </div>
          </aside>
        </div>
      </SectionContainer>
    </div>
  );
}

function Guide({ type }: { type: ThreadType }) {
  const guide = guideByType[type];
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-2.5">
        Draft your {type === 'question' ? 'question' : 'discussion'}
      </h3>
      <p className="text-sm text-foreground-light leading-relaxed mb-5">{guide.intro}</p>

      <ol className="flex flex-col">
        {guide.sections.map((section, i) => {
          const isOpen = openIndex === i;
          return (
            <li key={i} className="border-t border-border-default first:border-t-0">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="w-full flex items-center gap-3 py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-brand shrink-0 w-5">{i + 1}.</span>
                <span className="text-sm font-semibold text-foreground flex-1">
                  {section.title}
                </span>
                {isOpen ? (
                  <ChevronDownIcon
                    width="16"
                    height="16"
                    className="text-foreground-lighter shrink-0"
                  />
                ) : (
                  <ChevronRightIcon
                    width="16"
                    height="16"
                    className="text-foreground-lighter shrink-0"
                  />
                )}
              </button>
              {isOpen && (
                <ul className="pl-8 pb-4 space-y-1.5 list-disc list-outside marker:text-foreground-lighter">
                  {section.bullets.map((b, bi) => (
                    <li key={bi} className="text-sm text-foreground-light leading-relaxed ml-4">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 pt-5 border-t border-border-default">
        <p className="text-sm font-semibold text-foreground mb-3">Helpful links</p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="#" className="text-brand hover:underline">
              How to ask a good question
            </Link>
          </li>
          <li>
            <Link href="#" className="text-brand hover:underline">
              Markdown + KaTeX cheatsheet
            </Link>
          </li>
          <li>
            <Link href="#" className="text-brand hover:underline">
              Forum guidelines
            </Link>
          </li>
        </ul>
      </div>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
      {hint && <p className="text-[11px] text-foreground-light mb-2">{hint}</p>}
      {children}
    </div>
  );
}
