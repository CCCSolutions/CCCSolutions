'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import { Cross2Icon, DownloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
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

// JSZip buffers every file in memory, so a big selection can lag or crash the
// tab. This isn't a hard limit (egress is free, and the zip still builds) — past
// it we just warn. Individual (direct) downloads never touch this path.
const ZIP_WARN_BYTES = 300 * 1024 * 1024;

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

  // Nothing pre-selected; reset whenever the dialog re-opens or the file set changes.
  useEffect(() => {
    if (open) {
      setSelected(new Set());
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

  // Click-and-drag selection: mousedown on a row picks a mode (select vs deselect
  // based on that row's current state) and applies it; dragging over more rows
  // paints them the same. A plain click toggles a single row. Desktop only —
  // touchscreens fall back to per-row taps. dragMode lives in a ref so the
  // window listeners and the rAF loop read it without re-rendering.
  const dragMode = useRef<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const applyDrag = (file: string, select: boolean) =>
    setSelected((prev) => {
      if (prev.has(file) === select) return prev;
      const next = new Set(prev);
      if (select) next.add(file);
      else next.delete(file);
      return next;
    });

  const onRowMouseDown = (e: React.MouseEvent, file: string) => {
    // Left button only, and never hijack the per-row download link.
    if (e.button !== 0 || (e.target as HTMLElement).closest('a')) return;
    e.preventDefault(); // don't start a text selection while dragging
    pointer.current = { x: e.clientX, y: e.clientY };
    const select = !selected.has(file);
    dragMode.current = select;
    applyDrag(file, select);
  };

  const onRowMouseEnter = (file: string) => {
    if (dragMode.current !== null) applyDrag(file, dragMode.current);
  };

  // Auto-scroll the list when a drag reaches its top/bottom edge, so off-screen
  // rows scroll into view (and get painted) instead of being stuck out of reach.
  useEffect(() => {
    const EDGE = 40; // px from an edge that triggers scrolling
    const MAX_STEP = 16; // px per frame at the very edge (ramps with proximity)

    const stopScroll = () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    const step = () => {
      const el = listRef.current;
      if (!el || dragMode.current === null) {
        rafId.current = null;
        return;
      }
      const rect = el.getBoundingClientRect();
      const { x, y } = pointer.current;
      let delta = 0;
      if (y < rect.top + EDGE) {
        const p = Math.min(1, (rect.top + EDGE - y) / EDGE);
        delta = -Math.ceil(p * MAX_STEP);
      } else if (y > rect.bottom - EDGE) {
        const p = Math.min(1, (y - (rect.bottom - EDGE)) / EDGE);
        delta = Math.ceil(p * MAX_STEP);
      }
      if (delta === 0) {
        rafId.current = null; // cursor left the edge zone — idle until it returns
        return;
      }
      el.scrollTop += delta;
      // Scrolling under a still cursor doesn't reliably fire mouseenter, so paint
      // whichever row now sits under the pointer.
      const row = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-file]');
      if (row?.dataset.file) applyDrag(row.dataset.file, dragMode.current);
      rafId.current = requestAnimationFrame(step);
    };

    const onMove = (e: MouseEvent) => {
      if (dragMode.current === null) return;
      pointer.current = { x: e.clientX, y: e.clientY };
      if (rafId.current === null) rafId.current = requestAnimationFrame(step);
    };
    const end = () => {
      dragMode.current = null;
      stopScroll();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', end);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', end);
      stopScroll();
    };
  }, []);

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.file)));

  const selectedItems = items.filter((i) => selected.has(i.file));
  const selectedBytes = selectedItems.reduce((sum, i) => sum + i.bytes, 0);
  // Only a 2+ selection builds a zip, so the browser-memory caution is scoped to that.
  const largeSelection = selectedItems.length >= 2 && selectedBytes > ZIP_WARN_BYTES;

  // Trigger a direct browser download of one file via the GET /download endpoint,
  // which 302s to R2 with Content-Disposition. Same mechanism as the per-row link
  // (no fetch/JSZip/CORS needed) — a single selection shouldn't become a 1-file zip.
  const downloadSingle = (file: string) => {
    const a = document.createElement('a');
    a.href = downloadUrl(file);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Downloading ${items.find((i) => i.file === file)?.entryName ?? file}`);
    onClose();
  };

  const downloadSelected = async () => {
    if (selectedItems.length === 0 || zipping) return;
    if (selectedItems.length === 1) {
      downloadSingle(selectedItems[0].file);
      return;
    }
    setZipping(true);
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
      toast.success(`Downloading ${year}_${code}.zip`, {
        description: `${selectedItems.length} files`,
      });
      onClose();
    } catch (err) {
      console.error('Error building zip:', err);
      toast.error('Could not build the zip.', {
        description: 'Try individual downloads, or fewer files.',
      });
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

        <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-2 select-none">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-foreground-lighter">
              Nothing available to download.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.file}
                data-file={item.file}
                onMouseDown={(e) => onRowMouseDown(e, item.file)}
                onMouseEnter={() => onRowMouseEnter(item.file)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer hover:bg-surface-200"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.file)}
                  readOnly
                  tabIndex={-1}
                  className="accent-brand-500 pointer-events-none"
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
          {largeSelection && (
            <p className="mb-2 flex items-start gap-1.5 text-xs text-warning-600">
              <ExclamationTriangleIcon width="14" height="14" className="mt-0.5 shrink-0" />
              <span>
                Large selection ({formatSize(selectedBytes)}) — the zip is built in your browser and
                may lag or freeze the tab.
              </span>
            </p>
          )}
          <Button
            type="primary"
            size="small"
            block
            onClick={downloadSelected}
            disabled={selectedItems.length === 0 || zipping}
            iconLeft={<DownloadIcon width="15" height="15" />}
          >
            {zipping
              ? 'Building zip…'
              : selectedItems.length === 1
                ? 'Download file'
                : 'Download selected (.zip)'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
