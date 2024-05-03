---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "$2$-Sum, $3$-Sum, ..., $N$-Sum Problems"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-30T18:03:45+09:00
lastmod: 2021-03-30T18:03:45+09:00
featured: false
draft: false


---

整数を要素として格納する配列が与えられ，そこから$N$個要素を取り上げてその和が$X$になるような要素のとり方はいくつあるか，要素のとり方そのものを返せ，という系統の問題についてお勉強したのでまとめる．

## $2$-Sum

与えられた配列`nums`から要素を 2 つ取り出して，その和が`target`と等しくなるような組み合わせを配列における位置のペアで返せ．

主なアプローチは 3 つありそう

- 「足して`target`になる相方」がいるかを管理しながら要素を舐める（$O(n)$）
- `nums`を昇順に整列して「足して`target`になる相方」を線形に探索（$O(n)$）
  - この方法だと与えられた配列に重複要素が含まれているときに対応しやすい？
- `nums`を昇順に整列して「足して`target`になる相方」を二分探索（$O(n \log n)$）

### 「足して`target`になる相方」がいるかを管理しながら要素を舐める

```python
nums = [2,7,11,15]
target = 9

def two_sum(nums, target):
    table = dict()
    for idx, num in enumerate(nums):
        remain = target - num
        if remain in table:
            return [idx, table[remain]]
        table[num] = idx

print(two_sum(nums, target)) # => [1, 0]
```

### `nums`を昇順に整列して「足して`target`になる相方」を線形に探索

```python
def two_sum(nums, target):
    nums.sort()
    left = 0
    right = len(nums) - 1
    while left < right:
        added = nums[left] + nums[right]
        if added == target:
            return [left, right]
        elif added < target:
            left += 1
        else: # target < added
            right -= 1
```

昇順になっているならば，「足し上げた結果が`target`より小さいときは片方を大きくすればいいし，`target`を超えちゃったときは片方を小さくすれば良い」という操作をインデックスの隣への移動で実現できる．

また，要素の重複があるような配列を渡されたときに重複要素を無視する操作もインデックスの移動でできる．

### `nums`を昇順に整列して「足して`target`になる相方」を二分探索

昇順になっていれば相方を二分探索で探すこともできる．

```python
nums = [2,7,11,15]
target = 9

def two_sum(nums, target):
    nums.sort()

    def binary_search(nums, target):
        ng = -1
        ok = len(nums)
        def is_ok(mid):
            return target <= nums[mid]
        while 1 < abs(ng - ok):
            mid = (ng + ok) // 2
            if is_ok(mid):
                ok = mid
            else:
                ng = mid
        return ok

    for idx, num in enumerate(nums):
        remain = target - num
        remain_idx = binary_search(nums, remain)
        if num + nums[remain_idx] == target:
            return [idx, remain_idx]

print(two_sum(nums, target)) # => [0, 1]
```

## $3$-Sum

与えられた配列`nums`から要素を 3 つ取り出して，その和が`target`と等しくなるような組み合わせを配列における位置のペアで返せ．

これは，`nums[i] + nums[j] + nums[k] == target`とすると，`nums[i] + nums[j] == target - nums[k]`という，「毎回`target`の変わる$2$-Sum」と見て解くことができる．

