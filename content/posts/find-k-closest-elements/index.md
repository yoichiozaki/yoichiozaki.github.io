---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find $K$ Closest Elements"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-08-31T20:20:51+09:00
lastmod: 2021-08-31T20:20:51+09:00
featured: false
draft: false
---

## 問題

**昇順に**ソートされた整数配列`arr`と整数`k`，`x`が与えられる．`arr`内の`x`に「近い」`k`個の整数を照準に格納した配列を返す関数を書け．

ここで「整数`a`が整数`b`より整数`x`に近い」とは，「`|a - x| < |b - x|`」もしくは「`|a - x| == |b - x|`かつ`a < b`」となることを意味する．

## 解法1

- 言われたとおりにソートして冒頭`k`個を返す．
- 時間計算量：$O(n \log n + k \log k)$
  - $n$：`arr`の長さ，$k$：与えられた整数`k`（以下も同様）
- 空間計算量：$O(1)$

```python
class Solution:
    def findClosestElements(self, arr: List[int], k: int, x: int) -> List[int]:
        arr = sorted(arr, key=lambda a: abs(a - x))
        arr = arr[:k]
        arr = sorted(arr)
        return arr
```

## 解法2

- 配列がソートされているので，求める答えは`arr`の長さ`k`の部分配列になる
- いわゆる2 pointersというテクニック（？）
  - `left`，`right`をそれぞれ左端，右端から詰めていく
- 時間計算量：$O(n - k)$
  - ポインタの移動回数分
- 空間計算量：$O(1)$

```python
class Solution:
    def findClosestElements(self, arr: List[int], k: int, x: int) -> List[int]:
        left = 0
        right = len(arr) - 1
        while k <= right - left:
            if x - arr[left] <= arr[right] - x:
                right -= 1  # rightのほうがxから遠い
            else:
                left += 1
        return arr[left:right+1]
```

## 解法3

- 答えとなる部分配列の右端の整数は`x`以上の値なはずなので，`right`の位置をそこから始めても構わない！
  - `right`の初期値を「`arr`内で初めて`x`以上になる最小の位置」から初めて良い
- 領域を広げていく方向で答えを求める
- 時間計算量：$O(log n + k)$
- 空間計算量：$O(1)$

```python
class Solution:
    def findClosestElements(self, arr: List[int], k: int, x: int) -> List[int]:
        right = bisect_left(arr, x) # rightの初期位置
        left = right - 1
        while 0 < k:
            if len(arr) <= right or (0 <= left and x - arr[left] <= arr[right] - x):
                left -= 1 # leftの方がxに近いので左に伸ばす
            else:
                right += 1
            k -= 1
        return arr[left + 1:right]
```

## 解法4

- 解法3を改良する
- `right`の初期値は`arr[0:len(arr) - k]`のどこか
  - `right`の初期値を決定するときの無駄な計算が減る
- 時間計算量：$O(log (n - k) + k)$
- 空間計算量：$O(1)$

```python
class Solution:
    def findClosestElements(self, arr: List[int], k: int, x: int) -> List[int]:
        right = bisect_left(arr[0:len(arr) - k], x)
        left = right - 1
        while 0 < k:
            if len(arr) <= right or (0 <= left and x - arr[left] <= arr[right] - x):
                left -= 1
            else:
                right += 1
            k -= 1
        return arr[left + 1:right]
```

## ref

https://leetcode.com/problems/find-k-closest-elements/