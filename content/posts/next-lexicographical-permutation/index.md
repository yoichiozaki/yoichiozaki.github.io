---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Next Lexicographical Permutation"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-25T00:48:36+09:00
lastmod: 2021-03-25T00:48:36+09:00
featured: false
draft: false


---

## 辞書順で直後の順列を求めたい

長さ$n$の配列から$n$個の要素を取り出す順列を考える．ある並びを与えられたときに，順列を辞書順に並べたときの直後の並びを求めたい．

```sh
[0, 1, 2, 3] -> [0, 1, 3, 2]
[0, 1, 2, 5, 3, 3, 0] -> [0, 1, 3, 0, 2, 3, 5]
```

## 答え

```python
def next_permutation(lst):
    i = len(lst) - 1
    while 0 < i and lst[i-1] >= lst[i]:
        i -= 1
    if i == 0:
        return lst.reverse()
    i -= 1
    pivot = lst[i]
    j = len(lst) - 1
    while pivot >= lst[j]:
        j -= 1
    lst[i], lst[j] = lst[j], lst[i]
    lst[i + 1:] = reversed(lst[i + 1:])
    return lst
```

ref: https://www.nayuki.io/page/next-lexicographical-permutation-algorithm
