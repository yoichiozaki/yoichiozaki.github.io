---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Construct String From Binary Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-18T17:36:11+09:00
lastmod: 2022-03-18T17:36:11+09:00
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

二分木`root`が与えられたとき，これを次のようなルールに基づいて文字列に変換する処理を書け．

- `root.val` `(左部分木)` `(右部分木)`
- ただし，与えられた二分木がその文字列と1対1に対応する限り空かっこ（`()`）を省略する
  - 具体的には，右子しかいないときの左子相当の`()`は省略できない
    - こうしないと一方しか子供がいないときにその子が左右のどっちの子供かが判断できず同じ文字列から複数の二分木が構成できてしまう

## 解法

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def tree2str(self, root: Optional[TreeNode]) -> str:
        ans = ""
        def rec(node):
            nonlocal ans
            if node is None:
                return
            ans += str(node.val)
            if node.left is None and node.right is None:
                return
            ans += "("
            rec(node.left)
            ans += ")"
            if node.right is not None:
                ans += "("
                rec(node.right)
                ans += ")"
        rec(root)
        return ans
```

## 出典

- https://leetcode.com/problems/construct-string-from-binary-tree/
