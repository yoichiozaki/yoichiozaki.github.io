---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Minimum Depth of Binary Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-21T20:24:20+09:00
lastmod: 2021-03-21T20:24:20+09:00
featured: false
draft: false


---

## 問題

二分木が与えられたとき，最小の深さを求めよ．

## 答え

```python
class BinaryTreeNode:
    def __init__(self, key):
        self.key = key
        self.right = None
        self.left = None

def minimum_depth(root):
    # base case
    if root is None:
        return 0

    if root.left is not None and root.right is not None:
        return min(minimum_depth(root.left),  minimum_depth(root.right)) + 1
    elif root.left is None and root.right is not None:
        return minimum_depth(root.right) + 1
    elif root.left is not None and root.right is None:
        return minimum_depth(root.left) + 1
    else: # root.left is None and root.right is  None
        return 1
```
