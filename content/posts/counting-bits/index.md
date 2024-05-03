---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Counting Bits"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-06-29T16:51:54+09:00
lastmod: 2021-06-29T16:51:54+09:00
featured: false
draft: false
---

## 問題

0以上`num`以下の数字を2進数で表記したときの，ビット`1`の個数を計算し，長さ`nums + 1`の配列にして返せ．

## 答え

`i`を2進数表記したときの`1`の個数を`f[i]`とすると，

- `f[i]` = `f[i // 2]` + `i % 2`

が成立する．

```python
def solve(num):
    table = [0 for _ in range(num + 1)]
    for i in range(1, num + 1):
        table[i] = table[i >> 1] + (i & 1)
    return table

print(solve(5)) # => [0, 1, 1, 2, 1, 2]
```

pythonの標準の便利関数を使うと簡単だけどこれは求められていなさそう．

```python
def solve(num):
    return [bin(i).count('1') for i in range(num + 1)]

print(solve(5)) # => [0, 1, 1, 2, 1, 2]
```