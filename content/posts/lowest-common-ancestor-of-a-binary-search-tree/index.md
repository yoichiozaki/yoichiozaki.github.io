---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Lowest Common Ancestor of a Binary Search Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-17T22:01:18+09:00
lastmod: 2022-03-17T22:01:18+09:00
featured: false
draft: false


---

## 問題

二分探索木`root`とその木に含まれる2頂点`p`/`q`が与えられる．`p`と`q`の共通の先祖のうち，高さが最も低いもの（最小共通祖先：Lowest Common Ancestor）を計算せよ．

## 解法

二分探索木は

- `左の子` ≤ `親` ≤ `右の子`

が成立している．

`root`が`p`と`q`の間にあれば最小木共通先祖は`root`になる．さかのぼっていけば`root`にぶつかるので，当たり前といえば当たり前．`root`の手前で共通先祖が存在するかもしれないが，求めたいのは最小のものであることに注意．

再帰関数で書く解法がこちら．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None
class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        if root.val < p.val and root.val < q.val:
            return self.lowestCommonAncestor(root.right, p, q)
        if p.val < root.val and q.val < root.val:
            return self.lowestCommonAncestor(root.left, p, q)
        return root
```

`curr`というポインタを持ち出して繰り返しで書き下すと次のように書ける．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, x):
#         self.val = x
#         self.left = None
#         self.right = None
class Solution:
    def lowestCommonAncestor(self, root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':
        curr = root
        while curr is not None:
            if curr.val < p.val and curr.val < q.val:
                curr = curr.right
            elif p.val < curr.val and q.val < curr.val:
                curr = curr.left
            else:
                return curr
```

## 出典

- https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/