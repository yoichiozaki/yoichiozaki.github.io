---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Missing Number"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-06-06T15:58:55+09:00
lastmod: 2021-06-06T15:58:55+09:00
featured: false
draft: false


---

## Missing Number

- https://leetcode.com/problems/missing-number/

### 解法1

ソートして頭から順番に要素を見ていく．配列の整列で$O(n \log n)$かかる．

```python
class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        nums.sort()

        if nums[-1] != len(nums):
            return len(nums)

        if nums[0] != 0:
            return 0

        for i in range(1, len(nums)):
            expected = nums[i-1] + 1
            if nums[i] != expected:
                return expected
```

### 解法2

`set`を使う．

```python
class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        s = set(nums)
        n = len(nums) + 1
        for i in range(n):
            if i not in s:
                return i
```

### 解法3

配列の要素の集合と配列の添字の集合の`xor`を考えるとかっこよく解ける．

```python
class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        missing = len(nums)
        for idx, num in enumerate(nums):
            missing ^= idx ^ num
        return missing
```

### 解法4

配列の要素の和を考えると抜けてる要素分だけ不足する．

```python
class Solution:
    def missingNumber(self, nums: List[int]) -> int:
        n = len(nums)
        allsum = (n * (n + 1)) // 2
        return allsum - sum(nums)
```