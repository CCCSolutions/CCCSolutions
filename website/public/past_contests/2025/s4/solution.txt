# Advay Chandorkar, Glenforest SS (advayc)
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
    a -= 1  # convert to 0-indexed
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
    d = {}
    for j, val in enumerate(levels[i]):
        d[val] = j
    maps.append(d)

# initialize the graph with empty adjacency lists
graph = [[] for _ in range(total_nodes)]

# add intra-room edges between adjacent boot levels with cost equal to their difference
for i in range(N):
    base = offset[i]
    L = levels[i]
    for j in range(len(L) - 1):
        u = base + j
        v = base + j + 1
        diff = L[j+1] - L[j]
        graph[u].append((v, diff))
        graph[v].append((u, diff))

# add tunnel edges with zero cost if the required boot level is available
for a, b, c in tunnels:
    u = offset[a] + maps[a][c]
    v = offset[b] + maps[b][c]
    graph[u].append((v, 0))
    graph[v].append((u, 0))

INF = 10**18
# initialize distances with infinity
dist = [INF] * total_nodes

# start from level 0 with boot level 0
start_node = offset[0] + maps[0][0]
dist[start_node] = 0

# use a min-heap for dijkstra's algorithm
heap = []
heapq.heappush(heap, (0, start_node))

# perform dijkstra's algorithm to find minimum distances
while heap:
    d, u = heapq.heappop(heap)
    if d != dist[u]:
        continue
    for v, cost in graph[u]:
        nd = d + cost
        if nd < dist[v]:
            dist[v] = nd
            heapq.heappush(heap, (nd, v))

# find the minimum distance to the last level
ans = INF
base = offset[N-1]
for j in range(len(levels[N-1])):
    node = base + j
    if dist[node] < ans:
        ans = dist[node]

print(ans)
