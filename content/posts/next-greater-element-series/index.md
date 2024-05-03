---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Next Greater Element Series"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-10-24T17:05:02+09:00
lastmod: 2021-10-24T17:05:02+09:00
featured: false
draft: false


---

## 問題1

整数配列`nums1`，`nums2`が与えられる．`nums1`は`nums2`の部分配列である．`nums2`には同じ整数が複数回登場することがないことが保証されている．ここで整数配列`nums`の各要素`nums[i]`に対して「次に大きい値」を次のように定める．

- `nums[i+1:]`で最初に`nums[i]`より大きい値

`nums1`に含まれる要素について，`nums2`における各要素の「次に大きい値」を求めよ．

```
nums1 = [4, 1, 2]
nums2 = [1, 3, 4, 2]

-> ans = [-1, 3, -1]
nums1[0] (= 4) ... nums2における「4の次に大きい値」は存在しないので -1
nums1[1] (= 1) ... nums2における「1の次に大きい値」は 3 (= nums2[1])
nums1[2] (= 2) ... nums2における「2の次に大きい値」は存在しないので -1
```

## 答え

### Blute-Force

`nums1`の各要素について，毎回「次に大きい値」を$O(n)$で計算する．全体としては時間計算量が$O(n^2)$

```python
class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        ans = []
        for num in nums1: # O(n)
            idx = nums2.index(num)
            next_greater = -1
            for candidate in nums2[idx+1:]: # O(n)
                if num < candidate:
                    next_greater = candidate
                    break
            ans.append(next_greater)
        return ans
```

### stackを使う

「`nums2[i]`の次に大きい値」候補は，確かに`nums2[i+1:]`に含まれるがこれは無駄が多い．

「`nums2[i]`の次に大きい値」の候補は「`nums2[i+1]`の次に大きい値，`nums2[i+2]`の次に大きい値...」である．

これはつまり，`nums2[i]`の次に大きい値を求める問題が`nums2[i+j]`(`j = 1, 2, ...`)という部分問題の貝を使って解けるということになる．

```
[..., 5, 2, 1, 6]
      ^
5の次に大きい値 = max(2の次に大きい値, 1の次に大きい値, 6の次に大きい値)
```

これをstackで実装する．

```python
class Solution:
    def nextGreaterElement(self, nums1: List[int], nums2: List[int]) -> List[int]:
        next_greater = dict() # nums2は重複要素が存在しないことが保証されている
        for num in nums2:
            next_greater[num] = -1

        stack = []
        for i in range(len(nums2)-1, -1, -1): # 後ろから部分問題を解いていく
            while len(stack) != 0 and stack[-1] <= nums2[i]: # nums2[i]以下の答え候補は答えになりえない
                stack.pop()
            if len(stack) != 0:
                next_greater[nums2[i]] = stack[-1]
            stack.append(nums2[i])

        ans = [next_greater[num] for num in nums1]
        return ans
```

## 問題2

整数を要素とする循環配列`nums`が与えられる．なお`nums[-1]`の次の要素は`nums[0]`であるとする．

ここで整数配列`nums`の各要素`nums[i]`に対して「次に大きい値」を次のように定める．

- `nums[i+1:]`で最初に`nums[i]`より大きい値

循環配列`nums`の各要素について「次に大きい値」を求めよ．

## 答え

### Blute-Force

循環配列は元の配列の2倍の長さにコピーしておけば普通の配列として扱える．あとは真面目に各要素について次に大きい値を$O(n)$で計算すればいい．全体としては$O(n^2)$．

```python
class Solution:
    def nextGreaterElements(self, nums: List[int]) -> List[int]:
        ret = [-1 for _ in range(len(nums))]
        doubled = nums + nums
        for i in range(len(nums)): # O(n)
            for j in range(i + 1, i + len(nums)): # O(n)
                if nums[i] < doubled[j]:
                    ret[i] = doubled[j]
                    break
        return ret
```

`nums`の長さの剰余で実装してもいい．

```python
class Solution:
    def nextGreaterElements(self, nums: List[int]) -> List[int]:
        ret = [-1 for _ in range(len(nums))]
        for i in range(len(nums)): # O(n)
            for j in range(1, len(nums)): # O(n)
                if nums[i] < nums[(i + j) % len(nums)]:
                    ret[i] = nums[(i + j) % len(nums)]
                    break
        return ret
```

### stackを使う

問題1と同じ発想．ただし循環配列なので2回配列を舐める必要がある．

```python
class Solution:
    def nextGreaterElements(self, nums: List[int]) -> List[int]:
        ret = [-1 for _ in range(len(nums))]
        filled = [False for _ in range(len(nums))]
        stack = []  # nums[i]の次に大きい値の候補（nums[i+?]の次に大きい値）をメモ

        for i in range(len(nums) - 1, -1, -1):  # 後ろからループ
            while len(stack) != 0 and stack[-1] <= nums[i]:
                stack.pop()  # nums[i]以下なのでstack[-1]は答えにならない
            if len(stack) != 0:
                ret[i] = stack[-1]
                filled[i] = True
            stack.append(nums[i])  # nums[i]はnums[i-1]以降の「次に大きい値」の候補

        # サイクルになっているので2周しておけば十分
        for i in range(len(nums) - 1, -1, -1):
            if not filled[i]:
                while len(stack) != 0 and stack[-1] <= nums[i]:
                    stack.pop()
                if len(stack) != 0:
                    ret[i] = stack[-1]
                    filled[i] = True

        return ret
```

## 問題3

整数`x`が与えられる．`x`と各桁の数字の集合が同じで`x`の次に大きい整数を求めよ．存在しなければ`-1`を返せ．

## 答え

小さい桁から見ていく．小さい桁に向かって降順になっている部分を調べて，降順が崩れる箇所を特定する．降順になっている桁のうち，降順が崩れる桁の数字の次に大きい数字を交換して昇順に並べる．

```python
class Solution:
    def nextGreaterElement(self, n: int) -> int:
        digits = list(str(n))
        i = len(digits) - 1

        # 降順になっている部分を探す
        while 0 <= i - 1 and digits[i-1] >= digits[i]:
            i -= 1

        if i == 0: # 全部降順 -> 次に大きい値は存在しない
            return -1

        j = i
        while j < len(digits) - 1 and digits[i-1] < digits[j+1]:
            j += 1

        digits[i-1], digits[j] = digits[j], digits[i-1]
        digits[i:] = digits[i:][::-1]
        ret = int("".join(digits))

        return ret if ret < 1 << 31 else -1
```

## 問題4

`i`日の気温が`temperatures[i]`に記載されているような整数配列`temperatures`が与えられる．各日付に対して，その日より暖かい日が何日後似合ったのかを計算せよ．

## 答え

「次に大きい値」系の問題そのもの．

```python
class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        ans = [0 for _ in range(len(temperatures))]
        stack = []
        for i in range(len(temperatures)-1, -1, -1):
            while len(stack) != 0 and stack[-1][0] <= temperatures[i]:
                stack.pop()
            if len(stack) != 0:
                ans[i] = stack[-1][1] - i
            stack.append((temperatures[i], i))
        return ans
```

## refs

- https://leetcode.com/problems/next-greater-element-i/
- https://leetcode.com/problems/next-greater-element-ii/
- https://leetcode.com/problems/next-greater-element-iii/