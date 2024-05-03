---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sort Colors"
subtitle: "🇳🇱"
summary: ""
authors: []
tags: []
categories: []
date: 2021-10-03T14:54:54+09:00
lastmod: 2021-10-03T14:54:54+09:00
featured: false
draft: false


---

## 問題

`1`，`2`，`3` のみを要素として含む整数配列 `nums` が与えられる．`nums` を昇順に整列させるアルゴリズムを書きなさい．

## 答え

各要素が入るべき位置の末端を追跡しながら整列させる．

- `one`：整列後の `nums` に現れる連続する `1` のうちの右端の位置
- `two`：整列後の `nums` に現れる連続する `2` のうちの右端の位置
- `three`：整列後の `nums` に現れる連続する `3` のうちの右端の位置

```python
class Solution:
    def sortColors(self, nums: List[int]) -> None:
        """
        Do not return anything, modify nums in-place instead.
        """
        one = 0
        two = 0
        three = len(nums) - 1

        while two <= three:
            if nums[two] == 1:
                nums[one], nums[two] = nums[two], nums[one]
                one += 1
                two += 1
            elif nums[two] == 2:
                two += 1
            else:
                nums[two], nums[three] = nums[three], nums[two]
                three -= 1
```

計算量は`two`が`nums`を左端から右端まで動くループが回るので$O(n)$

一方で，`list.sort()`すればいいという話もある．この場合は実際に実行されるアルゴリズムに依存するが$O(n \log n)$．

## ref

- https://leetcode.com/problems/sort-colors/