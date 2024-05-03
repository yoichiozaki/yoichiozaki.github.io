---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Invert Binary Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-18T22:38:46+09:00
lastmod: 2022-03-18T22:38:46+09:00
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

二分木`root`が与えられたとき，どの左右の子供が入れ替えられた木を返せ．

```
   4          4
 2   7  ->  7   2
1 3 6 9    9 6 3 1
```

## 解法

DFSで頂点に訪問しながら左右を入れ替える．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if not root:
            return None
        left = self.invertTree(root.left)
        right = self.invertTree(root.right)
        root.left = right
        root.right = left
        return root
```

繰り返しで書くDFSは次の通り．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if root is None:
            return None
        suspended = [root]
        while len(suspended) != 0:
            node = suspended.pop()
            node.left, node.right = node.right, node.left
            if node.left is not None:
                suspended.append(node.left)
            if node.right is not None:
                suspended.append(node.right)
        return root
```

`suspended`から取り出す順番を変えればBFSに早変わり．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:
        if root is None:
            return None
        suspended = [root]
        while len(suspended) != 0:
            node = suspended.pop(0)
            node.left, node.right = node.right, node.left
            if node.left is not None:
                suspended.append(node.left)
            if node.right is not None:
                suspended.append(node.right)
        return root
```

## 出典

- https://leetcode.com/problems/invert-binary-tree/