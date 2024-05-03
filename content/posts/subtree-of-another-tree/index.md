---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Subtree of Another Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-07-05T17:57:04+09:00
lastmod: 2021-07-05T17:57:04+09:00
featured: false
draft: false


---

## 問題

二分木`root`，`subRoot`が与えられる．`subRoot`が`root`の部分木であるかを判定せよ．

## 答え

- 再帰的に解く
  - 根から再帰的に値が一致しているかを確認
  - `isSubtree(root, subRoot)`: `root`を根として`subRoot`と重ねる
  - `is_same(s, t)`: `s`を根とする木と`t`を根とする木が重なるかを確認する
  - 計算量
    - `root`の頂点数を$s$，`subRoot`の頂点数を$t$とすると，$O(s \times t)$

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        def is_same(root1, root2):
            if root1 is None and root2 is None:
                return True
            if root1 is not None and root2 is None:
                return False
            if root1 is None and root2 is not None:
                return False
            return root1.val == root2.val and is_same(root1.left, root2.left) and is_same(root1.right, root2.right)

        if root is None and subRoot is None:
            return True
        if root is not None and subRoot is None:
            return False
        if root is None and subRoot is not None:
            return False
        return is_same(root, subRoot) or self.isSubtree(root.left, subRoot) or self.isSubtree(root.right, subRoot)
```

- 上のやりかただと，すべての頂点について重なるかを根の方から調べていく．どんどん木を降りていくと過去に重ねたのと同じものを再度計算することになるのでそれを回避するともうチョット効率が良さそう．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        def is_same(root1, root2):
            if root1 is None and root2 is None:
                return True
            if root1 is not None and root2 is None:
                return False
            if root1 is None and root2 is not None:
                return False
            return root1.val == root2.val and is_same(root1.left, root2.left) and is_same(root1.right, root2.right)
        result = False

        def dfs(root):
            nonlocal result
            if result:
                return
            if root is None:
                return
            if root.val == subRoot.val:
                result = is_same(root, subRoot)
            dfs(root.left)
            dfs(root.right)
        dfs(root)
        return result
```

- 木構造を文字列にエンコードして部分文字列に含まれるかを調べるやり方
  - `[12, None, None]`と`[2, None, None]`のようなときに区別できるようにエンコードを注意する．
    - 要するに`12-...`と`2-...`が区別できればいいので，`-12-...`と`-2-...`みたいに前になにかつけてやればいい

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        def encode(root):
            if root is None:
                return "#"
            return "-" + str(root.val) + "-" + encode(root.left) + "-" + encode(root.right) + "-"
        return encode(subRoot) in encode(root)
```

- 上のエンコードするやり方を繰り返しで書き下すと次のように書ける

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        def encode(root):
            suspended = [root]
            traversal = []
            while len(suspended) != 0:
                node = suspended.pop()
                if node is None:
                    traversal.append("#")
                    continue
                else:
                    traversal.append(str(node.val))
                    suspended.append(node.left)
                    suspended.append(node.right)
            return "-" + "-".join(traversal) + "-"
        return encode(subRoot) in encode(root)
```

- [merkle tree](https://ja.wikipedia.org/wiki/%E3%83%8F%E3%83%83%E3%82%B7%E3%83%A5%E6%9C%A8)
  - 木構造をマークルハッシュでまとめる
  - ハッシュ関数が衝突しない限り正解
  - やりすぎ
  - 計算量
    - `root`の頂点数を$s$，`subRoot`の頂点数を$t$とすると，$O(s + t)$


```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def isSubtree(self, root: Optional[TreeNode], subRoot: Optional[TreeNode]) -> bool:
        from hashlib import sha256
        def _hash(x):
            S = sha256()
            S.update(str.encode(x))
            return S.hexdigest()

        def merkle(node):
            if node is None:
                return ""
            left_merkle = merkle(node.left)
            right_merkle = merkle(node.right)
            node.merkle = _hash(left_merkle + str(node.val) + right_merkle)
            return node.merkle

        merkle(root)
        merkle(subRoot)

        def dfs(node):
            if node is None:
                return False
            return node.merkle == subRoot.merkle or dfs(node.left) or dfs(node.right)

        return dfs(root)
```

## Ref

- https://leetcode.com/problems/subtree-of-another-tree/