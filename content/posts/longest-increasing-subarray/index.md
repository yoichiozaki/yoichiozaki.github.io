---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Longest Increasing Subarray"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-25T13:58:26+09:00
lastmod: 2021-03-25T13:58:26+09:00
featured: false
draft: false


---

## Longest Increasing Subarray：最長増加部分列問題

長さ$N$の数列が与えられたとき，そのうちいくつかの項を順番を変えずに取り出して部分列を作る．これら部分列のうち，それが増加列であるようなものの中で，最大の長さを求めよ．

```sh
[3, 5, 2, 6, 7, 1, 4]
-> [3, 5, 6, 7] (len = 4)
```

## 解法

### $O(2^N \times N)$な力技

考えられる部分列を全て列挙し，それぞれが増加列であるかを調べる．部分列の列挙に$O(2^N)$，ある部分列が増加列であるかを調べるのに$O(N)$かかる．

再帰で全探索．

```python
lst = [3, 5, 2, 6, 7, 1, 4] # => 4

def LIS(lst):
    subs = []
    def rec(pos, sofar):
        if pos == len(lst):
            subs.append(sofar)
            return
        rec(pos + 1, sofar)
        rec(pos + 1, sofar + [lst[pos]])
    rec(0, [])
    def is_increasing(lst):
        for i in range(len(lst) - 1):
            if lst[i] > lst[i + 1]:
                return False
        return True
    ans = 0
    for sub in subs:
        if is_increasing(sub):
            ans = max(ans, len(sub))
    return ans

print(LIS(lst))
```

ビット全探索．

```python
lst = [3, 5, 2, 6, 7, 1, 4] # => 4

def LIS(lst):
    ans = 0

    def is_increasing(lst):
        for i in range(len(lst) - 1):
            if lst[i] > lst[i + 1]:
                return False
        return True

    for i in range(1 << len(lst)):
        sub = []
        for j in range(len(lst)):
            if i & (1 << j):
                sub.append(lst[j])
        if is_increasing(sub):
            ans = max(ans, len(sub))
    return ans

print(LIS(lst))
```

### $O(N^2)$で解く DP

`dp[i]`を「`lst[i]`が右端となるような増加部分列の最大の長さ」とすると，`dp[i + 1]`は「`j < i + 1`かつ`lst[j] <= lst[i + 1]`な`j`についての`dp[j]`の最大値 + 1」と更新できる．

```python
lst = [3, 5, 2, 6, 7, 1, 4] # => 4

def LIS(lst):
    # dp[i]: lst[i]が右端となるような増加部分列の最大の長さ
    dp = [1 for _ in range(len(lst))]
    for i in range(len(lst)):
        for j in range(i):
            if lst[j] <= lst[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)

print(LIS(lst))
```

### $O(N^2)$で解く DP

一つ前のと添字を逆転させる．つまり，`dp[i]`を「長さ`i + 1`の増加部分列のうちの最小の右端」とする．`dp[i+1]`は`dp[i]`より大きい最小の`lst`要素．

```python
lst = [3, 5, 2, 6, 7, 1, 4] # => 4

def LIS(lst):
    # dp[i]: 長さがi+1の増加部分列の最小の右端
    INF = float('inf')
    dp = [INF for _ in range(len(lst))]
    for i in range(len(lst)):
        for j in range(len(dp)):
            if j == 0 or dp[j - 1] < lst[i]:
                dp[j] = min(dp[j], lst[i])
    ans = 0
    for i in range(len(dp)):
        if dp[i] < INF:
            ans = i
    ans += 1
    return ans

print(LIS(lst))
```

### $O(N \log N)$で解く DP

`dp[j]`ごとにそこに入れるべき`lst`要素を決めるのでなくて，`lst`要素ごとに`dp`のどこに入れるべきなのかを二分探索で計算する．

```python
lst = [3, 5, 2, 6, 7, 1, 4] # => 4

from bisect import bisect_left

def LIS(lst):
    # dp[i]: 長さがi+1の増加部分列の最小の右端
    INF = float('inf')
    dp = [INF for _ in range(len(lst))]
    for i in range(len(lst)):
        dp[bisect_left(dp, lst[i])] = lst[i]
    return bisect_left(dp, INF)

print(LIS(lst))
```
