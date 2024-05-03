---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sliding Window Maximum"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-10-09T21:56:14+09:00
lastmod: 2021-10-09T21:56:14+09:00
featured: false
draft: false


---

## 問題

整数配列`nums`と整数`k`が与えられる．幅`k`の窓を`nums`上で左から右へ動かしながら，その窓の中の最大値を計算して返せ．

例：

```
入力: nums = [1,3,-1,-3,5,3,6,7], k = 3
出力: [3,3,5,5,6,7]

window                     | max
---------------------------------
[1  3  -1] -3  5  3  6  7  | 3
 1 [3  -1  -3] 5  3  6  7  | 3
 1  3 [-1  -3  5] 3  6  7  | 5
 1  3  -1 [-3  5  3] 6  7  | 5
 1  3  -1  -3 [5  3  6] 7  | 6
 1  3  -1  -3  5 [3  6  7] | 7
```

## 答え

- 総当りでやるなら$O(nk)$

```python
class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        ans = []
        for i in range(0, len(nums) - k + 1):
            ans.append(max(nums[i:i+k]))
        return ans
```

- monotonic queueを使うと$O(n)$で計算できる．
  - monotonic queue：要素が単調（増加｜減少）なキュー
  - 作りながら使う感じ
    - `nums`の`i`番目までを`push()`して`max_num()`すると`max(nums[:i+1])`が$O(1)$で取れるイメージ
  - 正直まだ使い方・使い所は理解していない...

```python
class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        class MonoQueue:
            def __init__(self):
                self.queue = collections.deque() # queueは単調減少

            def push(self, val):
                leftside = 0 # numsにおいて，valの左側に何個の数字があるか．
                while len(self.queue) != 0 and self.queue[-1][0] < val:
                    leftside += self.queue[-1][1] + 1
                    self.queue.pop()
                self.queue.append([val, leftside])

            def max_num(self):
                return self.queue[0][0]

            def pop(self):
                if 0 < self.queue[0][1]:
                    self.queue[0][1] -= 1
                else:
                    self.queue.popleft()

        ans = []
        mq = MonoQueue()
        for i in range(0, k - 1):
            mq.push(nums[i])

        for i in range(k - 1, len(nums)):
            mq.push(nums[i])
            ans.append(mq.max_num())
            mq.pop()

        return ans
```

## Ref

- https://leetcode.com/problems/sliding-window-maximum/