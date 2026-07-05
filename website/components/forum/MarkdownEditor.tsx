'use client';

// FIXME: mockup-only editor for /forum/preview — no HTML sanitization yet,
// see MarkdownPreview.tsx.

import { useRef, useState } from 'react';
import {
  FontBoldIcon,
  FontItalicIcon,
  CodeIcon,
  Link1Icon,
  ListBulletIcon,
  HeadingIcon,
  QuoteIcon,
  TextIcon,
  ColumnsIcon,
} from '@radix-ui/react-icons';
import { MarkdownPreview } from './MarkdownPreview';

const codeLanguages = [
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'text', label: 'Plain text' },
] as const;

type ToolbarAction = {
  label: string;
  icon: React.ReactNode;
  // selectStart/selectEnd (relative to the inserted text) let an action leave
  // part of what it inserted selected — e.g. the Code action pre-selects the
  // "cpp" language tag so you can immediately type over it.
  apply: (selected: string) => { text: string; selectStart?: number; selectEnd?: number };
};

const actions: ToolbarAction[] = [
  {
    label: 'Bold',
    icon: <FontBoldIcon width="14" height="14" />,
    apply: (s) => ({ text: `**${s || 'bold text'}**` }),
  },
  {
    label: 'Italic',
    icon: <FontItalicIcon width="14" height="14" />,
    apply: (s) => ({ text: `*${s || 'italic text'}*` }),
  },
  {
    label: 'Heading',
    icon: <HeadingIcon width="14" height="14" />,
    apply: (s) => ({ text: `## ${s || 'Heading'}` }),
  },
  {
    label: 'Quote',
    icon: <QuoteIcon width="14" height="14" />,
    apply: (s) => ({ text: `> ${s || 'Quote'}` }),
  },
  {
    label: 'Inline code',
    icon: <CodeIcon width="14" height="14" />,
    apply: (s) => ({ text: `\`${s || 'code'}\`` }),
  },
  {
    label: 'Link',
    icon: <Link1Icon width="14" height="14" />,
    apply: (s) => ({ text: `[${s || 'link text'}](url)` }),
  },
  {
    label: 'Bulleted list',
    icon: <ListBulletIcon width="14" height="14" />,
    apply: (s) => ({ text: `- ${s || 'list item'}` }),
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 8,
  compact = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'write' | 'split'>('split');
  const [codeLang, setCodeLang] = useState<(typeof codeLanguages)[number]['value']>('cpp');

  const runAction = (action: ToolbarAction) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    const { text, selectStart, selectEnd } = action.apply(selected);
    const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const from =
        selectStart !== undefined ? selectionStart + selectStart : selectionStart + text.length;
      const to = selectEnd !== undefined ? selectionStart + selectEnd : from;
      el.setSelectionRange(from, to);
    });
  };

  // Dedicated code-block insertion: picks up the language from the <select>
  // (defaults to C++) and places the cursor *inside* the fenced body, ready
  // to type or paste — no need to know or even see the ``` syntax.
  const insertCodeBlock = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const body = value.slice(selectionStart, selectionEnd);
    const text = '```' + codeLang + '\n' + body + '\n```';
    const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursorPos = selectionStart + 3 + codeLang.length + 1 + body.length;
      el.setSelectionRange(cursorPos, cursorPos);
    });
  };

  return (
    <div className="rounded-md border border-border-strong bg-surface-100 focus-within:border-brand-highlight transition-colors overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 pt-2 pb-1 border-b border-border-default flex-wrap">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            aria-label={action.label}
            onClick={() => runAction(action)}
            className="p-1.5 rounded text-foreground-light hover:text-foreground hover:bg-surface-200 transition-colors"
          >
            {action.icon}
          </button>
        ))}

        <div className="flex items-center gap-1 border-l border-border-default pl-1 ml-0.5">
          <select
            value={codeLang}
            onChange={(e) => setCodeLang(e.target.value as typeof codeLang)}
            aria-label="Code block language"
            className="h-[26px] rounded border border-border-default bg-surface-100 pl-1.5 pr-5 text-xs text-foreground-light hover:text-foreground focus:outline-none"
          >
            {codeLanguages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            title="Insert code block"
            aria-label="Insert code block"
            onClick={insertCodeBlock}
            className="px-2 h-[26px] inline-flex items-center gap-1 rounded text-foreground-light hover:text-foreground hover:bg-surface-200 transition-colors"
          >
            <CodeIcon width="14" height="14" />
            <span className="text-xs hidden sm:inline">Code block</span>
          </button>
        </div>

        <span className="ml-auto hidden sm:inline text-[11px] text-foreground-lighter pr-1">
          Markdown + LaTeX
        </span>

        <div className="flex items-center gap-0.5 border-l border-border-default pl-1 ml-1">
          <button
            type="button"
            title="Write"
            aria-label="Write only"
            aria-pressed={mode === 'write'}
            onClick={() => setMode('write')}
            className={`p-1.5 rounded transition-colors ${
              mode === 'write'
                ? 'bg-surface-300 text-foreground'
                : 'text-foreground-light hover:text-foreground hover:bg-surface-200'
            }`}
          >
            <TextIcon width="14" height="14" />
          </button>
          <button
            type="button"
            title="Write + live preview"
            aria-label="Split view with live preview"
            aria-pressed={mode === 'split'}
            onClick={() => setMode('split')}
            className={`p-1.5 rounded transition-colors ${
              mode === 'split'
                ? 'bg-surface-300 text-foreground'
                : 'text-foreground-light hover:text-foreground hover:bg-surface-200'
            }`}
          >
            <ColumnsIcon width="14" height="14" />
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 divide-y divide-border-default ${
          mode === 'split' ? 'lg:grid-cols-2 lg:divide-y-0 lg:divide-x' : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 4 : rows}
          className="w-full p-3 bg-transparent text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none resize-y"
        />
        {mode === 'split' && (
          <div className={`p-3 overflow-y-auto ${compact ? 'max-h-32' : 'max-h-80'}`}>
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>
    </div>
  );
}
