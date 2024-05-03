---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sum of Left Leaves"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-10T23:46:22+09:00
lastmod: 2022-03-10T23:46:22+09:00
featured: false
draft: false


---

## 問題

次のように定義される二分木が与えられる．

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

左葉ノードの合計を求めよ．

## 解法

- DFSによる解法
  - DFSで全頂点をなめながら，その頂点が左側の子なしであるかを確認する
    - 「子なし」であることは`TreeNode.left`/`TreeNode.right`が`None`であることを見れば良い
    - 「左側の」であることは追加の変数で追跡する必要がある
    - 再帰関数でもstackでも実装できる
  - 時間計算量$O(n)$
  - 空間計算量$O(\log n)$

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def sumOfLeftLeaves(self, root: Optional[TreeNode]) -> int:
        def dfs(node, is_left):
            if node is None:
                return 0
            if node.left is None and node.right is None:
                return node.val if is_left else 0
            return dfs(node.left, True) + dfs(node.right, False)
        return dfs(root, False)
```

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def sumOfLeftLeaves(self, root: TreeNode) -> int:
        ans = 0
        stack = [(root, False)]
        while len(stack) != 0:
            node, is_left = stack.pop()
            if node.left is None and node.right is None and is_left:
                ans += node.val
            if node.left is not None:
                stack.append((node.left, True))
            if node.right is not None:
                stack.append((node.right, False))
        return ans
```

- BFSによる解法
  - DFSで全頂点をなめながら，その頂点が左側の子なしであるかを確認する
    - 「子なし」であることは`TreeNode.left`/`TreeNode.right`が`None`であることを見れば良い
    - 「左側の」であることは追加の変数で追跡する必要がある
  - 時間計算量$O(n)$
  - 空間計算量$O(\log n)$

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def sumOfLeftLeaves(self, root: TreeNode) -> int:
        ans = 0
        queue = [(root, False)]
        while len(queue) != 0:
            node, is_left = queue.pop(0)
            if node.left is None and node.right is None and is_left:
                ans += node.val
            if node.left is not None:
                queue.append((node.left, True))
            if node.right is not None:
                queue.append((node.right, False))
        return ans
```

- Morris Traversal
  - 拙著記事：https://zakimal.github.io/ja/post/morris-traversal/
  - inorderで全探索するのを空間計算量$O(1)$で実現するアルゴリズム

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def sumOfLeftLeaves(self, root: TreeNode) -> int:
        ans = 0
        while root is not None:
            if root.left is not None:
                prev = root.left
                while prev.right is not None and prev.right is not root:
                    prev = prev.right
                if prev.right is None:  # in-order順でrootの直前のノードがprevになっている
                    prev.right = root  # 一時的なリンクを張る
                    root = root.left
                else:
                    prev.right = None  # ここで一時的に張ったリンクを消してる
                    if prev is root.left and prev.left is None:
                        ans += prev.val
                    root = root.right
            else:  # ここに入り込む時点でrootは左端の葉ノード
                root = root.right
        return ans
```

## 出典

- https://leetcode.com/problems/sum-of-left-leaves/