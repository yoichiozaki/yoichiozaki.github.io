---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Balanced Binary Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-17T18:50:04+09:00
lastmod: 2022-03-17T18:50:04+09:00
featured: false
draft: false
---

## 問題

次のように定義される二分木を考える．

```python
# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

ある二分木が与えられたときに，その二分木が平衡している（balanced）かを判定せよ．なお二分木が並行しているとは次を満たすことと定義する．

- 二分木に含まれるどの頂点を根としたときも，その左右の部分木の高さの差が1以下である

## 解法

木の高さは再帰的に計算できるので，それをすべての頂点で確認することで定義通りに判定することができる．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isBalanced(self, root: TreeNode) -> bool:
        if root is None:
            return True

        def height(root):
            if root is None:
                return 0
            left_height = height(root.left)
            right_height = height(root.right)
            return 1 + max(left_height, right_height)

        return abs(height(root.left) - height(root.right)) <= 1 and self.isBalanced(root.left) and self.isBalanced(root.right)
```

ある部分木で`height(root)`が$O(n)$回呼ばれるが，それを全頂点で行うことになって，全体としては$O(n^2)$の計算量がかかる．

平衡していない木を部分木として持つ木は平衡していないので，これをうまく返していけば全体の計算量を$O(n)$にできる．

下の実装では，`height(root)`で`root`を根とする部分木の左右の部分木の高さを計算するが，高さの差が1より大きい場合は`-1`を返すことでそれを表現している．`height(root)`の結果として`-1`が返った瞬間に無駄な計算をせず平衡していないことを返せる．

```python
# Time: O(n)
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isBalanced(self, root: TreeNode) -> bool:
        if root is None:
            return True

        def height(root):
            if root is None:
                return 0
            left_height = height(root.left)
            if left_height == -1:
                return -1
            right_height = height(root.right)
            if right_height == -1:
                return -1
            if abs(left_height - right_height) > 1:
                return -1
            return 1 + max(left_height, right_height)

        return height(root) != -1
```

## 出典

- https://leetcode.com/problems/balanced-binary-tree/