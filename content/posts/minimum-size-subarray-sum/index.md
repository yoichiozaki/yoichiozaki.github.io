---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Minimum Size Subarray Sum"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-09-01T00:08:00+09:00
lastmod: 2021-09-01T00:08:00+09:00
featured: false
draft: false


---

## 問題

正整数配列`nums`と整数`target`が与えられる．`nums`の連続する部分列のうち，その和が`target`以上となるような部分列の最小の長さを求めよ．そのような部分列が存在しないならば`0`を返せ．

## 方針

常に考えるべきは

1. まずはbrute-force
2. 無駄な計算はないか？

## 解法1

- brute-force
- 考えられるすべての部分列を列挙して，それぞれについて和をとって`target`以上になるかを調べる
- 時間計算量：$O(n^3)$
  - $O(n^2)$個の部分列それぞれに対して，$O(n)$で和を取る
- 空間計算量：$O(1)$

```python
class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        ans = float("inf")
        for i in range(len(nums)):
            for j in range(i, len(nums)):
                s = 0
                for num in nums[i:j+1]:
                    s += num
                if target <= s:
                    ans = min(ans, j - i + 1)
        return ans if ans != float("inf") else 0
```

## 解法2

- 解法1を改良する
- 部分列の和を累積和を使って$O(1)$で求めれば全体は$O(n^2)$に落とせる
  - 累積和：`accum[0] = 0`，`accum[i] = accum[i-1] + nums[i]`
- 時間計算量：$O(n^2)$
  - $O(n^2)$個の部分列それぞれに対して，$O(1)$で和を取る
- 空間計算量：$O(n)$
  - 累積和の配列

```python
class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        ans = float("inf")
        accum = [0 for _ in range(len(nums) + 1)]
        for i in range(1, len(nums) + 1):
            accum[i] = accum[i-1] + nums[i-1]

        for i in range(len(nums)):
            for j in range(i, len(nums)):
                s = accum[j+1] - accum[i]
                if target <= s:
                    ans = min(ans, j - i + 1)
        return ans if ans != float("inf") else 0
```

## 解法3

- 解法2を改良する
- 累積和`accum`は単調に増加する配列
- `target = accum[j+1] - accum[i]`だから`accum[j+1] = target + accum[i]`
- `i`を固定したときに`j+1`は`accum`に対する二分探索で$O(\log n)$で求められる
- 時間計算量：$O(n \log n)$
  - $O(n)$で左端が回って，$O(\log n)$で部分和が`target`を超える境目が取れる
- 空間計算量：$O(n)$
  - 累積和の配列

```python
class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        ans = float("inf")
        accum = [0 for _ in range(len(nums) + 1)]
        for i in range(1, len(nums) + 1):
            accum[i] = accum[i-1] + nums[i-1]

        for i in range(len(nums) + 1):
            j = bisect_left(accum, accum[i] + target)
            if j != len(accum):
                ans = min(ans, j - i)
        return ans if ans != float("inf") else 0
```

## 解法4

- 尺取法というテク
  - 解法3の改良（`accum`を全部保持しない）とも捉えられる
- 左端を固定したときに，その部分列の和が`target`を超えた時点で右端はそれ以上伸ばしても意味ない
- 時間計算量：$O(n)$
  - $O(n)$で左端が回っておしまい
- 空間計算量：$O(1)$

```python
class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
        ans = float("inf")
        left = 0
        accum = 0
        for right in range(len(nums)):
            accum += nums[right]
            while target <= accum:
                ans = min(ans, right - left + 1)
                accum -= nums[left]
                left += 1
        return ans if ans != float("inf") else 0
```

## ref

https://leetcode.com/problems/minimum-size-subarray-sum/