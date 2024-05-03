---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Product of Array Expect Self"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-07-08T15:11:58+09:00
lastmod: 2021-07-08T15:11:58+09:00
featured: false
draft: false


---

## 問題

整数配列`nums`がが与えられる．そこで，$i$番目の要素が`nums`の$i$番目以外の要素の積からなる配列`answer`を返す関数を書け．

## 答え

`answer[i]`を定義どおりに計算すると全体で$O(n^2)$．これを回避したい．`answer[i]`と`answer[i+1]`のそれぞれの因数は共通している部分が多いので，無駄な計算をしていそう．そこで累積積（累積和からの造語）を考えてみるとうまくいきそう．

```python
class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        p = 1
        n = len(nums)
        output = []
        for i in range(n):
            output.append(p)
            p = p * nums[i]
        p = 1
        for i in range(n-1, -1, -1):
            output[i] = output[i] * p
            p = p * nums[i]
        return output
```