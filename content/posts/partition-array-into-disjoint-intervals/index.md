---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Partition Array Into Disjoint Intervals"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-03T17:10:18+09:00
lastmod: 2022-02-03T17:10:18+09:00
featured: false
draft: false


---

## 問題

整数配列`nums`が与えられる．`nums`を以下の条件を満たすように左右に2分割することを考える．

- 左部分列のどの要素も，右部分列の要素以下である
- 左右の部分列は空ではない

このとき，左部分列の長さを求めよ．

```
nums = [5, 0, 3, 8, 6] -> ans = 3, [5, 0, 3] + [8, 6]
```

## 解法

`左部分列の最大値 <= 右部分列の最小値`という条件を満たす`i`を求める．

左方向の最大値と右方向の最小値を別々に計算して最後に`i`を見つけるというふうに考えると次のようになる．

```python
# Time: O(N), Space: O(N)
class Solution:
    def partitionDisjoint(self, A: List[int]) -> int:
        N = len(A)
        max_on_left = [None for _ in range(N)]
        max_on_left[0] = A[0]
        for i in range(1, N, 1):
            max_on_left[i] = max(max_on_left[i-1], A[i])
        min_on_right = [None for _ in range(N)]
        min_on_right[N-1] = A[N-1]
        for i in range(N-2, -1, -1):
            min_on_right[i] = min(min_on_right[i+1], A[i])
        for i in range(1, N, 1):
            if max_on_left[i-1] <= min_on_right[i]:
                return i
```

`max_on_left`は単調増加な配列で，必要なのは直近の最大値だけなので配列じゃなくても良い．

```python
# Time: O(N), Space: O(N)
class Solution:
    def partitionDisjoint(self, A: List[int]) -> int:
        N = len(A)
        min_on_right = [None for _ in range(N)]
        min_on_right[N-1] = A[N-1]
        for i in range(N-2, -1, -1):
            min_on_right[i] = min(min_on_right[i+1], A[i])
        current_max = A[0]
        for i in range(1, N, 1):
            current_max = max(current_max, A[i-1])
            if current_max<= min_on_right[i]:
                return i
```

更に空間計算量を減らすことができる．境界を左から右へ移していくとき，左側のその時点での最大値より小さい値に遭遇したら，そこは必ず左側に入ることが確定し，同時に左側部分列の長さが暫定で決まる．

```python
# Time: O(N), Space: O(1)
class Solution:
    def partitionDisjoint(self, A: List[int]) -> int:
        N = len(A)
        current_max = A[0]
        possible_max = A[0]
        length = 1
        for i in range(1, N, 1):
            if A[i] < current_max:
                length = i + 1
                current_max = possible_max
            else:
                possible_max = max(possible_max, A[i])
        return length
```

## 出典

- https://leetcode.com/problems/partition-array-into-disjoint-intervals/