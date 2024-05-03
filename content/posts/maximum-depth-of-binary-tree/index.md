---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Maximum Depth of Binary Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-18T16:04:42+09:00
lastmod: 2022-03-18T16:04:42+09:00
featured: false
draft: false


---

## 問題

次のように定義される二分木が与えられたとき，その木の深さの最大値（根から葉までの距離の最大値）を求めよ．

```python
# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

## 解法

求める深さの最大値は`1 + max(左部分木の深さの最大値, 右部分木の深さの最大値)`．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if root is None:
            return 0
        left_depth = self.maxDepth(root.left)
        right_depth = self.maxDepth(root.right)
        return max(left_depth, right_depth) + 1
```

## 出典

- https://leetcode.com/problems/maximum-depth-of-binary-tree/submissions/