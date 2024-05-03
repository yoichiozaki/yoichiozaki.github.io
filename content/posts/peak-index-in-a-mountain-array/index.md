---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Peak Index in a Mountain Array"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-10T14:08:57+09:00
lastmod: 2022-03-10T14:08:57+09:00
featured: false
draft: false


---

## 問題

大小関係がある位置を境に逆転する整数配列が与えられる．ピークとなる要素を求めよ．

## 解法

めぐる式二分探索に落とし込む．

```python
# めぐる式二分探索
def binary_search(arr):
    def is_ok(mid):
        return True # 条件を満たしているか判定してbool値を返す

    ng = XXX # 絶対に条件を満たさないインデックス
    ok = YYY # 絶対に条件を満たすインデックス
    while 1 < abs(ng - ok):
        mid = (ok + ng) >> 1
        if is_ok(mid):
            ok = mid
        else:
            ng = mid
    return ok
```

ある位置以降で成否が一貫する条件を`is_ok(mid)`で書けると簡単に解ける．今回の問題では，頂点となる位置以降で降順になるので条件は

- `arr[mid] < arr[mid+1]`

なお，`mid+1`がオーバーフローしないようにそこだけ条件分岐しておくことに注意．

```python
class Solution:
    def peakIndexInMountainArray(self, arr: List[int]) -> int:
        def is_ok(mid):
            if mid == len(arr) - 1:
                return True
            return arr[mid] > arr[mid + 1]
        ng = -1
        ok = len(arr)
        while 1 < abs(ng - ok):
            mid = (ng + ok) >> 1
            if is_ok(mid):
                ok = mid
            else:
                ng = mid
        return ok
```

## 出典

- https://leetcode.com/problems/peak-index-in-a-mountain-array/