---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Path Sum"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-18T16:12:02+09:00
lastmod: 2022-03-18T16:12:02+09:00
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

二分木の根`root`と整数`targetSum`が与えられる．根から葉までの木上のパスの和が`targetSum`と等しくなるようなパスが存在するかを判定せよ．

## 解法

木を降りていきながら`targetSum`になるかを確かめる．

まずは再帰関数でDFSするやりかた．DFSで頂点を訪問しに行く．葉ノードに到達した時点で条件を満たしているかを確認する．条件を満たしているパスを発見したらその旨を`ans`にためてる．今回の問題だと条件を満たすパスを１つでも見つければそれで十分なので途中で打ち切ったほうが高速なのだろうが，再帰関数の途中で一気に抜けるのって`exit`するとかだろうか．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        ans = []
        def dfs(node, sofar, ans):
            if node is not None:
                sofar += node.val
                if node.left is None and node.right is None and sofar == targetSum:
                    ans.append(True)
                if node.left is not None:
                    dfs(node.left, sofar, ans)
                if node.right is not None:
                    dfs(node.right, sofar, ans)
        dfs(root, 0, ans)
        return len(ans) != 0
```

次にstackでDFSするやりかた．状態として`(訪問中の頂点, ここまでのパスの和)`を持っておく．こっちでやると1つでも条件を満たすパスを見つけたら抜けられる．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        if root is None:
            return False
        suspended = [(root, root.val)]
        while len(suspended) != 0:
            node, sofar = suspended.pop()
            if node.left is None and node.right is None and sofar == targetSum:
                return True
            if node.left is not None:
                suspended.append((node.left, sofar + node.left.val))
            if node.right is not None:
                suspended.append((node.right, sofar + node.right.val))
        return False
```

最後にBFSでのやりかた．上のDFSを書いて`pop`を末端から戦闘にすればいいだけなので楽に書ける．

```python
# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
class Solution:
    def hasPathSum(self, root: Optional[TreeNode], targetSum: int) -> bool:
        if root is None:
            return False
        suspended = [(root, root.val)]
        while len(suspended) != 0:
            node, sofar = suspended.pop(0)
            if node.left is None and node.right is None and sofar == targetSum:
                return True
            if node.left is not None:
                suspended.append((node.left, sofar + node.left.val))
            if node.right is not None:
                suspended.append((node.right, sofar + node.right.val))
        return False
```

`sofar`に今訪問している頂点の値を足すタイミングで頭が混乱しないように注意しよう．

## 出典

- https://leetcode.com/problems/path-sum/