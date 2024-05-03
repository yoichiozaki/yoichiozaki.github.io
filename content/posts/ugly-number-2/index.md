---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Ugly Number 2"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-10-06T14:45:53+09:00
lastmod: 2021-10-06T14:45:53+09:00
featured: false
draft: false


---

## 問題

素因数が$2$，$3$，$5$のみからなる合成数を「ugly number」と呼ぶことにする．$n$番目のugly numberを計算せよ．

## 解法

なんとなくugly numberを書き出してみると，

```
1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, ...
```

あるugly numberはそれ以前のugly numberのどれかに$2$，$3$，$5$のどれかを乗じて得られる最小の数になっている．

```python
class Solution:
    def nthUglyNumber(self, n: int) -> int:
        uglies = [1]
        ptr2 = 0
        ptr3 = 0
        ptr5 = 0
        while 1 < n:
            ugly2 = 2 * uglies[ptr2]
            ugly3 = 3 * uglies[ptr3]
            ugly5 = 5 * uglies[ptr5]
            ugly = min(ugly2, ugly3, ugly5)
            if ugly == ugly2:
                ptr2 += 1
            if ugly == ugly3:
                ptr3 += 1
            if ugly == ugly5:
                ptr5 += 1
            uglies.append(ugly)
            n -= 1
        return uglies[-1]
```

## Ref

- https://leetcode.com/problems/ugly-number-ii/