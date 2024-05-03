---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Same Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-18T16:58:53+09:00
lastmod: 2022-03-18T16:58:53+09:00
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

2つの木`p`/`q`が与えられたとき，それらの値・形が一致しているかを判定せよ．

## 解法

再帰関数を書くときの自己流手順を書いておく．

まず先にエッジケースじゃない部分を書いてしまう．今回なら条件を「`根同士の値が一致 and 左部分木の値・形が一致 and 右部分木の値・形が一致`」という風に再帰的に言い換えられるのでそれを先に書いてしまう．そうすると，エッジケースとしてどういう条件の時を別処理する必要があるかが形からわかってくる（気がしてる）．形からわかるというのはあまり思考がいらないという意味．この例だと，`p.val`/`q.val`など`p`/`q`の属性へのアクセスが必要になるので，`p`/`q`が`None`になっちゃうと困る（`not None`であるという前提を暗黙において考えていたことになる）．それらを手前で処理して置かなければいかんなぁという気持ちになると`p`/`q`が`None`かそうじゃないかの4通りあってそれぞれ潰しておくかという風に思考が進む．気がする．正しいのかはわからない．が，こういう考え方でうまくいくような気がしている．

全頂点を訪問するので時間計算量は$O(n)$．空間計算量は木の高さ程度に再帰関数が呼ばれるので$O(\log n)$．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        if p is None and q is None:
            return True
        if p is None and q is not None:
            return False
        if p is not None and q is None:
            return False
        return p.val == q.val and self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)
```

stackで書き下すと次のようにも書ける．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSameTree(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:
        def check(node1, node2):
            if node1 is None and node2 is None:
                return True
            if node1 is not None and node2 is None:
                return False
            if node1 is None and node2 is not None:
                return False
            return node1.val == node2.val
        suspended = [(p, q)]
        while len(suspended) != 0:
            (node1, node2) = suspended.pop()
            if not check(node1, node2):
                return False
            if node1 is not None:
                suspended.append((node1.left, node2.left))
                suspended.append((node1.right, node2.right))
        return True
```

## 出典

- https://leetcode.com/problems/same-tree/