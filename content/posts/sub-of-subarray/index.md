---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sub of Subarray"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-26T00:41:37+09:00
lastmod: 2021-03-26T00:41:37+09:00
featured: false
draft: false


---

## 部分和問題

配列`lst`と整数`W`が与えられたとき，`lst`の部分配列の和が`W`になることような部分配列は存在するか．

## 解法

再帰で解く．

```python
def check(lst, W):
    def rec(pos, sofar):
        if pos == len(lst):
            return sofar == W
        if rec(pos + 1, sofar + lst[pos]):
            return True
        if rec(pos + 1, sofar):
            return True
        return False
    return rec(0, 0)
```

```python
def check(lst, W):
    def rec(pos, remain):
        if pos == len(lst):
            return remain == 0
        if rec(pos + 1, remain - lst[pos]):
            return True
        if rec(pos + 1, remain):
            return True
        return False
    return rec(0, W)
```

```python
def check(lst, W):
    memo = [[-1 for _ in range(len(lst))] for _ in range(W)]
    def rec(pos, remain):
        if memo[remain][pos] != -1:
            return memo[remain][pos]
        ret = 0
        if pos == 0:
            return remain == 0
        if rec(pos - 1, remain - lst[pos]):
            ret = 1
        if rec(pos - 1, remain):
            ret = 1
        memo[remain][pos] = ret
        return ret
    return rec(N, W)
```

ビット全探索

```python
def check(lst, W):
    for i in range(1 << len(lst)):
        sofar = 0
        for j in range(len(lst)):
            if i & (1 << j):
                sofar += lst[j]
        if sofar == W:
            return True
    return False
```
