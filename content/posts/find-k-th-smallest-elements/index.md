---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find $K$th Smallest Elements"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-28T13:06:44+09:00
lastmod: 2021-03-28T13:06:44+09:00
featured: false
draft: false
---

## 問題

同一要素を含まない，長さ$n$の配列`lst`が与えられる．小さい順に$k$個の要素を取り出せ．

## 答え

### $O(n \log n)$：昇順にソートして先頭$k$個取り出す

ソートするのに$O(n \log n)$．

```python
def smallest_k(lst, k):
    lst.sort()
    return lst[:k]
```

### $O(nk)$：バブルソートを途中でやめる

先頭$k$個が決定するまで昇順のバブルソートを実行し，途中でやめる．

```python
def smallest_k(lst, k):
    for i in range(0, k, 1):
        for j in range(len(lst) - 1, i, -1):
            if lst[j - 1] > lst[j]:
                lst[j - 1], lst[j] = lst[j], lst[j - 1]
    return lst[:k]
```

### $O(k \log n)$：ヒープソートを途中でやめる

先頭$k$個が決定するまで昇順のヒープソートを実行し，途中でやめる．

```python
import heapq
def smallest_k(lst, k):
    heapq.heapify(lst)
    ret = []
    for _ in range(k):
        ret.append(heapq.heappop(lst))
    return ret
```

`heapq`にはそれ用の`heapq.nsmallest()`関数が用意されている．

```python
import heapq
def smallest_k(lst, k):
    return heapq.nsmallest(k, lst)
```

### $O(n \log k)$：サイズ$k$の Max Heap を作る

`lst`の要素を一つずつ見ながら Max Heap を作る．今見てる要素より Max Heap の先頭が大きかったら現在の Max Heap の先頭は答えに含まれないので`pop`して今見てる要素を`push`する．

```python
def smallest_k(lst, k):
    def max_heapify(lst):
        p = len(lst) // 2
        while -1 < p:
            left = 2*p + 1 if 2*p + 1 < len(lst) else -1
            right = 2*p + 2 if 2*p + 2 < len(lst) else -1
            if left != -1 and lst[p] < lst[left]:
                lst[p], lst[left] = lst[left], lst[p]
            if right != -1 and lst[p] < lst[right]:
                lst[p], lst[right] = lst[right], lst[p]
            p -= 1

    def max_heappop(lst):
        m = lst.pop(0)
        max_heapify(lst)
        return m

    def max_heappush(lst, ele):
        lst.append(ele)
        max_heapify(lst)

    heap = []
    for ele in lst:
        if len(heap) < k:
            max_heappush(heap, ele)
        elif ele < heap[0]:
            max_heappop(heap)
            max_heappush(heap, ele)
    return heap
```

### $O(n)$：Selection Rank Algorithm

$k$番目に小さい値を効率よく見つけ出し，それ以上の値を取ってくるというアルゴリズム．分割統治法．最悪の時間計算量は$O(n^2)$だが，うまく行けば$O(n)$が期待できる．クイックソートの探索版を使って$k$番目に小さい値を拾ってくる．

```python
def smallest_k(lst, k):
    # partition lst[left:right+1] by pivot = lst[right]
    # left, right: 0-origin
    # [left_side] <= pivot < [right_side]
    def partition(lst, left, right):
        pivot = lst[right]
        left_end = left
        for curr in range(left, right):
            if lst[curr] <= pivot:
                lst[left_end], lst[curr] = lst[curr], lst[left_end]
                left_end += 1
        lst[left_end], lst[right] = lst[right], lst[left_end]
        return left_end # tail index of left side(0-origin)

    # rank, left, right: 0-origin
    def get_ele_at_rank(lst, left, right, rank):
        if 0 <= rank and rank <= right - left:
            left_end = partition(lst, left, right)
            left_size = left_end - left + 1 # 1-origin count
            if left_end - left == rank:
                return lst[left_end]
            if rank < left_end - left:
                return get_ele_at_rank(lst, left, left_end - 1, rank)
            return get_ele_at_rank(lst, left_end  + 1, right, rank - left_size)

    # given k: 1-origin
    kth_smallest = get_ele_at_rank(lst, 0, len(lst) - 1, k - 1)

    return [ele for ele in lst if ele <= kth_smallest]

lst = [i for i in range(20)]
import random
random.shuffle(lst)
lst = lst[:10]
print(lst)

k = 5

print("{}th smallest elements: {}".format(k, smallest_k(lst, k)))
```

TODO: selection rank の実装

### $O(n)$：二分探索木を作って間順走査

正しい二分探索木を間順走査すれば昇順に$k$個の頂点を訪れる．

```python
class TreeNode:
    def __init__(self, val=-1, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def insert(self, val):
        if self.val == val:
            return
        elif self.val < val:
            if self.right is None:
                self.right = TreeNode(val)
            else:
                self.right.insert(val)
        else: # self.key > key
            if self.left is None:
                self.left = TreeNode(val)
            else:
                self.left.insert(val)

    def display(self):
        lines, *_ = self._display_aux()
        for line in lines:
            print(line)

    def _display_aux(self):
        """Returns list of strings, width, height, and horizontal coordinate of the root."""
        # No child.
        if self.right is None and self.left is None:
            line = '%s' % self.val
            width = len(line)
            height = 1
            middle = width // 2
            return [line], width, height, middle

        # Only left child.
        if self.right is None:
            lines, n, p, x = self.left._display_aux()
            s = '%s' % self.val
            u = len(s)
            first_line = (x + 1) * ' ' + (n - x - 1) * '_' + s
            second_line = x * ' ' + '/' + (n - x - 1 + u) * ' '
            shifted_lines = [line + u * ' ' for line in lines]
            return [first_line, second_line] + shifted_lines, n + u, p + 2, n + u // 2

        # Only right child.
        if self.left is None:
            lines, n, p, x = self.right._display_aux()
            s = '%s' % self.val
            u = len(s)
            first_line = s + x * '_' + (n - x) * ' '
            second_line = (u + x) * ' ' + '\\' + (n - x - 1) * ' '
            shifted_lines = [u * ' ' + line for line in lines]
            return [first_line, second_line] + shifted_lines, n + u, p + 2, u // 2

        # Two children.
        left, n, p, x = self.left._display_aux()
        right, m, q, y = self.right._display_aux()
        s = '%s' % self.val
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

import random
lst = [i for i in range(100)]
random.shuffle(lst)
lst = lst[:20]

root = TreeNode(val=lst[0])
for ele in lst[1:]:
    root.insert(ele)
root.display()

def smallest_k(root, k, sofar):
    if root is None:
        return
    if root.left is not None:
        sofar = smallest_k(root.left, k, sofar)
    if len(sofar) < k:
        sofar.append(root.val)
    if root.right is not None:
        sofar = smallest_k(root.right, k, sofar)
    return sofar

k = 5
ret = smallest_k(root, k, [])
print(ret)

def is_bst(root):
    if root is None:
        return True
    if root.left is not None and root.left.val > root.val:
        return False
    if root.right is not None and root.right.val < root.val:
        return False
    if is_bst(root.left) or is_bst(root.right):
        return False
    return True

print(is_bst(root))
```
