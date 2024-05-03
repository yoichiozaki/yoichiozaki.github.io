---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Recursive Multiply"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T00:34:23+09:00
lastmod: 2021-03-27T00:34:23+09:00
featured: false
draft: false


---

## 問題

`*`を使わずに掛け算を実装せよ．

## 答え

```python
def product(a, b):
    smaller = a if a < b else b
    larger = b if a < b else a
    def helper(smaller, larger): # sum up `larger` in `smaller` times
        if smaller == 0: # 0 x larger = 0
            return 0
        if smaller == 1: # 1 x larger = larger
            return larger
        s = smaller >> 1
        half = helper(s, larger)
        if smaller & 1:
            return half + half + larger
        else:
            return half + half
    return helper(smaller, larger)
```

メモ化再帰でもっと効率良くできる．

```python
def product(a, b):
    smaller = a if a < b else b
    larger = b if a < b else a
    memo = [-1] * (smaller + 1)
    def helper(smaller, larger, memo):
        if smaller == 0:
            return 0
        if smaller == 1:
            return larger
        if memo[smaller] != -1:
            return memo[smaller]
        s = smaller >> 1
        half = helper(s, larger, memo)
        ret = 0
        if smaller & 1:
            ret = half + half + larger
        else:
            ret = half + half
        memo[smaller] = ret
        return ret
    return helper(smaller, larger, memo)
```
