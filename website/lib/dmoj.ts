// Before 2000 there were no Junior problems. This site names those problems p1 to p5,
// and DMOJ names them s1 to s5.
export function dmojProblemCode(contestYear: string, problemCode: string): string {
  const code = Number(contestYear) < 2000 ? problemCode.replace(/^p/, 's') : problemCode;
  return `ccc${contestYear.slice(-2)}${code}`;
}

export function dmojProblemUrl(contestYear: string, problemCode: string): string {
  return `https://dmoj.ca/problem/${dmojProblemCode(contestYear, problemCode)}`;
}

export function dmojEditorialUrl(contestYear: string, problemCode: string): string {
  return `${dmojProblemUrl(contestYear, problemCode)}/editorial`;
}
