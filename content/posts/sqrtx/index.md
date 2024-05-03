---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sqrt(x)"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-04-09T23:03:40+09:00
lastmod: 2021-04-09T23:03:40+09:00
featured: false
draft: false


---

## 問題

非負整数が与えられる．その平方の整数部分を計算せよ．

## 答え

二分探索で書く．

```python
class Solution:
    def mySqrt(self, x: int) -> int:
        ok = 1 << 16
        ng = 0

        def is_ok(mid):
             return x < mid * mid

        while 1 < abs(ok - ng):
            mid = (ok + ng) // 2
            if is_ok(mid):
                ok = mid
            else:
                ng = mid
        return ok - 1
```

全部調べる．

```python
class Solution:
    def mySqrt(self, x: int) -> int:
        i = 1
        while i * i <= x:
            i += 1
        return i - 1
```
