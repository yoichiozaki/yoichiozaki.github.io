---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Merge Two Sorted Array in Place"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T14:01:58+09:00
lastmod: 2021-03-27T14:01:58+09:00
featured: false
draft: false


---

## 問題

共に昇順に整列された配列`a`と配列`b`が与えられる．`a`には`b`の要素を全て格納するほどのバッファが存在する．このとき，追加のメモリを使用せずに`a`と`b`を昇順に整列された状態にマージせよ．

## 答え

後ろからやる．

```python
a = [1, 3, 4, 8, 10, -1, -1, -1, -1]
b = [2, 7, 11, 14]

def sorted_merge(a, b, tail_a, tail_b):
    idx_a = tail_a - 1
    idx_b = tail_b - 1
    idx_merged = tail_a + tail_b - 1
    while 0 <= idx_b:
        if 0 <= idx_a and b[idx_b] < a[idx_a]:
            a[idx_merged] = a[idx_a]
            idx_a -= 1
        else:
            a[idx_merged] = b[idx_b]
            idx_b -= 1
        idx_merged -= 1

sorted_merge(a, b, 5, 4)
print(a) # => [1, 2, 3, 4, 7, 8, 10, 11, 14]
```
