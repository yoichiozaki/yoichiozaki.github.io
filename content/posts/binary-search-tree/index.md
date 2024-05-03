---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Binary Search Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-20T16:53:54+09:00
lastmod: 2021-03-20T16:53:54+09:00
featured: false
draft: false
---

## 二分探索木

二分木の中でも，`左の子供 <= 自分 < 右の子供`となっているような木．

頂点の挿入順序によって出来上がる木は複数パターンある．

## 実装

```python
class BinarySearchTreeNode:
    def __init__(self, key):
        self.key = key
        self.right = None
        self.left = None

    def insert(self, key):
        if self.key == key:
            return

        if self.key < key:
            if self.right is None:
                self.right = BinarySearchTreeNode(key)
            else:
                self.right.insert(key)
        else: # key < self.key:
            if self.left is None:
                self.left = BinarySearchTreeNode(key)
            else:
                self.left.insert(key)

    # ref: https://stackoverflow.com/questions/34012886/print-binary-tree-level-by-level-in-python
    def display(self):
        lines, *_ = self._display()
        for line in lines:
            print(line)

    def _display(self):
        """Returns list of strings, width, height, and horizontal coordinate of the root."""
        # No child.
        if self.right is None and self.left is None:
            line = '%s' % self.key
            width = len(line)
            height = 1
            middle = width // 2
            return [line], width, height, middle

        # Only left child.
        if self.right is None:
            lines, n, p, x = self.left._display()
            s = '%s' % self.key
            u = len(s)
            first_line = (x + 1) * ' ' + (n - x - 1) * '_' + s
            second_line = x * ' ' + '/' + (n - x - 1 + u) * ' '
            shifted_lines = [line + u * ' ' for line in lines]
            return [first_line, second_line] + shifted_lines, n + u, p + 2, n + u // 2

        # Only right child.
        if self.left is None:
            lines, n, p, x = self.right._display()
            s = '%s' % self.key
            u = len(s)
            first_line = s + x * '_' + (n - x) * ' '
            second_line = (u + x) * ' ' + '\\' + (n - x - 1) * ' '
            shifted_lines = [u * ' ' + line for line in lines]
            return [first_line, second_line] + shifted_lines, n + u, p + 2, u // 2

        # Two children.
        left, n, p, x = self.left._display()
        right, m, q, y = self.right._display()
        s = '%s' % self.key
        u = len(s)
        first_line = (x + 1) * ' ' + (n - x - 1) * '_' + s + y * '_' + (m - y) * ' '
        second_line = x * ' ' + '/' + (n - x - 1 + u + y) * ' ' + '\\' + (m - y - 1) * ' '
        if p < q:
            left += [n * ' '] * (q - p)
        elif q < p:
            right += [m * ' '] * (p - q)
        zipped_lines = zip(left, right)
        lines = [first_line, second_line] + [a + u * ' ' + b for a, b in zipped_lines]
        return lines, n + m + u, max(p, q) + 2, n + u // 2
```

## 高さが最小の二分探索木

昇順にソートされた`key`の配列を渡されたときに，それらを格納する二分探索木のうち最も高さの小さいものを作る．

考え方としては，高さが最小になるとき，左右の木の高さが等しいので，`key`の真ん中ぐらいの大きさのものから格納していくとできそうという感じ．

```python
def build_minimum_height_bst(keys):
    return _build_minimum_height_bst(keys, 0, len(keys) - 1)

def _build_minimum_height_bst(keys, start, end):
    if end < start:
        return None

    middle = (start + end) // 2
    root = BinarySearchTreeNode(keys[middle])
    root.left = _build_minimum_height_bst(keys, start, middle - 1)
    root.right = _build_minimum_height_bst(keys, middle + 1, end)

    return root
```

## 深さごとの`key`のリスト

二分探索木から`[ [深さ0のkeyのリスト], [深さ1のkeyのリスト], ...]`を作る．二分探索木を横串に見る感じ．

```python
def list_of_depths(root, lsts, level):
    if root is None:
        return

    lst = None
    if len(lsts) == level: # 深さ0のリストの存在に注意
        lst = []
        lsts.append(lst)
    else:
        lst = lsts[level]
    lst.append(root.key)
    list_of_depths(root.left, lsts, level + 1)
    list_of_depths(root.right, lsts, level + 1)

    return lsts
```

BFS っぽくもできる．$n$段目を見終わった段階で$n+1$段目が`suspended`に入っているように実装する．

```python
def list_of_depths(root):
    if root is None:
        return []

    suspended = []
    suspended.append(root)

    lsts = []
    level = 0

    while len(suspended) != 0:
        if len(lsts) == level:
            lsts.append([])
        next_suspended = []
        for u in suspended:
            lsts[level].append(u.key)
            if u.left is not None:
                next_suspended.append(u.left)
            if u.right is not None:
                next_suspended.append(u.right)
        suspended = next_suspended
        level += 1

    return lsts
```

## 「その木は完全にバランスしているか？」

ここでは「その木に含まれるどの頂点を根とした部分木を考えてもその左右の部分木がバランスしている状態」を「完全にバランスしている」とする．左右の部分木の高さの差が 1 以下になっているかを調べる．要するに木の高さを求められますかという問題．ある頂点を根とする木の高さは，その頂点の左右の子供を根とする部分木のサイズの大きい方+1 なので再帰的に書ける．

```python
def get_height(root):
    # base case
    if root is None:
        return -1

    left = get_height(root.left)
    right = get_height(root.right)

    return max(left, right) + 1

def is_balanced(root):
    if root is None:
        return true
    diff = abs(get_height(root.left) - get_height(root.right))
    if 1 < diff:
        return False
    else:
        return is_balanced(root.left) and is_balanced(root.right)
```

ただこれだと効率が悪い．一部がバランスしてない事実が発覚した時点でそれ以上の木の高さを真面目に計算する必要がなくなるので，工夫する余地がある．

## その二分木は二分探索木？

与えられた二分木が二分探索木になっているかを調べる．根から inorder で走査した結果が昇順にソートされていればその木は二分探索木の定義を満たす．

```python
class Integer:
    def __init__(self, num):
        self.num = num

last_visited = None
def is_valid(root):
    if root is None:
        return True

    if not is_valid(root.left):
        return False

    if last_visited is not None and root.key <= last_visited.num:
        return False

    if not is_valid(root.right):
        return False

    return True
```

```python
def inorder(root):
    if root is None:
        return
    inorder(root.left)
    print(root.key)
    inorder(root.right)

def preorder(root):
    if root is None:
        return
    print(root.key)
    preorder(root.left)
    preorder(root.right)

def postorder(root):
    if root is None:
        return
    postorder(root.left)
    postorder(root.right)
    print(root.key)
```

## 間順走査順で次の頂点はどれか

注目頂点の右の部分木が存在するなら，その部分木の最も左側の頂点が次に訪問する頂点になる．
注目頂点の右の部分木が存在しないなら，注目頂点の親にとって注目頂点が左側の子なら，その親自身が次の頂点．

```python
def left_most_child(root):
    if root is None:
        return None
    while root.left is not None:
        root = root.left
    return root

def inorder_successor(root):
    if root is None:
        return None

    if root.right is not None:
        return left_most_child(root.right)
    else:
        q = root
        x = root.parent
        while x is not None and q is not x.left:
            q = x
            x = q.parent
        return x
```
