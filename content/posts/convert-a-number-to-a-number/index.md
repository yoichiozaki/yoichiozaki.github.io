---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Convert a Number to a Number"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-26T19:14:42+09:00
lastmod: 2021-03-26T19:14:42+09:00
featured: false
draft: false
---

## 問題

整数$A$を整数$B$に変換するのに必要なビット反転の回数を計算せよ．

## 答え

```python
def count(a, b):
    ret = 0
    c = a ^ b # 異なる桁だけ1が立つ
    while c != 0:
        ret += 1 if c & 1 else 0
        c = c >> 1
    return ret
```

こうも書ける．

```python
def count(a, b):
    ret = 0
    c = a ^ b
    while c != 0:
        ret += 1
        c = c & (c - 1) # 右端の1が0になる
    return ret
```
