---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Happy Number"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-10T17:09:58+09:00
lastmod: 2022-02-10T17:09:58+09:00
featured: false
draft: false


---

## 問題

`happy number`を次のように定義する

- 各桁の二乗和を取る操作を繰り返したときに繰り返し同じ数字が登場することなく`1`で終わる

与えられた正の整数`n`が`happy number`であるかどうか判定せよ．

```
n = 19
1^2 + 9^2 = 82
8^2 + 2^2 = 68
6^2 + 8^2 = 100
1^2 + 0^2 + 0^2 = 1 -> 19 is happy number!
```

## 解法

「各桁の二乗和を取る操作」での入出力の関係は隣接リストのように表現できて，そのリストが循環を含むのかを判定すれば良い．

`1`は各桁の二乗和を取っても`1`に戻ることに注意．

```python
class Solution:
    def isHappy(self, n: int) -> bool:
        def calc_next(n):
            total = 0
            while 0 < n:
                n, d = divmod(n, 10)
                total += d * d
            return total
        slower = n
        faster = calc_next(n) # ループの条件を下のようにするためにfasterを1つ進めておく
        while slower != faster and faster != 1:
            slower = calc_next(slower)
            faster = calc_next(calc_next(faster))　
        return faster == 1
```

## 出典

- https://leetcode.com/problems/happy-number/