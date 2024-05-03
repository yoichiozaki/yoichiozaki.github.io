---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find Target Indices After Sorting Array"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-10T17:23:09+09:00
lastmod: 2022-02-10T17:23:09+09:00
featured: false
draft: false


---

## 問題

配列`nums`と整数`target`が与えられる．`nums`を昇順に整列したときに`nums[i] == target`を満たすインデックス`i`をすべて求めよ．

```
nums = [1, 2, 5, 2, 3], target = 2
-> sorted nums = [1, 2, 2, 3, 5] -> ans = [1, 2]
```

## 解法1

言われたとおりにソートしてから位置を探す．ソートに時間がかかって$O(n \log n)$

```python
class Solution:
    def targetIndices(self, nums: List[int], target: int) -> List[int]:
        nums.sort()
        ans = []
        for i, num in enumerate(nums):
            if num == target:
                ans.append(i)
        return ans
```

## 解法2

整列後の配列に置いて，`target`と等しい要素の位置を決定するのに，`target`より大きい要素が整列されている必要はない．「`target`より小さい値が何個あるのか」と「`target`と等しい値が何個あるのか」で答えは求まる．

`nums`を端から一舐めすれば十分で$O(n)$

```python
class Solution:
    def targetIndices(self, nums: List[int], target: int) -> List[int]:
        cnt = 0
        less = 0
        for num in nums:
            if num == target:
                cnt += 1
            elif num < target:
                less += 1
        ans = []
        for i in range(cnt):
            ans.append(less + i)
        return ans
```

## 出典

- https://leetcode.com/problems/find-target-indices-after-sorting-array/