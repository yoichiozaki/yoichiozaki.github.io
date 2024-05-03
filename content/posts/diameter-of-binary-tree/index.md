---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Diameter of Binary Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-11T17:38:17+09:00
lastmod: 2022-03-11T17:38:17+09:00
featured: false
draft: false
---

## 問題

次のように定義される二分木を考える．

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

二分木の直径を計算せよ．

## 解法

二分木を根を中心に左右に引っ張るイメージをすると直径は左右の部分木の深さの和+1であることがわかる．木の深さは再帰関数で計算できる．

{{< figure src="diameter-of-binary-tree.png" title="二分木の直径は左右の深さの和+1" lightbox="true" >}}

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def diameterOfBinaryTree(self, root: Optional[TreeNode]) -> int:
        diameter = 0

        def depth(root):
            nonlocal diameter
            if root is None:
                return 0
            left_depth = depth(root.left)
            right_depth = depth(root.right)
            diameter = max(diameter, left_depth + right_depth)
            return 1 + max(left_depth, right_depth)
        depth(root)
        return diameter
```

## 出典

- https://leetcode.com/problems/diameter-of-binary-tree/