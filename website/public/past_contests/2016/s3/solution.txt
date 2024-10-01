# By Oscar Zhou, Abbey Park High School
# This solution still requires commented explanations. Please feel free to add them!

# https://dmoj.ca/problem/ccc16s3

import sys
sys.setrecursionlimit(int(2e5+5))
input = sys.stdin.readline

def prune(cur, pre):
    global pho
    for nxt in graph[cur]:
        if nxt != pre:
            prune(nxt, cur)
            if pho[nxt]:
                pho[cur] = True

def dfs(cur, pre, dis):
    global node1, diameter
    for nxt in graph[cur]:
        if nxt != pre and pho[nxt]:
            dfs(nxt, cur, dis+1)
    if dis > diameter:
        diameter = dis
        node1 = cur

n, m = map(int, input().split())
pho = [False] * n
root = -1
for item in list(map(int, input().split())):
    root = item
    pho[item] = True
graph = [[] for i in range(n)]
for i in range(n-1):
    a, b = map(int, input().split())
    graph[a].append(b)
    graph[b].append(a)
prune(root, -1)
tot = sum(pho)
diameter = 0
node1 = root
dfs(root, -1, 0)
dfs(node1, -1, 0)
print(2*(tot-1) - diameter)
