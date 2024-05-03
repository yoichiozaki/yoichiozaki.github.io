---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Single Number"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-02T17:21:03+09:00
lastmod: 2022-02-02T17:21:03+09:00
featured: false
draft: false


---

## 問題1

- 整数配列`nums`が与えられる．`nums`は1つのある整数$x$を除いてすべての整数が2個ずつ格納されている．$x$を求めよ．
- https://leetcode.com/problems/single-number/

## 答え

- `xor`演算を使う
  - 同じ整数同士の`xor`は`0`になることを利用する
  - `a ^ a == 0`
- `nums`を全部`xor`すれば1つしかない要素が残る

```python
class Solution:
    def singleNumber(self, nums: List[int]) -> int:
        ans = nums[0]
        for num in nums[1:]:
            ans ^= num
        return ans
```

## 問題2

- 整数配列`nums`が与えられる．`nums`は2つのある整数$x$，$y$を除いてすべての整数が2個ずつ格納されている．$x$，$y$を求めよ．
- https://leetcode.com/problems/single-number-iii/

## 答え1

- `set`を使う
- 時間計算量$O(n)$
- 空間計算量$O(n)$

```python
class Solution:
    def singleNumber(self, nums: List[int]) -> List[int]:
        s = set()
        for num in nums:
            if num in s:
                s.remove(num)
                continue
            s.add(num)
        return list(s)
```

## 答え2

- `xor`を使う
- 1つ目の問題と同じように考えると，`nums`の要素全部の`xor`を取った結果`P`は`x`と`y`の重ね合わせになっているので分解する必要がある
  - `xor`の特徴から，一方がわかれば良い
- `P`を2進数表記したときに`1`になっている桁に注目すると，そこに桁が立つということは，`x`，`y`のどっちかにもその位置の桁が立っていたはず（じゃないと`xor`した結果に残らない）

- 時間計算量$O(n)$
- 空間計算量$O(1)$

```python
class Solution:
    def singleNumber(self, nums: List[int]) -> List[int]:
        xor1, xor2, i = 0, 0, 0
        # 全部のxorを取る
        for num in nums:
            xor1 ^= num

        # 1が立ってる最下位桁を取る（ホントはどこの桁でもいい）
        for d in range(32):
            if xor1 & 1 << d:
                i = d
                break

        for num in nums:
            if num & 1 << i:
                xor2 ^= num

        return [xor1 ^ xor2, xor2]
```