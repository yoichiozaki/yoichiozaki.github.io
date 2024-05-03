---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Route Between Nodes"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-20T16:47:04+09:00
lastmod: 2021-03-20T16:47:04+09:00
featured: false
draft: false


---

## 問題

有向グラフと 2 頂点が与えられたとき，その 2 頂点間にパスがあるか判定せよ．

## 答え

探索するだけ

```python
N = int(input()) # number of nodes
M = int(input()) # number of edges

start = int(input())
goal = int(input())

G = [[] for _ in range(N)]
for _ in range(M):
    u, v = map(int, input(),split())
    G[u].append(v)
    # G[v].append(u) # for undirected

has_visited = set()
def DFS(graph, node):
    has_visited.add(node)
    for neighbor in graph[node]:
        if neighbor in has_visited:
            continue
        else:
            DFS(graph, neighbor)

DFS(G, start)

if goal in has_visited:
    print("reachable")
else:
    print("unreachable")
```
