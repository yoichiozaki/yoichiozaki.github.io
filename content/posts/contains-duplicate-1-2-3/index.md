---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Contains Duplicate"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-02T16:49:38+09:00
lastmod: 2022-02-02T16:49:38+09:00
featured: false
draft: false
---

## contain duplicate 1

整数配列`nums`が与えられる．2個以上同じ要素が`nums`に含まれるかを判定せよ．

```
nums = [1, 2, 3, 1] -> True
nums = [1, 2, 3, 4] -> False
```

### 答え

- ソートして前から見ていく．
- 時間計算量$O(n)$

```python
class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        nums.sort()
        for i in range(len(nums) - 1):
            if nums[i] == nums[i+1]:
                return True
        return False
```

## contain duplicate 2

整数配列`nums`，整数`k`が与えられる．異なるインデックス`i`，`j`について，

- `nums[i] == nums[j]`かつ`abs(i - j) <= k`

を満たすような`(i, j)`が存在するか判定せよ．

```
nums = [1, 2, 3, 1],       k = 3 -> True (i = 0, j = 3)
nums = [1, 2, 3, 1, 2, 3], k = 2 -> False
```

### $O(n^2)$な答え

- `(i, j)`の組み合わせを全通り調べる

```python
# TLE: O(n^2)
class Solution:
    def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] == nums[j] and j - i <= k:
                    return True
        return False
```

### $O(n)$な答え

- 最後に`num`となる位置`i`を覚えておけば判定可能

```python
class Solution:
    def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:
        memo = dict() # {num: idx}
        for i, num in enumerate(nums):
            if num in memo:
                if i - memo[num] <= k:
                    return True
            memo[num] = i
        return False
```

## contain duplicate 3

整数配列`nums`，整数`k`，`t`が与えられる．異なるインデックス`i`，`j`について，

- `abs(nums[i] - nums[j]) <= t`かつ`abs(i - j) <= k`

を満たすような`(i, j)`が存在するか判定せよ．

```
nums = [1, 2, 3, 1],       k = 3, t = 0 -> True (i = 0, j = 3)
nums = [1, 5, 9, 1, 5, 9], k = 2, t = 3 -> False
```

### $O(n^2)$な答え

- `(i, j)`の組み合わせを全通り調べる

```python
# TLE: O(n^2)
class Solution:
    def containsNearbyAlmostDuplicate(self, nums: List[int], k: int, t: int) -> bool:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if abs(nums[i] - nums[j]) <= t and abs(i - j) <= k:
                    return True
        return False
```

### $O(n)$な答え

- やや難しい
- バケットソートから発想
- （雑に言うと）`nums`の数字を`MIN_NUM (= -2^31)`からの距離で取り直した上で，幅`t`でバケツを用意すると，同じバケツに属する数字は差が`t`以内

```python
class Solution:
    def containsNearbyAlmostDuplicate(self, nums: List[int], k: int, t: int) -> bool:
        if k < 1 or t < 0:
            return False

        buckets = dict()  # {remapped num: original num}
        MIN_NUM = -(1 << 31)
        for i, num in enumerate(nums):
            remapped = num - MIN_NUM
            bucket = remapped // (t + 1)

            if bucket in buckets or (bucket + 1 in buckets and buckets[bucket + 1] - remapped <= t) or (bucket - 1 in buckets and remapped - buckets[bucket - 1] <= t):
                return True

            if len(buckets) >= k:  # 位置が遠すぎる数字のbucketは不要なのでで消す
                last_bucket = (nums[i - k] - MIN_NUM) // (t + 1)
                del buckets[last_bucket]
            buckets[bucket] = remapped

        return False
```
