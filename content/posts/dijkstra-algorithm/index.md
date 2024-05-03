---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Dijkstra Algorithm"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-20T22:27:07+09:00
lastmod: 2021-03-20T22:27:07+09:00
featured: false
draft: false
---

## 何も見ないで Dijkstra 法を書けるようになりたい

何も見ないで Dijkstra 法を書けるようになりたい，ので，練習する．
といってもただただ暗記するのは応用が効かないので，DFS・BFS と比較して覚えることにする．

## グラフ上の探索の一般形

「発見したけどまだ未訪問」の頂点リストから次に訪問する頂点の選び方の違いによって性格が変わる．

```python
def traversal(graph, start, select_func):
    has_visited = set()
    suspended = list()

    has_visited.add(start)
    suspended.append(start)

    while len(suspended) != 0:
        u = select_func(suspended) # ここで探索の性格が決まる
        has_visited.add(u)
        for v in graph[u]:
            if v in has_visited:
                continue
            else:
                suspended.append(v)
```

`select_func`で`suspended`を stack みたいに扱うと DFS．
`select_func`で`suspended`を queue みたいに扱うと BFS．

## `suspended`を優先度付きキューとして扱えば Dijkstra 法

```python
from heapq from heappush, heappop

INF = 10 ** 9

def dijkstra(graph, start):
    has_visited = set()
    suspended = list()
    dist = [INF for _ in range(N)]

    has_visited.add(start)
    suspended.append((0, start))
    dist[start] = 0

    while len(suspended) != 0:
        d, u = heappop(suspended) # suspendedを優先度付きキューとして扱う
        has_visited.add(u)
        for (v, cost) in graph[u]:
            if v not in has_visited and dist[u] + cost < dist[v]:
                dist[v] = dist[u] + cost
                heappush(suspended, (dist[v], v))
    return dist
```

## ついでに Prim 法

最小全域木を計算するアルゴリズム．頂点一つからなる木から始めて，木に含まれていない頂点と木に含まれる頂点を結ぶ辺のうち，重さの最小のものを採用し木に含まれる頂点を増やす，ということを繰り返す．Dijkstra 法に雰囲気似ている．

```python
from heapq import heapify, heappush, heappop

def prim(graph):
    has_used = set()
    has_used.add(0)

    suspended = [(cost, 0, v) for v, cost in graph[0]]
    heapify(suspended)

    mst = []
    mst_weight = 0

    while len(suspended) != 0:
        cost, u, v = heappop(suspended)

        if u in has_used and v in has_used:
            continue

        has_used.add(u)
        has_used.add(v)
        mst.append((u, v))
        mst_weight += cost

        for w, cost in graph[u]:
            if w in has_used:
                continue
            heappush(suspended, (cost, u, w))
        for w, cost in graph[v]:
            if w in has_used:
                continue
            heappush(suspended, (cost, v, w))
        suspended = list(set(suspended))
        heaepify(suspended)
    return mst, mst_weight
```
