---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Diameter of a Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-29T15:10:30+09:00
lastmod: 2021-03-29T15:10:30+09:00
featured: false
draft: false
---

## 問題

木の直径を求めよ．

## 答え

任意の頂点$x$から BFS をして$x$から最遠の頂点$u$を計算し，再び$u$から BFS して$u$から最遠の頂点$v$を計算する．このとき，$u$-$v$はその木の直径をなすパスの両端点になっている．

```python
N = int(input())

T = [[] for _ in range(N)]
for _ in range(N-1):
    s, t, w = map(int, input().split())
    T[s].append((t, w))
    T[t].append((s, w))

def BFS(tree, s):
    dist = [-1 for _ in range(N)]
    dist[s] = 0
    suspended = [s]
    while suspended:
        u = suspended.pop(0)
        cost = dist[u]
        for (v, w) in tree[u]:
            if dist[v] == -1:
              dist[v] = cost + w
              suspended.append(v)
    d = max(dist)
    return dist.index(d), d

u, _ = BFS(T, 0)
v, diameter = BFS(T, u)

print(diameter)
```

対象となる木が「二分木」であるときは別の解き方もできる．ある頂点を根としたとき，「その根の左部分木の直径」，「その根の右部分木の直径」，「その根の左右の部分木の高さの和+1」のうちの最大値がその木の直径となる．これを再帰的に書いても答えが得られる．

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def get_height(root):
    if root is None:
        return 0
    if root.left is None and root.right is None:
        return 1
    if root.left is None and root.right is not None:
        return get_height(root.right) + 1
    if root.left is not None and root.right is None:
        return get_height(root.left) + 1

    # root.left is not None and root.right is not None:
    return max(get_height(root.left), get_height(root.right)) + 1

def get_diameter(root):
    if root is None:
        return 0

    left_height = get_height(root.left)
    right_height = get_height(root.right)

    root_diameter = left_height + right_height + 1
    left_diameter = get_diameter(root.left)
    right_diameter = get_diameter(root.right)

    return max(left_diameter, right_diameter, root_diameter)
```
