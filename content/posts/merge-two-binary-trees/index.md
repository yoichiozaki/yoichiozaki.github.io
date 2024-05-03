---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Merge Two Binary Trees"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-18T16:38:58+09:00
lastmod: 2022-03-18T16:38:58+09:00
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

2つの二分木`root1`/`root2`が与えられる．これらを重ねた結果得られる二分木を計算せよ．

例：
```
   1         2         3
 3   2  +  1   3  =  4   5
5           4   7   5 4   7
```

## 解法

- `mergeTree(root1, root2)`は`root1`を根とする木と`root2`を寝とする木を重ねる関数
  - まず根（`root1`/`root2`）を重ねる
  - 左右の部分木については再帰的に考えられる．つまり
    - `mergeTree(root1.left, root2.left)`は`root1.left`を根とする木と`root2.left`を寝とする木を重ねる関数
    - `mergeTree(root1.right, root2.right)`は`root1.right`を根とする木と`root2.right`を寝とする木を重ねる関数
    - これらの結果が重ね終わった木の根の左右の部分木になってほしいのでつける．
      - ああなんて再帰的なんだ

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def mergeTrees(self, root1: Optional[TreeNode], root2: Optional[TreeNode]) -> Optional[TreeNode]:
        if root1 is None:
            return root2 # 相方がいなければ足さずににそのまま
        if root2 is None:
            return root1 # 相方がいなければ足さずにそのまま
        root1.val += root2.val
        root1.left = self.mergeTrees(root1.left, root2.left)
        root1.right = self.mergeTrees(root1.right, root2.right)
        return root1
```

## 出典

- https://leetcode.com/problems/merge-two-binary-trees/