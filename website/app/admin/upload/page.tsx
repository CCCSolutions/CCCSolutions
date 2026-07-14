'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardTitle, CardDescription } from '../../../components/ui/card';
import { SectionContainer } from '../../../components/ui/section-container';
import { Button } from '../../../components/ui/button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.cccsolutions.ca';
const TOKEN_KEY = 'ccc_admin_token';

// Mirrors the backend schemas (problemParamsSchema / fileSchema).
const YEAR_RE = /^\d{4}$/;
const CODE_RE = /^[sjp][1-5]$/;
const FILE_RE = /^(tests\/(sample\/)?\d+\.(in|out)|solutions\/\d+\.(cpp|py|java|t|txt))$/;
const SOLUTION_EXTS = ['cpp', 'py', 'java', 't', 'txt'] as const;

const inputClass =
  'w-full rounded-md border border-border-strong bg-surface-100 px-3 py-2 text-sm text-foreground placeholder:text-foreground-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight';
const labelClass = 'block text-sm font-medium text-foreground-light mb-1.5';

export default function AdminUploadPage() {
  const [year, setYear] = useState('');
  const [code, setCode] = useState('');
  const [filePath, setFilePath] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  // Solution-path quick builder.
  const [solN, setSolN] = useState('1');
  const [solExt, setSolExt] = useState<(typeof SOLUTION_EXTS)[number]>('py');

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      setRemember(true);
    }
  }, []);

  const valid = useMemo(
    () => YEAR_RE.test(year) && CODE_RE.test(code) && FILE_RE.test(filePath),
    [year, code, filePath]
  );

  function applySolutionPath() {
    if (/^\d+$/.test(solN)) setFilePath(`solutions/${solN}.${solExt}`);
  }

  function persistToken() {
    if (remember) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function send(method: 'POST' | 'DELETE') {
    if (!valid) {
      toast.warning('Fix the year, code, or file path first.');
      return;
    }
    if (!token) {
      toast.warning('Admin token is required.');
      return;
    }

    const path = method === 'POST' ? 'upload' : 'file';
    const url = `${API_BASE}/admin/contests/${year}/${code}/${path}?file=${encodeURIComponent(filePath)}`;
    const body = method === 'POST' ? (file ?? content) : undefined;
    const target = `contests/${year}/${code}/${filePath}`;

    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const text = await res.text();
      if (res.ok) {
        persistToken();
        if (method === 'POST') toast.success('Uploaded.', { description: target });
        else toast.success('Deleted.', { description: target });
      } else if (res.status === 401) {
        toast.error('Unauthorized (401).', { description: 'Check the admin token.' });
      } else {
        toast.error(`Failed (${res.status}).`, { description: text });
      }
    } catch (err) {
      toast.error('Request failed.', { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm(`Delete contests/${year}/${code}/${filePath}? This cannot be undone.`)) return;
    await send('DELETE');
  }

  return (
    <SectionContainer size="small" className="py-16">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-2">
        Admin upload
      </h1>
      <p className="text-foreground-light mb-8">
        Stage solutions and test cases into R2. Requires the admin bearer token.
      </p>

      <Card>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="year">
                Year
              </label>
              <input
                id="year"
                className={inputClass}
                placeholder="2026"
                value={year}
                onChange={(e) => setYear(e.target.value.trim())}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="code">
                Code
              </label>
              <input
                id="code"
                className={inputClass}
                placeholder="j5"
                value={code}
                onChange={(e) => setCode(e.target.value.trim().toLowerCase())}
              />
              {code && !CODE_RE.test(code) && (
                <p className="mt-1 text-xs text-destructive">Must match [sjp][1-5], e.g. j5.</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="filePath">
              File path
            </label>
            <input
              id="filePath"
              className={inputClass}
              placeholder="solutions/1.py"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value.trim())}
            />
            {filePath && !FILE_RE.test(filePath) && (
              <p className="mt-1 text-xs text-destructive">
                Must be tests/&lt;n&gt;.in|out, tests/sample/&lt;n&gt;.in|out, or
                solutions/&lt;n&gt;.&#123;cpp|py|java|t|txt&#125;.
              </p>
            )}
          </div>

          <div className="rounded-md border border-border-muted bg-surface-200 p-3">
            <p className="text-xs text-foreground-lighter mb-2">Solution path builder</p>
            <div className="flex items-end gap-2">
              <div className="w-24">
                <label className={labelClass} htmlFor="solN">
                  Number
                </label>
                <input
                  id="solN"
                  className={inputClass}
                  value={solN}
                  onChange={(e) => setSolN(e.target.value.trim())}
                />
              </div>
              <div className="w-32">
                <label className={labelClass} htmlFor="solExt">
                  Extension
                </label>
                <select
                  id="solExt"
                  className={inputClass}
                  value={solExt}
                  onChange={(e) => setSolExt(e.target.value as (typeof SOLUTION_EXTS)[number])}
                >
                  {SOLUTION_EXTS.map((ext) => (
                    <option key={ext} value={ext}>
                      {ext}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="default" size="medium" onClick={applySolutionPath}>
                Use solutions/{solN || 'n'}.{solExt}
              </Button>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="content">
              File content
            </label>
            <textarea
              id="content"
              className={`${inputClass} min-h-40 font-mono`}
              placeholder="Paste the solution or test-case content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!!file}
            />
            <div className="mt-2 flex items-center gap-3">
              <input
                id="fileInput"
                type="file"
                className="text-sm text-foreground-light"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <button
                  className="text-xs text-brand hover:underline"
                  onClick={() => {
                    setFile(null);
                    const el = document.getElementById('fileInput') as HTMLInputElement | null;
                    if (el) el.value = '';
                  }}
                >
                  Clear file
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-foreground-lighter">
              A chosen file takes priority over the textarea.
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="token">
              Admin token
            </label>
            <input
              id="token"
              type="password"
              className={inputClass}
              placeholder="Bearer token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-foreground-lighter">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember on this device
            </label>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="primary"
              size="medium"
              disabled={busy || !valid || !token}
              onClick={() => send('POST')}
            >
              {busy ? 'Working...' : 'Upload'}
            </Button>
            <Button
              type="danger"
              size="medium"
              disabled={busy || !valid || !token}
              onClick={onDelete}
            >
              Delete file
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-dashed">
        <CardContent>
          <CardTitle className="text-base">Not sure about paths?</CardTitle>
          <CardDescription className="mt-1 text-sm">
            Valid keys live under contests/&lt;year&gt;/&lt;code&gt;/. Solutions are
            solutions/&lt;n&gt;.&#123;cpp|py|java|t|txt&#125;; test cases are tests/&lt;n&gt;.in|out
            (samples under tests/sample/).
          </CardDescription>
        </CardContent>
      </Card>
    </SectionContainer>
  );
}
