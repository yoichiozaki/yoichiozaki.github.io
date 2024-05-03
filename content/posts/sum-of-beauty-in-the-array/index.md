---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sum of Beauty in the Array"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-03T16:54:48+09:00
lastmod: 2022-02-03T16:54:48+09:00
featured: false
draft: false


---

## 問題

整数配列`nums`が与えられる．`nums[i]`の「綺麗さ」を次のように定める．

- `0 <= j < i`，`i < k <= nums.length - 1`を満たすすべての`j`，`k`について，`nums[j] < nums[i] < nums[k]`を満たすとき2点
- 上記を満たさないとき，`nums[i - 1] < nums[i] < nums[i + 1]`を満たすと1点
- さらに上記を満たさないとき，0点

すべての`i`について綺麗さの合計を求めよ．

```
nums = [1, 2, 3] -> ans = 2
nums = [2, 4, 6, 4] -> ans = 1
```

## 解法

1つ目の条件については，要するに「`max(nums[:i])< nums[i] < min(nums[i+1:])`」．このまま書いてしまうと$O(n^2)$になってしまう．`i`がちょっとずれただけで`i-1`までの最大値最小値の結果が無駄にならないように実装する．

一定方向の最大最小を事前に計算してく系の問題は結構ある．

- `max_on_left[i]`：`nums[:i]`の最大値
- `min_on_right[i]`：`nums[i+1:]`の最小値

```python
class Solution:
    def sumOfBeauties(self, nums: List[int]) -> int:
        N = len(nums)

        max_on_left = [None for _ in range(N)]
        x = float("-inf")
        for i in range(0, N, 1):
            max_on_left[i] = x
            x = max(x, nums[i])

        min_on_right = [None for _ in range(N)]
        x = float("+inf")
        for i in range(N-1, -1, -1):
            min_on_right[i] = x
            x = min(x, nums[i])

        score = 0
        for i in range(1, N-1, 1):
            if max_on_left[i] < nums[i] < min_on_right[i]:
                score += 2
            elif nums[i-1] < nums[i] < nums[i+1]:
                score += 1

        return score
```

## 出典

- https://leetcode.com/problems/sum-of-beauty-in-the-array/