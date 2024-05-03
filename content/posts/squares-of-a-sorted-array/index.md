---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Squares of a Sorted Array"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-07-05T18:47:49+09:00
lastmod: 2021-07-05T18:47:49+09:00
featured: false
draft: false


---

## 問題

昇順にソートされた整数配列`nums`が与えられる．各要素の二乗からなる昇順の整数配列を求めよ

## 答え

- $O(n \log n)$な答え
  - `abs`を基準に`nums`をソートして二乗

```python
class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        nums = sorted(nums, key=lambda x: abs(x))
        return list(map(lambda x: x**2, nums))
```

- $O(n)$な答え
  - `left`/`right`ポインタと`deque`を使う
    - `deque`：両端への要素の追加が$O(1)$なデータ構造
  - **【格言】「昇順」を見たらbinary searchかtwo pointer**

```python
class Solution:
    def sortedSquares(self, nums: List[int]) -> List[int]:
        ans = collections.deque()
        l, r = 0, len(nums) - 1
        while l <= r:
            left, right = abs(nums[l]), abs(nums[r])
            if right < left:
                ans.appendleft(left ** 2)
                l += 1
            else:
                ans.appendleft(right ** 2)
                r -= 1
        return list(ans)
```