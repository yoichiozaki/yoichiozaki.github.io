---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Pairs of Songs With Total Duration Divisible by 60"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-03T17:52:19+09:00
lastmod: 2022-02-03T17:52:19+09:00
featured: false
draft: false


---

## 問題

整数配列`time`が与えられる．`time[i]`は`i`番目の歌の長さを表している．異なる歌同士の組み合わせで，その長さの合計が60で割り切れるようなペアの数を求めよ．

```
times = [30, 20, 150, 100, 40] -> ans = 3 (30 + 150, 20 + 100, 20 + 40)
```

## 解法

2Sum問題のひねったバージョン．相方がいるかをメモっておけば二重ループを回避して$O(n)$で済む．

```python
class Solution:
    def numPairsDivisibleBy60(self, time: List[int]) -> int:
        memo = [0 for _ in range(60)]
        ans = 0
        for t in time:
            ans += memo[(60 - t % 60) % 60]
            memo[t % 60] += 1
        return ans
```

## 出典

- https://leetcode.com/problems/pairs-of-songs-with-total-durations-divisible-by-60/