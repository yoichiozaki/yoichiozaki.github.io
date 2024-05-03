---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Lowest Common Ancestor of a Binary Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-17T22:15:43+09:00
lastmod: 2022-03-17T22:15:43+09:00
featured: false
draft: false


---

## 問題

二分木`root`と木に含まれる2頂点`p`/`q`が与えられる．`p`と`q`の最小木共通先祖（Lowest Common Ancestor）を求めよ．

## 解法

`root`が「二分探索木」になっているなら話は簡単だが，今回は二分木．だからといってなにかが根本的に変わるわけではないが．

帰りがけ順でDFSしながら，`p`/`q`に遭遇したら遭遇した旨を親方向に持っていきながら戻っていくことでLCAを見つけられる．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None
class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        if root is None:
            return None

        def dfs(node):
            if node is None:
                return None
            if node.val == p.val or node.val == q.val:
                return node
            left = dfs(node.left)
            right = dfs(node.right)
            if left is not None and right is not None:
                return node # 左部分木でp/qを見かけた，かつ，右部分木でp/qを見かけた -> 今いる頂点はLCA
            return left or right

        return dfs(root)
```

もしくは「一度DFSすることで，`p`/`q`の親情報を事前に集めておく」ことによって文字通り先祖を追っていくことでも解ける．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None
class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        stack = [root]
        parents = {root: None}

        while not (p in parents and q in parents):
            node = stack.pop()
            if node.left is not None:
                parents[node.left] = node
                stack.append(node.left)
            if node.right is not None:
                parents[node.right] = node
                stack.append(node.right)

        ancestors = set()
        while p is not None:
            ancestors.add(p)
            p = parents[p]
        while q not in ancestors:
            q = parents[q]

        return q
```

## 出典

- https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/