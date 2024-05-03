---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find the Duplicate Number"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-06-06T16:25:24+09:00
lastmod: 2021-06-06T16:25:24+09:00
featured: false
draft: false


---

## Find the Duplicate Number

- https://leetcode.com/problems/find-the-duplicate-number/

### 解法1

配列をソートして前から順番に要素を見ていく．同じ要素が隣り合っていたらそれを返す．ソートに$O(n \log n)$かかる．

```python
class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        nums.sort()
        for i in range(1, len(nums)):
            if nums[i-1] == nums[i]:
                return nums[i]
```

### 解法2

`set`を使って見たことある要素をメモしておく．時間計算量$O(n)$，空間計算量$O(n)$．

```python
class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        seen = set()
        for num in nums:
            if num in seen:
                return num
            seen.add(num)
```

### 解法3

`nums`の要素を`nums`上のインデックスだと考えると，配列で連結リストを作ったことになる．このとき，ダブった要素の位置で連結リストがループを作ることになるのでそれを検出する．

足の速いうさぎ🐰と足の遅い亀🐢を走らせるという有名テクニックがある．

配列の要素を一度は見ることになるので時間計算量$O(n)$．一方でポインタを追いかけるだけなので空間計算量は`nums`のサイズに依存せず$O(1)$．

```python
class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        faster = nums[0]
        slower = nums[0]

        while True:
            faster = nums[nums[faster]]
            slower = nums[slower]
            if faster == slower:
                break

        slower = nums[0]
        while slower != faster:
            faster = nums[faster]
            slower = nums[slower]

        return slower
```