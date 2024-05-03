---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Insert a Number in a Number"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-26T19:06:11+09:00
lastmod: 2021-03-26T19:06:11+09:00
featured: false
draft: false


---

## 問題

ビット列の指定された位置に別のビット列を挿入せよ．

```sh
A = 100000000 の 2桁目から6桁目にB = 101101を挿入
-> 101011010
```

## 答え

```python
# aのi桁目からj桁目にbを挿入
def insert(a, b, i, j):
    ones = ~0 # 全部1
    left = ones << (j + 1)
    right = (1 << i) - 1
    mask = left | right
    a &= mask
    b <<= i
    return a | b
```

`(1 << i) - 1`：`1`が$i$個右端に並ぶ
