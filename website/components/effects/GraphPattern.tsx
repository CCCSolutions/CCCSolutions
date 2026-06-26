import { cn } from '../../lib/utils';

type GraphPatternProps = React.SVGProps<SVGSVGElement>;

const VIEW_W = 460;
const VIEW_H = 380;
const NODE_GAP = 2.5;

type Node = { x: number; y: number; path?: boolean; endpoint?: boolean };

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dijkstra(nodes: Node[], adj: number[][], s: number, t: number) {
  const n = nodes.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const done = new Array(n).fill(false);
  dist[s] = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (!done[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
    }
    if (u === -1 || u === t) break;
    done[u] = true;
    for (const v of adj[u]) {
      const w = Math.hypot(nodes[u].x - nodes[v].x, nodes[u].y - nodes[v].y);
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
      }
    }
  }
  const path: number[] = [];
  let cur = t;
  while (cur !== -1) {
    path.push(cur);
    cur = prev[cur];
  }
  return path.reverse();
}

function build() {
  const rand = mulberry32(0x4117);
  const COLS = 9;
  const ROWS = 8;
  const x0 = -55;
  const x1 = VIEW_W + 75;
  const y0 = -60;
  const y1 = VIEW_H + 65;
  const cellW = (x1 - x0) / COLS;
  const cellH = (y1 - y0) / ROWS;
  const nodes: Node[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const jx = (rand() - 0.5) * cellW * 0.82;
      const jy = (rand() - 0.5) * cellH * 0.82;
      nodes.push({ x: x0 + (c + 0.5) * cellW + jx, y: y0 + (r + 0.5) * cellH + jy });
    }
  }

  const adj: number[][] = nodes.map(() => []);
  const edges: { a: number; b: number; hi: boolean }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const mx = (nodes[i].x + nodes[j].x) / 2;
      const my = (nodes[i].y + nodes[j].y) / 2;
      const r2 = ((nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2) / 4;
      let ok = true;
      for (let k = 0; k < nodes.length; k++) {
        if (k === i || k === j) continue;
        if ((nodes[k].x - mx) ** 2 + (nodes[k].y - my) ** 2 < r2 - 1e-6) {
          ok = false;
          break;
        }
      }
      if (ok) {
        edges.push({ a: i, b: j, hi: false });
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  const nearest = (tx: number, ty: number) => {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      const d = (nodes[i].x - tx) ** 2 + (nodes[i].y - ty) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };

  const source = nearest(40, 302);
  const target = nearest(418, 80);
  nodes[source].endpoint = true;
  nodes[target].endpoint = true;

  const path = dijkstra(nodes, adj, source, target);
  const hiKeys = new Set<string>();
  for (const idx of path) nodes[idx].path = true;
  for (let k = 0; k < path.length - 1; k++) {
    hiKeys.add(`${Math.min(path[k], path[k + 1])}-${Math.max(path[k], path[k + 1])}`);
  }
  // Bold the existing edge that carries the path off-screen past the top-right
  // endpoint, so the highlighted route reads as running beyond the frame
  // (mirrors the source side at the bottom-left).
  const prevIdx = path[path.length - 2];
  const inDx = nodes[target].x - nodes[prevIdx].x;
  const inDy = nodes[target].y - nodes[prevIdx].y;
  let tail = -1;
  let bestDot = -Infinity;
  for (const v of adj[target]) {
    const n = nodes[v];
    if (n.x >= 0 && n.x <= VIEW_W && n.y >= 0 && n.y <= VIEW_H) continue; // must leave the frame
    const dx = n.x - nodes[target].x;
    const dy = n.y - nodes[target].y;
    const dot = (inDx * dx + inDy * dy) / (Math.hypot(dx, dy) || 1);
    if (dot > bestDot) {
      bestDot = dot;
      tail = v;
    }
  }
  if (tail !== -1) hiKeys.add(`${Math.min(target, tail)}-${Math.max(target, tail)}`);

  for (const e of edges) e.hi = hiKeys.has(`${e.a}-${e.b}`);

  return { nodes, edges };
}

const { nodes, edges } = build();
const radius = (n: Node) => (n.endpoint ? 5 : n.path ? 4.5 : 3.8);

export function GraphPattern({ className, ...props }: GraphPatternProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      fill="none"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden
      className={cn('text-brand', className)}
      {...props}
    >
      <g stroke="currentColor" strokeLinecap="round">
        {edges.map((e, i) => {
          const a = nodes[e.a];
          const b = nodes[e.b];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const offA = radius(a) + NODE_GAP;
          const offB = radius(b) + NODE_GAP;
          return (
            <line
              key={i}
              x1={a.x + ux * offA}
              y1={a.y + uy * offA}
              x2={b.x - ux * offB}
              y2={b.y - uy * offB}
              strokeWidth={e.hi ? 1.4 : 0.9}
              strokeOpacity={e.hi ? 0.72 : 0.2}
            />
          );
        })}
      </g>
      {nodes.map((n, i) =>
        n.path ? (
          <circle key={i} cx={n.x} cy={n.y} r={radius(n)} fill="currentColor" />
        ) : (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={radius(n)}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.3}
            strokeOpacity={0.5}
          />
        )
      )}
    </svg>
  );
}
