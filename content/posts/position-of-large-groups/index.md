---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Position of Large Groups"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-03T19:56:52+09:00
lastmod: 2022-02-03T19:56:52+09:00
featured: false
draft: false


---

## 問題

文字列`s`が与えられる．同種の文字が連続する部分のうち，長さが3以上の箇所をすべて取り出せ．

```
s = "abbxxxxzyy" -> [[3, 6]] ("xxxx")
```

## 解法

しゃくとり法．伸ばせるところまで`right`を伸ばして，条件を満たさなくなったら`left`を`right+1`まで一気に更新する．

```python
class Solution:
    def largeGroupPositions(self, s: str) -> List[List[int]]:
        ans = []
        if len(s) == 1:
            return ans
        left = 0
        for right in range(1, len(s)+1, 1):
            if right == len(s) or s[left] != s[right]:
                if right - left >= 3:
                    ans.append([left, right-1])
                left = right
        return ans
```

## 出典

- https://leetcode.com/problems/positions-of-large-groups/