なんと Wikipedia に[記事](https://en.wikipedia.org/wiki/3SUM)もある．

## 参考問題

### [Two Sum](https://leetcode.com/problems/two-sum/)

これは相方をメモしておく解法

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        table = dict()
        for idx, num in enumerate(nums):
            remain = target - num
            if remain in table:
                return [idx, table[remain]]
            table[num] = idx
```

### [Two Sum II - Input array is sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

相方をメモしておく解法

```python
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        table = dict()
        for idx, num in enumerate(numbers):
            remain = target - num
            if remain in table:
                return [idx + 1, table[remain] + 1] if idx < table[remain] else [table[remain] + 1, idx + 1]
            table[num] = idx
```

昇順に並んでいることを利用して相方を探す解法

```python
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        left = 0
        right = len(numbers) - 1
        while left < right:
            added = numbers[left] + numbers[right]
            if added == target:
                return [left + 1, right + 1]
            elif added < target:
                left += 1
            else: # target < added
                right -= 1
```

### [Two Sum III - Data structure design](https://leetcode.com/problems/two-sum-iii-data-structure-design/)

Not Yet.

### [Two Sum IV - Input is a BST](https://leetcode.com/problems/two-sum-iv-input-is-a-bst/)

二分探索木を DFS しながら相方をメモする解法

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def findTarget(self, root: TreeNode, k: int) -> bool:
        if root is None:
            return False
        seen = set()
        suspended = [root]
        while len(suspended) != 0:
            u = suspended.pop()
            if k - u.val in seen:
                return True
            seen.add(u.val)
            if u.left is not None:
                suspended.append(u.left)
            if u.right is not None:
                suspended.append(u.right)
        return False
```

再帰で二分探索木を DFS しながら相方をメモする解法

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def findTarget(self, root: TreeNode, k: int) -> bool:
        seen = set()
        def DFS(root):
            if root is None:
                return False
            if k - root.val in seen:
                return True
            seen.add(root.val)
            return DFS(root.left) or DFS(root.right)
        return DFS(root)
```

BFS で二分探索木を BFS しながら相方をメモする解法

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def findTarget(self, root: TreeNode, k: int) -> bool:
        if root is None:
            return False
        seen = set()
        suspended = [root]
        while len(suspended) != 0:
            u = suspended.pop(0)
            if k - u.val in seen:
                return True
            seen.add(u.val)
            if u.left is not None:
                suspended.append(u.left)
            if u.right is not None:
                suspended.append(u.right)
        return False
```

二分探索木を間順走査すると昇順にソートされた配列が計算できるので，配列に対する$2$-Sum 問題に帰着して解く解法

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def findTarget(self, root: TreeNode, k: int) -> bool:
        if root is None:
            return False
        inordered = []
        def inorder(root):
            if root is None:
                return
            if root.left is not None:
                inorder(root.left)
            inordered.append(root.val)
            if root.right is not None:
                inorder(root.right)
        inorder(root)

        left = 0
        right = len(inordered) - 1
        while left < right:
            added = inordered[left] + inordered[right]
            if added == k:
                return True
            elif added < k:
                left += 1
            else:
                right -= 1
        return False
```

### [Two Sum BSTs](https://leetcode.com/problems/two-sum-bsts/)

2 つの二分探索木が与えられたときの$2$-Sum 問題．二分探索木では`root.left.val < root.val < root.right.val`が成立するのである意味「整列している」とも言える．

```python
def two_sum_bsts(root1, root2, target):
    if root2 is None:
        return False
    return helper(root1, root2.val, target) or two_sum_bsts(root1, root2.left, target) or two_sum_bsts(root1, root2.right, target)

def helper(root1, root2_val, target):
    if root1 is None:
        return False
    added = root1.val + root2_val
    if added == target:
        return True
    elif added < target:
        return helper(root1.right, root2_val, target)
    else: # target < added
        return helper(root1.left, root2_val, target)
```

### [Two Sum Less Than K](https://leetcode.com/problems/two-sum-less-than-k/)

配列が与えられて，その中から和が$K$を超えない範囲で最も大きくなるように重複を許さずに 2 つ要素を選んだときの，その和を計算せよ．

```python
nums = [34, 23, 1, 24, 75, 33, 54, 8]
K = 60

def two_sum_less_than_k(nums, target):
    nums.sort()
    left = 0
    right = len(nums) - 1
    ans = -1
    while left < right:
        added = nums[left] + nums[right]
        if added < target:
            ans = max(ans, added)
            left += 1
        else:
            right -= 1
    return ans

print(two_sum_less_than_k(nums, K)) # => 58
```

### [3Sum](https://leetcode.com/problems/3sum/)

全体としては$O(n^2)$

```python
class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        ret = []
        nums.sort()
        for i in range(len(nums) - 2):
            if 1 <= i and nums[i - 1] == nums[i]:
                continue # skip same num
            left = i + 1 # target = nums[i]
            right = len(nums) - 1
            while left < right:
                added = nums[i] + nums[left] + nums[right]
                if added == 0:
                    ret.append([nums[i], nums[left], nums[right]])
                    while left < right and nums[left] == nums[left + 1]: # skip same num
                        left += 1
                    while left < right and nums[right] == nums[right - 1]: # skip same num
                        right -= 1
                    left += 1
                    right -= 1
                elif added < 0:
                    left += 1
                else: # 0 < added
                    right -= 1
        return ret
```

### [3Sum Closest](https://leetcode.com/problems/3sum-closest/)

```python
class Solution:
    def threeSumClosest(self, nums: List[int], target: int) -> int:
        diff = float("inf")
        nums.sort()
        for i in range(len(nums) - 2):
            left = i + 1
            right = len(nums) - 1
            while left < right:
                added = nums[i] + nums[left] + nums[right]
                if abs(target - added) < abs(diff):
                    diff = target - added
                if added < target:
                    left += 1
                else:
                    right -= 1
            if diff == 0:
                break
        return target - diff
```

### [3Sum Smaller](https://leetcode.com/problems/3sum-smaller/)

配列が与えられて，その中から和が$K$を超えない範囲で最も大きくなるように重複を許さずに 3 つ要素を選ぶときの数字の選び方の総数を求めよ．

```python
nums = [-2, 0, 1, 3]
target = 2

def two_sum_smaller(nums, target):
    def two_sum(nums, target):
        left = 0
        right = len(nums) - 1
        ans = 0
        while left < right:
            added = nums[left] + nums[right]
            if added < target:
                ans += (right - left)
                left += 1
            else:
                right -= 1
        return ans

    nums.sort()
    ans = 0
    for i in range(len(nums) - 2):
        ans += two_sum(nums[i + 1:], target - nums[i])
    return ans

print(two_sum_smaller(nums, target)) # => 2
```

### [4Sum](https://leetcode.com/problems/4sum/)

$3$-Sum と同様に考えれば$K$-Sum は$2$-Sum に帰着できる．

```python
class Solution:
    def fourSum(self, nums: List[int], target: int) -> List[List[int]]:

        def k_sum(nums, target, k):
            ret = []
            if len(nums) == 0 or target < nums[0] * k or nums[-1] * k < target:
                return ret
            if k == 2:
                return two_sum(nums, target)
            for i in range(len(nums)):
                if 1 <= i and nums[i - 1] == nums[i]:
                    continue
                for _ret in k_sum(nums[i + 1:], target - nums[i], k - 1):
                    ret.append([nums[i]] + _ret)
            return ret

        def two_sum(nums, target):
            ret = []
            left = 0
            right = len(nums) - 1
            while left < right:
                added = nums[left] + nums[right]
                if added == target:
                    ret.append([nums[left], nums[right]])
                    while left < right and nums[left] == nums[left + 1]:
                        left += 1
                    while left < right and nums[right - 1] == nums[right]:
                        right -= 1
                    left += 1
                    right -= 1
                elif added < target:
                    left += 1
                else:
                    right -= 1
            return ret


        nums.sort()
        return k_sum(nums, target, 4)
```

### [4Sum II](https://leetcode.com/problems/4sum-ii/)

（`A`，`B`）と（`C`，`D`）でそれぞれの組でありえる組み合わせをメモしておいて，違うに打ち消し合うやつがあればカウントする．

```python
class Solution:
    def fourSumCount(self, A: List[int], B: List[int], C: List[int], D: List[int]) -> int:
        ans = 0
        counter_AB = Counter()
        counter_CD = Counter()

        for (a, b) in product(A, B):
            counter_AB[a + b] += 1
        for (c, d) in product(C, D):
            counter_CD[c + d] += 1

        for sum_ab in counter_AB:
            if -sum_ab in counter_CD:
                ans += counter_AB[sum_ab] * counter_CD[-sum_ab]
        return ans
```

### [Max Number of K-Sum Pairs](https://leetcode.com/problems/max-number-of-k-sum-pairs/)

相方候補が何人いるかをカウントする．ダブルカウントに注意．

```python
class Solution:
    def maxOperations(self, nums: List[int], k: int) -> int:
        ans = 0
        cnt = Counter(nums)
        for num in cnt:
            ans += min(cnt[num], cnt[k - num])
        return ans // 2
```

### [Count Good Meals](https://leetcode.com/problems/count-good-meals/)

```python
class Solution:
    def countPairs(self, deliciousness: List[int]) -> int:
        MOD = 1_000_000_007
        ans = 0
        cnt = Counter(deliciousness)
        for item in cnt:
            for k in range(22):
                if item == 2 ** k - item:
                    ans += cnt[item] * (cnt[item] - 1)
                else:
                    ans += cnt[item] * cnt[2 ** k - item]
        return ans // 2 % MOD
```
