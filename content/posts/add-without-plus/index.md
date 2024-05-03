---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Add Without Plus"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T21:15:59+09:00
lastmod: 2021-03-27T21:15:59+09:00
featured: false
draft: false
---

## 問題

`+`を**使わずに**足し算を実装せよ．

## 答え

計算機はビット演算で四則演算を実装している．足し算とは，各桁の数字の足し算と繰り上がりの処理からなる．これらは別々に計算して最後に足し合わせるというやり方でも正しい足し算ができる．10 進数でやると次の通り．

```sh
   762
+  949
------
   601 <- 繰り上がりを無視した各桁同士の和（各桁同士の和 % 10）
+ 1110 <- 繰り上がりだけを並べる
------
  1711 <- 正しい答え
```

これを 2 進数でやればいい．「繰り上がりを無視した足し算」はそのまま`xor`が対応する．「繰り上がりだけ並べる」というのは，`&`を取って左 1 シフトと対応する．

> x + y = (x XOR y) + 2 * (x AND y)

```python
def add(a, b):
    # 32 bits integer max
    MAX = 0x7FFFFFFF
    # 32 bits interger min
    MIN = 0x80000000
    # mask to get last 32 bits
    mask = 0xFFFFFFFF
    if b == 0: # a + 0 = a
        return a if a <= MAX else ~(a ^ mask)
    s = a ^ b
    c = (a & b) << 1
    a = s & mask
    b = c & mask
    return add(a, b)

print(add(1, -1))
```

繰り返しで書くと次の通り．

```python
def add(a, b):
    # 32 bits integer max
    MAX = 0x7FFFFFFF
    # 32 bits interger min
    MIN = 0x80000000
    # mask to get last 32 bits
    mask = 0xFFFFFFFF
    while b:
        s = a ^ b
        c = (a & b) << 1
        a = s & mask
        b = c & mask
    return a if a <= MAX else ~(a ^ mask)

print(add(1, -1))
```
