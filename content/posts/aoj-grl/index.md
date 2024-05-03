---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "AOJ GRL in Python"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-04-17T23:46:26+09:00
lastmod: 2021-04-17T23:46:26+09:00
featured: false
draft: true
---

[AOJ-GRL](https://judge.u-aizu.ac.jp/onlinejudge/finder.jsp?course=GRL)を Python で解く．

## GRL_1_A: Single Source Shortest Path

負の重みを持つ辺を持たないグラフの単一始点最短経路問題（SSSP）なので Dijkstra 法．`suspended`を優先度付きキューにするところがポイント．

<details>
<summary>答え</summary>

```python
import heapq

V, E, r = map(int, input().split())
G = [[] for _ in range(V)]
for _ in range(E):
    s, t, d = map(int, input().split())
    G[s].append((t, d))

dists = [float("inf") for _ in range(V)]
dists[r] = 0
has_visited = set()
suspended = [(0, r)] # [(dist, vertex), ...]

while suspended:
    _, u = heapq.heappop(suspended)
    has_visited.add(u)
    for v, d in G[u]:
        if v not in has_visited:
            if dists[u] + d < dists[v]:
                dists[v] = dists[u] + d
                heapq.heappush(suspended, (dists[v], v))

for dist in dists:
    print(dist if dist != float("inf") else "INF")
```

</details>

## GRL_1_B: Single Source Shortest Path (Negative Edges)

負の重みを持つ辺を含むグラフの単一始点最短経路問題（SSSP）なので Bellman-Ford 法．負の閉路があるときは答えが出ないので負の閉路が存在することを通知する．

<details>
<summary>答え</summary>

Bellman-Ford 法のイメージは次の通り．

```sh
1. 最短距離が更新されなくなる or |V|回目の更新が終わるまで以下を繰り返す．
    - 全ての辺に対して「dist[v] = min(dist[v], dist[u] + u-v距離)」でdistを更新
2. |V|-1回以内の更新で最短距離の更新が終了したら負の閉路は存在しない．|V|回目の更新が起これば負の閉路が存在する．
```

```python
V, E, r = map(int, input().split())
G = [[] for _ in range(V)]
for _ in range(E):
    s, t, d = map(int, input().split())
    G[s].append((t, d))

dists = [float("inf") for _ in range(V)]
dists[r] = 0

rep = 0
while rep < V:
    end_flag = True
    for u in range(V):
        for v, d in G[u]:
            if dists[u] != float("inf") and dists[u] + d < dists[v]:
                dists[v] = dists[u] + d
                end_flag = False
    if end_flag:
        break
    rep += 1

if rep == V:
    print("NEGATIVE CYCLE")
else:
    for d in dists:
        print(d if d != float("inf") else "INF")
```

</details>

## GRL_1_C: All Pairs Shortest Path

全頂点対の最短距離を求める問題なので Warshall-Floyd 法．

<details>
<summary>答え</summary>

Warshall-Floyd 法のイメージは次の通り．

```sh
1. dist[i][j]を初期化
    - 辺(i, j)が存在すればそのコスト
    - i == jのとき0
    - それ以外はinf
2. distを更新
    - for k = 0 ... V-1:
        - for u = 0 ... V-1:
            - for v = 0 .. V-1:
                - dist[u][v] = min(dist[u][v], dist[u][k] + dist[k][v])
```

負の閉路の検出は，「頂点`i`から頂点`i`の最短距離が負か」で判定できる．

```python
V, E = map(int, input().split())

dists = [[float("inf") for _ in range(V)] for _ in range(V)]

for i in range(V):
    dists[i][i] = 0

for _ in range(E):
    s, t, d = map(int, input().split())
    dists[s][t] = d

for k in range(V):
    for u in range(V):
        for v in range(V):
            dists[u][v] = min(dists[u][v], dists[u][k] + dists[k][v])

has_negative_cycle = False
for i in range(V):
    if dists[i][i] < 0:
        has_negative_cycle = True
        break
if has_negative_cycle:
    print("NEGATIVE CYCLE")
    exit()

for row in dists:
    for i in range(V):
        row[i] = row[i] if row[i] != float("inf") else "INF"
    print(*row)
```

</details>

## GRL_2_A: Minimum Spanning Tree

最小全域木なのでプリム法・クラスカル法．

<details>
<summary>答え</summary>

プリム法とクラスカル法の違いは何についてループを回すか．

プリム法では頂点についてループを回す．

```sh
1. 適当に頂点を一つ選んでそれを求めたい木に含めて確定させる
2. すべての頂点が木に含まれるまで以下を繰り返す
    - (木に含まれている頂点, 木に含まれていない頂点)という辺の中でコスト最小の辺を選んで木に加える
```

```python
import heapq

V, E = map(int, input().split())
G = [[] for _ in range(V)]
for _ in range(E):
    s, t, w = map(int, input().split())
    G[s].append((t, w))
    G[t].append((s, w))

has_visited = set()
suspended = [(0, 0)]

mst_weight = 0

while suspended:
    w, u = heapq.heappop(suspended)
    if u in has_visited:
        continue
    has_visited.add(u)
    mst_weight += w
    for v, w_ in G[u]:
        if v in has_visited:
            continue
        heapq.heappush(suspended, (w_, v))

print(mst_weight)
```

クラスカル法では辺についてループを回す．

```sh
1. 辺を重さで昇順にソートする
2. 辺をV-1個選ぶまで以下を繰り返す
    - 重さ最小の辺を選択しその辺を加えて閉路ができないならば木に追加する
```

閉路ができるかを Union-Find 木で実装すると良い．

```python
class UnionFind:
    def __init__(self, size):
        self.size = size
        self.parents = [-1 for _ in range(size)]
    def find(self, x):
        if self.parents[x] < 0:
            return x
        else:
            self.parents[x] = self.find(self.parents[x])
            return self.parents[x]
    def union(self, x, y):
        x = self.find(x)
        y = self.find(y)
        if x == y:
            return
        if self.parents[x] > self.parents[y]:
            x, y = y, x
        self.parents[x] += self.parents[y]
        self.parents[y] = x
    def same(self, x, y):
        return self.find(x) == self.find(y)

V, E = map(int, input().split())
edges = []
for i in range(E):
    s, t, w = map(int, input().split())
    edges.append((w, s, t))
    edges.append((w, t, s))
edges.sort()

uf = UnionFind(V)

mst_weight = 0
for edge in edges:
    (w, s, t) = edge
    if uf.same(s, t):
        continue
    mst_weight += w
    uf.union(s, t)

print(mst_weight)
```

</details>

## GRL_2_B: Minimum-Cost Arborescence

有向グラフに対する根を指定された最小全域木の重さを求める問題．

<details>
<summary>答え</summary>

[Edmond 法](https://en.wikipedia.org/wiki/Edmonds%27_algorithm)というのがある．

TODO: 解く

```python

```

</details>

## GRL_3_A: Articulation Points

関節点：連結グラフ$G$において，頂点$u$と$u$から出ている辺を全て削除して得られる部分グラフが非連結になるとき，頂点$u$はグラフ$G$の関節点であるという．

<details>
<summary>答え</summary>

全探索するなら，頂点を一つ選んでそれが関節点の定義を満たすかを調べれば求められる．これだと$O(V \times (V + E))$かかる．

```sh
for every v in G:
    remove v from G
    check G is connected by BFS/DFS
    add v to G
```

効率の良いやり方として DFS を使った解き方がある．

まず，ある頂点を根としてグラフを DFS したときに通過する頂点・辺を集めると木ができる．これを DFS 木と呼ぶことにする．一方で，グラフには DFS 木に含まれない辺が存在することも考えられる．このような辺を後退辺と呼ぶ．

ここで DFS 木内の頂点$u$が次の条件を満たすなら$u$は関節点であると言える．

- $u$は DFS 木の根であり，$u$の子供が 2 つ以上いる．
- $u$は DFS 木の根ではなく，$u$の子供$v$について「$v$を根とする DFS 部分木において，$u$の先祖と DFS 部分木内の頂点を端点に持つ後退辺が存在しない」を満たす．

これらの条件は次の情報を使って言い換えることができる．

- `preord[u]`：頂点`u`の DFS での行きがけ順位
- `lowlink[u]`：頂点`u`から生える後退辺を 0 or 1 回たどって到達できる頂点`w`について`min(preord[w])`

$u$が関節点である条件は

- $u$は DFS 木の根であり，$u$の子供が 2 つ以上いる．
- $u$は DFS 木の根ではなく，$u$の子供$v$について`preord[u] <= lowlink[v]`を満たす$v$が存在する

`preord[u]`が行きがけ順位なので`preord[u]`の大小で先祖であるかの判定ができる．

```python
import sys
sys.setrecursionlimit(10**6)

V, E = map(int, input().split())
G = [[] for _ in range(V)]
for _ in range(E):
    s, t = map(int, input().split())
    G[s].append(t)
    G[t].append(s)

preord = [float("inf") for _ in range(V)]
pre = 0

lowlink = [float("inf") for _ in range(V)]

articulation_points = []

def dfs(u, p):
    global pre
    preord[u] = pre
    lowlink[u] = preord[u]
    pre += 1
    num_child = 0
    is_articulation_point = False
    for v in G[u]:
        if preord[v] == float("inf"): # vは未訪問なので探索を続ける
            num_child += 1
            dfs(v, u)
            lowlink[u] = min(lowlink[u], lowlink[v])

            if p != -1: # uはDFS木の根ではない
                if preord[u] <= lowlink[v]:
                    is_articulation_point = True

        elif v != p: # vは訪問済みなのに親じゃないのでu-vは後退辺
            lowlink[u] = min(lowlink[u], preord[v])

    if p == -1: # uはDFS木の根
        if 2 <= num_child: # 子が2つ以上
            is_articulation_point = True

    if is_articulation_point:
        articulation_points.append(u)

dfs(0, -1)

articulation_points.sort()
for p in articulation_points:
    print(p)
```

</details>

## GRL_3_B: Bridges

<details>
<summary>答え</summary>

ある辺（$u$, $v$）が橋であるかは`preord[u] < lowlink[v]`

```python
import sys
sys.setrecursionlimit(10**6)

V, E = map(int, input().split())
G = [[] for _ in range(V)]
for _ in range(E):
    s, t = map(int, input().split())
    G[s].append(t)
    G[t].append(s)

preord = [float("inf") for _ in range(V)]
pre = 0

lowlink = [float("inf") for _ in range(V)]

bridges = []

def dfs(u, p):
    global pre
    preord[u] = pre
    lowlink[u] = preord[u]
    pre += 1
    for v in G[u]:
        if preord[v] == float("inf"): # vは未訪問なので探索を続ける
            dfs(v, u)
            lowlink[u] = min(lowlink[u], lowlink[v])

            if preord[u] < lowlink[v]:
                bridges.append((min(u, v), max(u, v)))

        elif v != p: # vは訪問済みなのに親じゃないのでu-vは後退辺
            lowlink[u] = min(lowlink[u], preord[v])

dfs(0, -1)

bridges.sort()
for bridge in bridges:
    print(*bridge)
```

</details>

## GRL_3_C: Strongly Connected Components

<details>
<summary>答え</summary>

適当な頂点から DFS して帰りがけ順位をメモ，というのを全頂点の帰りがけ順位が確定するまでやる．すべての辺の向きを逆転させたグラフ上で，帰りがけ順位の大きい頂点から DFS を行う．

```python
import sys
sys.setrecursionlimit(10**6)

V, E = map(int, input().split())
G = [[] for _ in range(V)]
RG = [[] for _ in range(V)]
for _ in range(E):
    s, t = map(int, input().split())
    G[s].append(t)
    RG[t].append(s)

def SCC(V, G, RG):
    postorder = []
    has_visited = set()
    groups = [-1 for _ in range(V)]

    def dfs(u):
        has_visited.add(u)
        for v in G[u]:
            if v not in has_visited:
                dfs(v)
        postorder.append(u) # 帰りがけ順位が小さい順に頂点が並ぶ

    def rdfs(u, label):
        groups[u] = label
        has_visited.add(u)
        for v in RG[u]:
            if v not in has_visited:
                rdfs(v, label)


    for u in range(V):
        if u not in has_visited:
            dfs(u)

    has_visited = set()
    label = 0

    for u in reversed(postorder):
        if u not in has_visited:
            rdfs(u, label)
            label += 1

    return label, groups

_, groups = SCC(V, G, RG)

Q = int(input())
for _ in range(Q):
    s, t = map(int, input().split())
    print(1 if groups[s] == groups[t] else 0)
```

</details>

## GRL_4_A: Cycle Detection for a Directed Graph

<details>
<summary>答え</summary>

TODO: 解く

```python

```

</details>

## GRL_4_B: Topological Sort

<details>
<summary>答え</summary>

DFS の帰りがけ順がトポロジカルソートの逆順．

```python
V, E = map(int, input().split())
G = [[] for _ in range(V)]

for _ in range(E):
    s, t = map(int, input().split())
    G[s].append(t)

has_visited = set()
topo = []

def dfs(u):
    has_visited.add(u)
    for v in G[u]:
        if v in has_visited:
            continue
        dfs(v)
    topo.append(u)

for v in range(V):
    if v in has_visited:
        continue
    dfs(v)

print(*reversed(topo), sep="\n")
```

</details>

## GRL_5_A: Diameter of a Tree

<details>
<summary>答え</summary>

double-sweep と言われるアルゴリズム．適当な頂点から最も遠い頂点を BFS で見つけて，その頂点から最も遠い頂点をもう一度 BFS して見つける．

```python
V = int(input())
G = [[] for _ in range(V)]
for _ in range(V - 1):
    s, t, d = map(int, input().split())
    G[s].append((t, d))
    G[t].append((s, d))

def bfs(s):
    dist = [-1 for _ in range(V)]
    suspended = [s]
    dist[s] = 0
    while suspended:
        u = suspended.pop(0)
        d = dist[u]
        for v, _d in G[u]:
            if dist[v] != -1:
                continue
            dist[v] = d + _d
            suspended.append(v)
    diameter = max(dist)
    endpoint = dist.index(diameter)
    return endpoint, diameter

u, _ = bfs(0)
v, d = bfs(u)

print(d)
```

</details>

## GRL_5_B: Height of a Tree

<details>
<summary>答え</summary>

以下のコードだと TLE．
TODO: fixme

```python
V = int(input())
G = [[] for _ in range(V)]
for _ in range(V - 1):
    s, t, d = map(int, input().split())
    G[s].append((t, d))
    G[t].append((s, d))

def height(root, par):
    if len(G[root]) == 0:
        return 0
    heights = []
    for u, h in G[root]:
        if u == par:
            continue
        heights.append(h + height(u, root))
    if len(heights) == 0:
        return 0
    else:
        return max(heights)

for r in range(V):
    print(height(r, -1))
```

</details>

## GRL_5_C: Lowest Common Ancestor

<details>
<summary>答え</summary>

```python

```

</details>

## GRL_5_D: Range Query on a Tree

<details>
<summary>答え</summary>

```python

```

</details>

## GRL_5_E: Range Query on a Tree II

<details>
<summary>答え</summary>

```python

```

</details>

## GRL_6_A: Maximum Flow

<details>
<summary>答え</summary>

```python

```

</details>

## GRL_6_B: Minimum Cost Flow

<details>
<summary>答え</summary>

```python

```

</details>

## GRL_7_A: Bipartite Matching

<details>
<summary>答え</summary>

```python

```

</details>
