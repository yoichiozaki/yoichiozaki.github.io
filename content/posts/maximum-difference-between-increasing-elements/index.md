---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Maximum Difference Between Increasing Elements"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-10-24T15:51:26+09:00
lastmod: 2021-10-24T15:51:26+09:00
featured: false
draft: false


---

## 問題

整数配列`nums`が与えられる．ここで，次に挙げる条件を満たすような2要素の差の最大値（`nums[j] - nums[i]`）を求めよ．存在しなければ`-1`を返せ．

- `0 <= i < j < len(nums)`
- `nums[i] < nums[j]`

## 解法1

`(i, j)`の組み合わせを前通り調べ上げると$O(n^2)$．

## 解法2

`nums`を左から舐めながら，`min_sofar`でその位置までの最小値を保存しておけば$O(n)$で求めたい答えが求まる．

```python
class Solution:
    def maximumDifference(self, nums: List[int]) -> int:
        ans = -1
        min_sofar = float("inf")
        for num in nums:
            min_sofar = min(min_sofar, num)
            if min_sofar < num:
                ans = max(ans, num - min_sofar)
        return ans
```

## 解法3

Functionalに考える．

```
nums:      [7, 1, 5, 4]
min_sofar: [7, 1, 1, 1]
diff:      [0, 0, 4, 3] # element-wise diff
```

`diff`の`max`が答え．ただ，`nums = [9, 4, 3, 2]`のような場合は返すべきは`-1`なのでその処理のために`diff`の`0`を弾いてから`-1`を追加した上で`max`を取ると良い

```python
class Solution:
    def maximumDifference(self, nums: List[int]) -> int:
        import itertools
        min_scan = itertools.accumulate(
            nums,
            min,
            initial=float("+inf")
        )

        min_scan = list(min_scan)[1:]

        zipped = zip(nums, min_scan)

        mapped = map(lambda _: _[0] - _[1], zipped)

        filtered = filter(lambda _: _ != 0, mapped)

        import functools
        fold_left = lambda func, acc, xs: functools.reduce(func, xs, acc)
        ans = fold_left(max, -1, filtered)
        return ans
```

## ref

- https://leetcode.com/problems/maximum-difference-between-increasing-elements/