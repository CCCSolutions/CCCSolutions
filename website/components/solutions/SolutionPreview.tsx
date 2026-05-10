'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import dynamic from 'next/dynamic';

const SyntaxHighlighter = dynamic(() => import('react-syntax-highlighter').then(mod => mod.Prism), {
  ssr: false,
  loading: () => <div className="p-4 text-foreground-lighter">Loading code…</div>
});

// Real solutions for CCC 2025 S4 (Floor is Lava) — Insane / graph theory.
// Pulled verbatim from public/past_contests/2025/s4/
type Solution = {
  language: 'Python' | 'C++';
  prismLang: 'python' | 'cpp';
  author: string;
  school: string;
  code: string;
};

const solutions: Solution[] = [
  {
    language: 'Python',
    prismLang: 'python',
    author: 'Advay Chandorkar',
    school: 'Glenforest SS',
    code: `# Advay Chandorkar, Glenforest SS (advayc)
# py3 solution for 25' s4

import heapq

# read number of levels (N) and number of tunnels (M)
N, M = map(int, input().split())

# initialize a list of sets to store unique boot levels for each level
levels = [set() for _ in range(N)]
tunnels = []

# read tunnel information and populate levels and tunnels
for _ in range(M):
    a, b, c = map(int, input().split())
    a -= 1
    b -= 1
    tunnels.append((a, b, c))
    levels[a].add(c)
    levels[b].add(c)

# ensure level 0 has boot level 0
levels[0].add(0)

# sort boot levels for each level
for i in range(N):
    levels[i] = sorted(levels[i])

# calculate offset for node indexing in the graph
offset = [0] * (N + 1)
total_nodes = 0
for i in range(N):
    offset[i] = total_nodes
    total_nodes += len(levels[i])
offset[N] = total_nodes

# map each boot level to its index for quick access
maps = []
for i in range(N):
    d = {};
    for j, val in enumerate(levels[i]):
        d[val] = j;
    maps.append(d);

graph = [[] for _ in range(total_nodes)];

# add intra-room edges between adjacent boot levels
for i in range(N):
    base = offset[i];
    L = levels[i];
    for j in range(len(L) - 1):
        u = base + j;
        v = base + j + 1;
        diff = L[j+1] - L[j];
        graph[u].append((v, diff));
        graph[v].append((u, diff));

# add tunnel edges with zero cost
for a, b, c in tunnels:
    u = offset[a] + maps[a][c];
    v = offset[b] + maps[b][c];
    graph[u].append((v, 0));
    graph[v].append((u, 0));

INF = 10**18;
dist = [INF] * total_nodes;
start_node = offset[0] + maps[0][0];
dist[start_node] = 0;

heap = [(0, start_node)];
while heap:
    d, u = heapq.heappop(heap);
    if d != dist[u]:
        continue;
    for v, cost in graph[u]:
        nd = d + cost;
        if nd < dist[v]:
            dist[v] = nd;
            heapq.heappush(heap, (nd, v));

ans = INF;
base = offset[N-1];
for j in range(len(levels[N-1])):
    node = base + j;
    if dist[node] < ans:
        ans = dist[node];

print(ans);
`,
  },
  {
    language: 'C++',
    prismLang: 'cpp',
    author: 'Daniel Zhang',
    school: 'Pinetree Secondary',
    code: `// Daniel Zhang, Pinetree Secondary
// Dijkstra on edges instead, simpler implementation, harder to find

#include <bits/stdc++.h>

using namespace std;

using ll = long long;
using State = tuple<ll, ll, ll>;

int vis[200001], edges[200001];
vector<pair<ll, ll>> graph[200001];

int main() {
    int n, m; cin >> n >> m;
    for (int i = 0; i < m; i++) {
        int u, v, w; cin >> u >> v >> w;
        graph[u].push_back({v, i});
        graph[v].push_back({u, i});
        edges[i] = w;
    }

    priority_queue<State, vector<State>, greater<>> pq;
    vector<ll> best(m + 1, LLONG_MAX);

    pq.push({0, 1, m});

    while (!pq.empty()) {
        auto [c, a, i] = pq.top(); pq.pop();

        if (vis[i]) continue;
        vis[i] = 1;

        if (a == n) {
            cout << c;
            return 0;
        }

        for (auto [b, j] : graph[a]) {
            if (vis[j]) continue;
            ll new_c = c + abs(edges[i] - edges[j]);
            if (new_c < best[j]) {
                best[j] = new_c;
                pq.push({new_c, b, j});
            }
        }
    }
}
`,
  },
];

export function SolutionPreview() {
  const [active, setActive] = useState(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = solutions[active];
  const style = mounted && resolvedTheme === 'dark' ? oneDark : oneLight;

  return (
    <div className="relative mx-auto w-full max-w-[620px] min-w-0">
      <Card className="relative w-full min-w-0 overflow-hidden flex flex-col h-[520px] sm:h-[580px] lg:h-auto lg:aspect-[620/580] lg:max-h-[calc(100svh-180px)]">
        {/* Header bar — title + difficulty (matches ProblemTable.tsx Insane styling) */}
        <div className="flex-none items-center justify-between px-5 py-4 border-b border-border-default bg-surface-200/50 flex">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-foreground-lighter">
              CCC 2025 · Senior
            </p>
            <h3 className="text-base font-semibold text-foreground truncate">S4: Floor is Lava</h3>
          </div>
          <span className="inline-flex items-center shrink-0 px-3 py-1 text-xs font-semibold rounded-xs bg-red-100 text-red-800">
            Insane
          </span>
        </div>

        {/* Tags + language tabs */}
        <div className="flex-none flex items-center justify-between px-5 py-2.5 border-b border-border-default text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-300 text-foreground-light">
            graph theory
          </span>
          <div className="flex gap-1">
            {solutions.map((s, i) => (
              <Button
                key={s.language}
                onClick={() => setActive(i)}
                type={i === active ? 'primary' : 'default'}
                size="tiny"
                className="text-[11px]"
                aria-pressed={i === active}
              >
                {s.language}
              </Button>
            ))}
          </div>
        </div>

        {/* Code body — Fills remaining space, never expands card height/width */}
        <div className="flex-1 min-h-0 w-full relative bg-surface-75">
          <div className="absolute inset-0 overflow-auto">
            <SyntaxHighlighter
              language={current.prismLang}
              style={style}
              showLineNumbers
              customStyle={{
                margin: 0,
                padding: '1rem 0.5rem',
                background: 'transparent',
                fontSize: '12px',
                lineHeight: '1.6',
                minWidth: '100%',
                width: 'max-content',
              }}
              codeTagProps={{ style: { background: 'transparent' } }}
              lineProps={{ style: { background: 'transparent' } }}
              lineNumberStyle={{
                minWidth: '2.25rem',
                paddingRight: '1rem',
                opacity: 0.4,
                background: 'transparent',
              }}
            >
              {current.code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Footer — attribution updates with active tab */}
        <div className="flex-none flex items-center justify-between px-5 py-3 border-t border-border-default bg-surface-200/40 text-xs text-foreground-light">
          <span>Solution by {current.author}</span>
          <span className="text-foreground-lighter">{current.school}</span>
        </div>
      </Card>
    </div>
  );
}
