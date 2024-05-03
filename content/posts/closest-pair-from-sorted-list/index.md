---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Closest Pair From Sorted List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-21T17:14:21+09:00
lastmod: 2021-03-21T17:14:21+09:00
featured: false
draft: false
---

## 問題

昇順にソートされた配列`lst`と値`x`が与えられたとき，和が`x`に最も近くなる 2 要素のペアを`lst`から求めよ．

## 答え

原理的には$O(n^2)$で解けるが，`lst`が昇順にソートされていることをうまく使えば$O(n)$で解ける．

- $O(n^2)$

```python
def solve(lst, x):
    diff = 10 ** 9
    ans = (-1, -1)
    for i in range(len(lst)):
        for j in range(i+1, len(lst), 1):
            if abs(x - (lst[i] + lst[j])) < diff:
                diff = abs(x - (lst[i] + lst[j]))
                ans = (lst[i], lst[j])
    return ans
```

- $O(n)$

```python
def solve(lst, x):
    diff = 10 ** 9
    ans = (-1, -1)
    low = 0
    high = len(lst) - 1
    while low < high:
        s = lst[low] + lst[high]
        if abs(x - s) < diff:
            ans = (lst[low], lst[high])
            diff = abs(x - s)

        if s < x:
            low += 1
        else:
            high -= 1
    return ans
```
