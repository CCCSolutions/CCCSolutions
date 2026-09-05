export const CONTEST_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.cccsolutions.ca';

export interface ContestTestMeta {
  n: number;
  sample: boolean;
  inputBytes: number;
  outputBytes: number;
}

export interface ContestSolutionMeta {
  n: number;
  ext: string;
  bytes: number;
}

export interface ContestListResponse {
  tests: ContestTestMeta[];
  solutions: ContestSolutionMeta[];
}

export function fetchContestList(year: string, code: string, signal?: AbortSignal) {
  return fetch(`${CONTEST_API_BASE}/contests/${year}/${code}/list`, { signal });
}

export function fetchContestPreview(
  year: string,
  code: string,
  file: string,
  signal?: AbortSignal
) {
  return fetch(`${CONTEST_API_BASE}/contests/${year}/${code}/preview?file=${file}`, { signal });
}

export function contestDownloadUrl(year: string, code: string, file: string) {
  return `${CONTEST_API_BASE}/contests/${year}/${code}/download?file=${file}`;
}
