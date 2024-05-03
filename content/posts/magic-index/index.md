---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Magic Index"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-26T22:49:09+09:00
lastmod: 2021-03-26T22:49:09+09:00
featured: false
draft: false


---

## 問題

すべての要素が互いに異なりかつ昇順に整列された配列$a$が与えられる．ここで

$$
a_i = i
$$

つまり，配列$a$の$i$番目の要素が$i$であるような$i$を magic index と呼ぶことにする．

配列が与えられたとき，magic index を求めよ．

## 答え

すべての要素を一つずつ見ながら magic index であるかを確認することで求まる．$O(n)$

```python
def get_magic_index(lst):
    ret = []
    for idx, ele in enumerate(lst):
        if ele == idx:
            ret.append(idx)
    return ret
```

だが，これでは「与えられる配列が昇順になっている」という条件を使えていない．

「昇順」と来たら，二分探索．$O(\log n)$

```python
def get_magic_index(lst):
    def rec(lst, left, right):
        if right < left:
            return -1
        mid = (left + right) // 2
        if lst[mid] == mid:
            return mid
        if lst[mid] < mid:
            return rec(lst, mid + 1, right)
        if mid < lst[mid]:
            return rec(lst, left, mid - 1)
    return rec(lst, 0, len(lst) - 1)
```
