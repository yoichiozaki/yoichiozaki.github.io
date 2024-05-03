---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Two Sum"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-19T15:10:20+09:00
lastmod: 2022-03-19T15:10:20+09:00
featured: false
draft: false


---

## 問題

整数配列`nums`と整数`target`が与えられる．`nums`内の2つの要素の和が`target`となるような要素の位置を返せ．

## 解法

まずはバカ正直に全探索することを考えると，$O(n^2)$．

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
```

`nums[i] + nums[j] = target`という条件式は`nums[i]`を決めてしまえば`nums[j]`は勝手に決まるので，自由度は1変数分しかないので，相方をメモしておく方法で$O(n)$になる．

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        memo = dict()
        for idx, num in enumerate(nums):
            remain = target - num
            if remain in memo:
                return [idx, memo[remain]]
            memo[num] = idx
```

2-Sum問題は$N$-Sum問題の基本問題として使える．つまり，$N$-Sum問題を分解していくと2-Sumに還元できる．

## 出典

- https://leetcode.com/problems/two-sum/

## 参考

- https://zakimal.github.io/ja/post/n-sum-problems/
  - $N$-Sum問題をまとめた記事