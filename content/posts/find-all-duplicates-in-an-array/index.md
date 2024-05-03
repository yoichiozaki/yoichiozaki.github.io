---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find All Duplicates in an Array"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-26T23:09:48+09:00
lastmod: 2022-03-26T23:09:48+09:00
featured: false
draft: false
---

## 問題

長さ$n$の整数配列`nums`が与えられる．`nums`に含まれる整数は$1$以上$n$以下であり，各整数は1回もしくは2回のみ含まれる．`nums`から2回登場する整数をすべて見つけるアルゴリズムを書け．ただし，そのアルゴリズムは時間計算量$O(n)$，空間計算量$O(1)$であるようなものにしなさい．

## 解法

空間計算量が$O(1)$というのが厳しい．それがなければ`map`で各整数が何個あるかをカウントしてしまえばいい．配列中の重複を効率よく見つけるテクとして**「配列をなめながら，観測した整数の符号を反転させることで観測済みであるという情報を残す」**というものがあるようだ．また，位置`i`にある数`nums[i]`は位置`nums[i]`へのポインタと見なす（一種のリスト）ことで，配列をなめていく過程で重複した整数が指し示す先の位置に再訪問することになるので，再訪問したことを格納された整数の符号で判断して答えを求める．


```python
class Solution:
    def findDuplicates(self, nums: List[int]) -> List[int]:
        ans = []
        for num in nums:
            if nums[abs(num) - 1] < 0: # 訪問済み
                ans.append(abs(num)) # numは符号が当てにならないので絶対値を取っておく
            else: # 未訪問
                nums[abs(num) - 1] *= -1 # 観測済みであることをメモ
        return ans
```

## 出典

- https://leetcode.com/problems/find-all-duplicates-in-an-array/