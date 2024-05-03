---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Letter Case Permutation"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-31T00:01:38+09:00
lastmod: 2021-03-31T00:01:38+09:00
featured: false
draft: false


---

## 問題

アルファベットと数字で構成される文字列が与えられる．任意のアルファベットについて大文字小文字に変換できる．この変換によって得られるすべての文字列を計算せよ．

https://leetcode.com/problems/letter-case-permutation/

## 答え

DFS．

```python
class Solution:
    def letterCasePermutation(self, S: str) -> List[str]:
        ret = []
        def rec(pos, sofar):
            if pos == len(S):
                ret.append(sofar)
                return
            if S[pos].isalpha():
                rec(pos + 1, sofar + S[pos])
                rec(pos + 1, sofar + S[pos].swapcase())
            else:
                rec(pos + 1, sofar + S[pos])
        rec(0, "")
        return ret
```
