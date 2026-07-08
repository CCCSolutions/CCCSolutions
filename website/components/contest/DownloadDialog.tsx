'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import { Cross2Icon, DownloadIcon } from '@radix-ui/react-icons';
import { Button } from '../ui/button';

interface TestMeta {
  n: number;
  sample: boolean;
  inputBytes: number;
  outputBytes: number;
}

interface SolutionMeta {
  n: number;
  ext: string;
  bytes: number;
}

// One downloadable file: its R2-relative path, a readable label, byte size, and
// the friendly name it gets inside the zip (mirrors the backend downloadName).
interface DownloadItem {
  file: string;
  label: string;
  bytes: number;
  entryName: string;
}

// JSZip buffers every file in memory, so cap the total selected size to keep the
// browser tab from OOM-ing. Egress is free; this is a memory guard, not a cost one.
// Individual (direct) downloads are unbounded — they never touch this path.
const ZIP_MAX_BYTES = 300 * 1024 * 1024;

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${(bytes / 1024).toFixed(1)}KB`;

function buildItems(tests: TestMeta[], solutions: SolutionMeta[]): DownloadItem[] {
  const items: DownloadItem[] = [];
  for (const t of tests) {
    const dir = t.sample ? 'tests/sample' : 'tests';
    const name = t.sample ? `Sample ${t.n}` : `Case ${t.n}`;
    const prefix = t.sample ? `sample${t.n}` : `${t.n}`;
    items.push({
      file: `${dir}/${t.n}.in`,
      label: `${name} · input`,
      bytes: t.inputBytes,
      entryName: `${prefix}.in`,
    });
    items.push({
      file: `${dir}/${t.n}.out`,
      label: `${name} · output`,
      bytes: t.outputBytes,
      entryName: `${prefix}.out`,
    });
  }
  return items.concat(
    solutions.map((s) => ({
      file: `solutions/${s.n}.${s.ext}`,
      label: `Solution ${s.n} (.${s.ext})`,
      bytes: s.bytes,
      entryName: '', // filled with year/code at render time
    }))
  );
}

interface DownloadDialogProps {
  open: boolean;
  onClose: () => void;
  apiBase: string;
  year: string;
  code: string;
  tests: TestMeta[];
  solutions: SolutionMeta[];
}

export function DownloadDialog({
  open,
  onClose,
  apiBase,
  year,
  code,
  tests,
  solutions,
}: DownloadDialogProps) {
  const items = useMemo(() => {
    const built = buildItems(tests, solutions);
    // Solutions carry the year/code in their zip entry name (matches backend).
    for (const item of built) {
      if (item.entryName === '') {
        const m = item.file.match(/^solutions\/(\d+)\.(\w+)$/);
        if (m) item.entryName = `${year}_${code}_solution${m[1]}.${m[2]}`;
      }
    }
    return built;
  }, [tests, solutions, year, code]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nothing pre-selected; reset whenever the dialog re-opens or the file set changes.
  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setError(null);
    }
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const downloadUrl = (file: string) => `${apiBase}/contests/${year}/${code}/download?file=${file}`;

  const toggle = (file: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.file)));

  const selectedItems = items.filter((i) => selected.has(i.file));
  const selectedBytes = selectedItems.reduce((sum, i) => sum + i.bytes, 0);
  const overLimit = selectedBytes > ZIP_MAX_BYTES;

  const downloadZip = async () => {
    if (selectedItems.length === 0 || overLimit || zipping) return;
    setZipping(true);
    setError(null);
    try {
      // One batch call → N presigned URLs, avoiding N rate-limited /download hits.
      const res = await fetch(`${apiBase}/contests/${year}/${code}/download`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ files: selectedItems.map((i) => i.file) }),
      });
      if (!res.ok) throw new Error(`batch ${res.status}`);
      const { urls } = (await res.json()) as { urls: { file: string; url: string }[] };

      const entryFor = (file: string) =>
        items.find((i) => i.file === file)?.entryName ?? file.split('/').pop() ?? file;

      const zip = new JSZip();
      await Promise.all(
        urls.map(async ({ file, url }) => {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`fetch ${file} ${r.status}`);
          zip.file(entryFor(file), await r.blob());
        })
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${year}_${code}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      onClose();
    } catch (err) {
      console.error('Error building zip:', err);
      setError('Could not build the zip. Try individual downloads, or fewer files.');
    } finally {
      setZipping(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col bg-surface-100 border border-border-default rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Download files"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
          <h3 className="text-sm font-semibold text-foreground">Download files</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-foreground-lighter hover:text-foreground transition-colors"
          >
            <Cross2Icon width="16" height="16" />
          </button>
        </div>

        <div className="flex items-center justify-between px-5 py-2 border-b border-border-muted">
          <label className="flex items-center gap-2 text-sm text-foreground-light cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-brand-500"
            />
            Select all
          </label>
          <span className="text-xs text-foreground-lighter">
            {selected.size} selected · {formatSize(selectedBytes)}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-foreground-lighter">
              Nothing available to download.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.file}
                className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-surface-200"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.file)}
                  onChange={() => toggle(item.file)}
                  className="accent-brand-500"
                  aria-label={item.label}
                />
                <span className="flex-1 text-sm text-foreground-light truncate">{item.label}</span>
                <span className="text-xs text-foreground-lighter shrink-0">
                  {formatSize(item.bytes)}
                </span>
                <a
                  href={downloadUrl(item.file)}
                  className="text-foreground-lighter hover:text-brand transition-colors shrink-0"
                  aria-label={`Download ${item.label}`}
                >
                  <DownloadIcon width="15" height="15" />
                </a>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-border-default">
          {overLimit && (
            <p className="mb-2 text-xs text-warning-600">
              ⚠️ Selection is {formatSize(selectedBytes)} — over the {formatSize(ZIP_MAX_BYTES)} zip
              limit. Deselect some files, or download them individually.
            </p>
          )}
          {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
          <Button
            type="primary"
            size="small"
            block
            onClick={downloadZip}
            disabled={selectedItems.length === 0 || overLimit || zipping}
            iconLeft={<DownloadIcon width="15" height="15" />}
          >
            {zipping ? 'Building zip…' : 'Download selected (.zip)'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
