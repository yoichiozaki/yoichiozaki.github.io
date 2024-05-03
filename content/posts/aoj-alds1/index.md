---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "AOJ ALDS1 in Python"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-04-09T17:59:05+09:00
lastmod: 2021-04-09T17:59:05+09:00
featured: false
draft: true
---

[AOJ-ALDS1](https://judge.u-aizu.ac.jp/onlinejudge/finder.jsp?course=ALDS1)を Python で解く．

## ALDS1_1_A: Insertion Sort

<details>
<summary>答え</summary>

```python
_ = int(input())
nums = list(map(int, input().split()))

def insertion_sort(nums):
    for i in range(1, len(nums)):
        print(*nums)
        v = nums[i]
        j = i - 1
        while 0 <= j and v < nums[j]:
            nums[j + 1] = nums[j]
            j -= 1
        nums[j + 1] = v
    print(*nums)

insertion_sort(nums)
```

</details>

## ALDS1_1_B: Greatest Common Divisor

<details>
<summary>答え</summary>

再帰で書く．

```python
x, y = map(int, input().split())
if x < y:
    x, y = y, x

def gcd(x, y):
    if x % y == 0:
        return y
    r = x % y
    return gcd(y, r)

print(gcd(x, y))
```

繰り返しで書く．

```python
x, y = map(int, input().split())
if x < y:
    x, y = y, x

def gcd(x, y):
    if x % y == 0:
        return y
    r = x % y
    while r:
        x, y = y, r
        r = x % y
    return y

print(gcd(x, y))
```

</details>

## ALDS1_1_C: Prime Numbers

<details>
<summary>答え</summary>

```python
n = int(input())

def is_prime(x):
    if x < 2:
        return False
    if x == 2:
        return True
    if x % 2 == 0:
      return False
    i = 2
    while i * i <= x:
        if x % i == 0:
            return False
        i += 1
    return True

cnt = 0
for _ in range(n):
    x = int(input())
    if is_prime(x):
        cnt += 1
print(cnt)
```

</details>

## ALDS1_1_D: Maximum Profit

<details>
<summary>答え</summary>

```python
n = int(input())

prices = [int(input()) for _ in range(n)]

max_diff = float("-inf")
bottom_price = float("inf")
for i in range(n):
    max_diff = max(max_diff, prices[i] - bottom_price)
    bottom_price = min(bottom_price, prices[i])

print(max_diff)
```

</details>

## ALDS1_2_A: Bubble Sort

<details>
<summary>答え</summary>

```python
_ = int(input())
nums = list(map(int, input().split()))

def bubble_sort(nums):
    ans = 0
    for i in range(len(nums) - 1, 0, -1):
        for j in range(0, i, 1):
            if nums[j] > nums[j+1]:
                nums[j], nums[j+1] = nums[j+1], nums[j]
                ans += 1
    return ans, nums

ans, nums = bubble_sort(nums)
print(*nums)
print(ans)
```

</details>

## ALDS1_2_B: Selection Sort

<details>
<summary>答え</summary>

```python
_ = int(input())
nums = list(map(int, input().split()))

def selection_sort(nums):
    ans = 0
    for i in range(len(nums)):
        min_idx = i
        for j in range(i, len(nums), 1):
            if nums[j] < nums[min_idx]:
                min_idx = j
        if i != min_idx:
            nums[i], nums[min_idx] = nums[min_idx], nums[i]
            ans += 1

    return ans, nums

ans, nums = selection_sort(nums)
print(*nums)
print(ans)
```

</details>

## ALDS1_2_C: Stable Sort

<details>
<summary>答え</summary>

```python
import copy
def bubble_sort(cards):
    cards = copy.deepcopy(cards)
    for i in range(len(cards)-1, 0, -1):
        for j in range(0, i, 1):
            if cards[j][1] > cards[j+1][1]:
                cards[j], cards[j+1] = cards[j+1], cards[j]
    return cards

def selection_sort(cards):
    cards = copy.deepcopy(cards)
    for i in range(len(cards)):
        min_idx = i
        for j in range(i, len(cards)):
            if cards[j][1] < cards[min_idx][1]:
                min_idx = j
        if i != min_idx:
            cards[i], cards[min_idx] = cards[min_idx], cards[i]
    return cards

_ = int(input())
cards = list(map(lambda card: (card[0], int(card[1])), input().split()))

bubble_sorted_cards = list(map(lambda card: "{}{}".format(card[0], card[1]), bubble_sort(cards)))

print(*bubble_sorted_cards)
print("Stable")

selection_sorted_cards = list(map(lambda card: "{}{}".format(card[0], card[1]), selection_sort(cards)))

print(*selection_sorted_cards)
if bubble_sorted_cards == selection_sorted_cards:
    print("Stable")
else:
    print("Not stable")
```

</details>

## ALDS1_2_D: Shell Sort

<details>
<summary>答え</summary>

```python
n = int(input())
nums = [0] * n
for i in range(n):
    nums[i] = int(input())

def shell_sort(nums):
    cnt = 0
    G = [1]
    for i in range(99):
        if n < 1 + 3*G[-1]:
            break
        G.append(1 + 3*G[-1])
    G.reverse()
    m = len(G)
    def insertion_sort(nums, g):
        cnt = 0
        for i in range(g, len(nums)):
            v = nums[i]
            j = i - g
            while 0 <= j and v < nums[j]:
                nums[j+g] = nums[j]
                j -= g
                cnt += 1
            nums[j+g] = v
        return cnt
    for i in range(m):
        cnt += insertion_sort(nums, G[i])
    return (m, G, cnt, nums)

(m, G, cnt, nums) = shell_sort(nums)
print(m)
print(*G)
print(cnt)
print(*nums, sep="\n")
```

</details>

## ALDS1_3_A: Stack

<details>
<summary>答え</summary>

```python
seq = list(map(lambda s: int(s) if s.isdigit() else s, input().split()))

stack = []
for ele in seq:
    if ele not in ["+", "-", "*", "/"]:
        stack.append(ele)
    else:
        if ele == "+":
            y = stack.pop()
            x = stack.pop()
            stack.append(x + y)
        elif ele == "-":
            y = stack.pop()
            x = stack.pop()
            stack.append(x - y)
        elif ele == "*":
            y = stack.pop()
            x = stack.pop()
            stack.append(x * y)
        else: # ele == "/":
            y = stack.pop()
            x = stack.pop()
            stack.append(x / y)

print(stack[0])
```

</details>

## ALDS1_3_B: Queue

<details>
<summary>答え</summary>

```python
n, q = map(int, input().split())
tasks = [input().split() for _ in range(n)]
tasks = list(map(lambda x: [x[0], int(x[1])], tasks))

current_time = 0
while tasks:
    task = tasks.pop(0)
    if task[1] <= q:
        current_time += task[1]
        print(task[0], current_time)
        continue
    task[1] -= q
    tasks.append(task)
    current_time += q
```

</details>

## ALDS1_3_C: Doubly Linked List

<details>
<summary>答え</summary>

自前で双方向リストを実装すると TLE する...？

```python
from collections import deque

n = int(input())
Q = deque()
for _ in range(n):
    command = input()
    if command == "deleteFirst":
        Q.popleft()
    elif command == "deleteLast":
        Q.pop()
    else:
        comm, x = command.split()
        if comm == "insert":
            Q.appendleft(x)
        elif comm == "delete":
            try:
                Q.remove(x)
            except:
                pass
print(*Q)
```

</details>

## ALDS1_3_D: Areas on the Cross-Section Diagram

<details>
<summary>答え</summary>

最後の`\`に最初の`/`が対応して水たまりが出来上がるので，FILO だからスタックを使うと美く実装できそう．

```python
seq = input()
stack1 = [] # 進行中の水たまり
stack2 = [] # 確定済み水たまり：[(水たまりの左端, 確定した面積)]

added_area = 0
for pos, char in enumerate(seq):
    if char == "\\":
        stack1.append(pos)
    elif char == "/" and len(stack1) != 0:
        ops_pos = stack1.pop()
        added_area += (pos - ops_pos)
        area = pos - ops_pos
        while len(stack2) != 0 and ops_pos < stack2[-1][0]:
            area += stack2[-1][1]
            stack2.pop()
        stack2.append((ops_pos, area))

print(added_area)
areas = [area[1] for area in stack2]
print(len(areas), *areas)
```

</details>

## ALDS1_4_A: Linear Search

<details>
<summary>答え</summary>

```python
_ = input()
S = set(input().split())
_ = input()
T = input().split()
cnt = 0
for t in T:
    if t in S:
        cnt += 1
print(cnt)
```

</details>

## ALDS1_4_B: Binary Search

<details>
<summary>答え</summary>

集合を使えば通ってしまう．

```python
_ = input()
S = set(input().split())
_ = input()
T = input().split()
cnt = 0
for t in T:
    if t in S:
        cnt += 1
print(cnt)
```

出題意図は二分探索．

```python
def binary_search(target, lst):
    ok = len(lst)
    ng = -1
    def is_ok(mid):
        return target <= lst[mid]
    while 1 < abs(ok - ng):
        mid = (ok + ng) // 2
        if is_ok(mid):
            ok = mid
        else:
            ng = mid
    return lst[ok] == target if ok < len(lst) else False

_ = input()
S = list(map(int, input().split()))
_ = input()
T = list(map(int, input().split()))
cnt = 0
for t in T:
    if binary_search(t, S):
        cnt += 1
print(cnt)
```

</details>

## ALDS1_4_C: Dictionary

<details>
<summary>答え</summary>

```python
n = int(input())
s = set()
for _ in range(n):
    command = input().split()
    if command[0] == "insert":
        s.add(command[1])
    else:
        print("yes") if command[1] in s else print("no")
```

</details>

## ALDS1_4_D: Allocation

<details>
<summary>答え</summary>

最大積載量の最小値なので二分探索．

```python
n, k = map(int, input().split())
packages = [0] * n
for i in range(n):
    packages[i] = int(input())

ok = sum(packages)
ng = max(packages) - 1

def is_ok(mid):
    truck = 1
    load = 0
    for package in packages:
        load += package
        if mid < load:
            truck += 1
            load = package
    return truck <= k

while 1 < abs(ok - ng):
    mid = (ng + ok) // 2
    if is_ok(mid):
        ok = mid
    else:
        ng = mid
print(ok)
```

</details>

## ALDS1_5_A: Exhaustive Search

<details>
<summary>答え</summary>

全探索．

```python
n = int(input())
A = list(map(int, input().split()))
_ = int(input())
M = list(map(int, input().split()))

alls = set()
for i in range(1 << n):
    s = 0
    for j in range(n):
        if i & (1 << j):
            s += A[j]
    alls.add(s)

for m in M:
    print("yes") if m in alls else print("no")
```

</details>

## ALDS1_5_B: Merge Sort

<details>
<summary>答え</summary>

```python
n = int(input())
nums = list(map(int, input().split()))

# merge sort for nums[left:right]
def merge_sort(nums, left, right):
    if left + 1 < right:
        mid = (left + right) // 2
        count_lhs = merge_sort(nums, left, mid)
        count_rhs = merge_sort(nums, mid, right)
        return merge(nums, left, mid, right) + count_lhs + count_rhs
    return 0

def merge(nums, left, mid, right):
    lhs = nums[left:mid] + [float("inf")]
    rhs = nums[mid:right] + [float("inf")]
    i = j = 0
    count = 0
    for k in range(left, right):
        count += 1
        if lhs[i] <= rhs[j]:
            nums[k] = lhs[i]
            i += 1
        else:
            nums[k] = rhs[j]
            j += 1
    return count

cnt = merge_sort(nums, 0, len(nums))
print(*nums)
print(cnt)
```

</details>

## ALDS1_5_C: Koch Curve

<details>
<summary>答え</summary>

再帰的に書く．

```python
from math import sqrt

q3 = sqrt(3)
fmt = "%.8f %.8f"
n = int(input())

def koch(x0, y0, x1, y1, c):
    if c == n:
        return (fmt % (x0, y0),)
    xp = (x0*2 + x1) / 3
    yp = (y0*2 + y1) / 3

    xq = (x0 + x1*2) / 3
    yq = (y0 + y1*2) / 3

    dx = (x1 - x0) / 6
    dy = (y1 - y0) / 6

    xr = xp + (dx - dy * q3)
    yr = yp + (dx * q3 + dy)

    return koch(x0, y0, xp, yp, c+1) + koch(xp, yp, xr, yr, c+1) + koch(xr, yr, xq, yq, c+1) + koch(xq, yq, x1, y1, c+1)

print(*koch(0, 0, 100, 0, 0)+(fmt % (100, 0),), sep='\n')
```

</details>

## ALDS1_5_D: The Number of Inversions

<details>
<summary>答え</summary>

- 反転：数列$A$について$i < j$かつ$a_i > a_j$となる$(a_i, a_j)$の組
- 反転数：数列$A$の持つ反転の総数

> [Wikipedia: 反転](<https://ja.wikipedia.org/wiki/%E8%BB%A2%E5%80%92_(%E6%95%B0%E5%AD%A6)>)

$i$でループを回して$j$を数えると$O(n^2)$．別のやり方として$j$でループを回して$i$を数えてもいい．素直にやるとこれも$O(n^2)$．そこで Binary Index Tree（BIT）を使うと良いということらしい．

- BIT：数列に対して，ある要素へ$x$足す・ある連続する部分列の要素の和を求める，という操作が酵素期にできるデータ構造
- 賢者様による導き資料：http://hos.ac/slides/20140319_bit.pdf
- BIT の添字は 1-origin

```sh
[x, 5, 2, 8,  4, 3, 1] arr
--------------------------------------
[x, 5     8      3,  ] range width = 1
[x,    7            4] range width = 2
[x,          19      ] range width = 4
--------------------------------------
[x, 5, 7, 8, 19, 3, 4] BIT
[x, 1, 2, 3,  4, 5, 6] idx
```

したのコードは TLE してしまう．改良が必要．

```python
class Bit:
    def __init__(self, n):
        self.size = n
        self.tree = [0] * (n + 1)

    def sum(self, i):
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & -i
        return s

    def add(self, i, x):
        while i <= self.size:
            self.tree[i] += x
            i += i & -i

import sys
readline = sys.stdin.readline
write = sys.stdout.write

n = int(readline())
arr = list(map(int, readline().split()))
for idx, ele in enumerate(sorted(arr)):
    arr[arr.index(ele)] = idx + 1
bit = Bit(n)
ans = 0
for ele in arr:
    ans += bit.sum(n) - bit.sum(ele)
    bit.add(ele, 1)
write("%d\n" % ans)
```

</details>

## ALDS1_6_A: Counting Sort

<details>
<summary>答え</summary>

その要素が何個あるかでソートする．

```python
n = int(input())
A = list(map(int, input().split()))
B = []
k = max(A)

def counting_sort(A, B, k):
    C = [0] * (k + 1)
    for ele in A:
        C[ele] += 1
    for ele, cnt in enumerate(C):
        for _ in range(cnt):
            B.append(ele)

counting_sort(A, B, k)
print(*B)
```

</details>

## ALDS1_6_B: Partition

<details>
<summary>答え</summary>

`pivot`以下の値の位置を確定させていくという意識で書くとバグらないかも．

```python
n = int(input())
nums = list(map(int, input().split()))

# nums[left:right+1]を分割
def partition(nums, left, right):
    pivot = nums[right]
    smaller = left - 1
    for ptr in range(left, right):
        if nums[ptr] <= pivot:
            smaller += 1
            nums[smaller], nums[ptr] = nums[ptr], nums[smaller]
    nums[smaller + 1], nums[right] = nums[right], nums[smaller + 1]
    return smaller + 1

pivot_idx = partition(nums, 0, n-1)
print(*nums[:pivot_idx], "[{}]".format(nums[pivot_idx]), *nums[pivot_idx+1:])
```

</details>

## ALDS1_6_C: Quick Sort

<details>
<summary>答え</summary>

安定であるかの確認は初期状態での数字ごとの文字の並びを保存しておくことで確認．

```python
n = int(input())
initial_order = dict()
cards = []
for _ in range(n):
    card = input().split()
    cards.append((card[0], int(card[1])))
    initial_order.setdefault(int(card[1]), []).append(card[0])

initial_order = {
    k: iter(v).__next__
    for k, v in initial_order.items()
}

def partition(cards, left, right):
    pivot = cards[right][1]
    smaller = left - 1
    for ptr in range(left, right):
        if cards[ptr][1] <= pivot:
            smaller += 1
            cards[ptr], cards[smaller] = cards[smaller], cards[ptr]
    smaller += 1
    cards[smaller], cards[right] = cards[right], cards[smaller]
    return smaller

def quick_sort(cards, left, right):
    if left < right:
        pivot_idx = partition(cards, left, right)
        quick_sort(cards, left, pivot_idx - 1)
        quick_sort(cards, pivot_idx + 1, right)

quick_sort(cards, 0, n-1)

is_stable = True
for suit, num in cards:
    if initial_order[num]() != suit:
        is_stable = False
        break

print("Stable") if is_stable else print("Not stable")
for card in cards:
    print("{} {}".format(card[0], card[1]))
```

</details>

## ALDS1_6_D: Minimum Cost Sort

<details>
<summary>答え</summary>

配列全体の最小値を使って整列させたときのコストと正しい位置にない要素たちの中の最小値を使って整列させたときのコストを比較して小さい方が正解．らしい．

Not Yet...

<!-- ```python
``` -->

</details>

## ALDS1_7_A: Rooted Trees

<details>
<summary>答え</summary>

```python
class TreeNode:
    def __init__(self, idx, parent, children):
        self.idx = idx
        self.parent = parent
        self.children = children
    def depth(self):
        if self.parent is None:
            return 0
        ptr = self.parent
        ret = 0
        while ptr is not None:
            ptr = ptr.parent
            ret += 1
        return ret
    def node_type(self):
        if self.parent is None:
            return "root"
        if len(self.children) == 0:
            return "leaf"
        return "internal node"

n = int(input())
nodes = [TreeNode(i, None, []) for i in range(n)]
for _ in range(n):
    info = list(map(int, input().split()))
    idx = info[0]
    children = info[2:]
    for child in children:
        nodes[idx].children.append(nodes[child])
        nodes[child].parent = nodes[idx]

for node in nodes:
    print("node {}: parent = {}, depth = {}, {}, {}".format(node.idx, node.parent.idx if node.parent is not None else -1, node.depth(), node.node_type(), [child.idx for child in node.children]))
```

</details>

## ALDS1_7_B: Binary Trees

<details>
<summary>答え</summary>

```python
class BinaryTreeNode:
    def __init__(self, idx, parent, left, right):
        self.idx = idx
        self.parent = parent
        self.left = left
        self.right = right

    def degree(self):
        if self.left is not None and self.right is not None:
            return 2
        if self.left is None and self.right is None:
            return 0
        return 1

    def depth(self):
        if self.parent is None:
            return 0
        ptr = self.parent
        ret = 0
        while ptr is not None:
            ptr = ptr.parent
            ret += 1
        return ret

    def height(self):
        if self.left is None and self.right is None:
            return 0
        if self.left is None and self.right is not None:
            return self.right.height() + 1
        if self.left is not None and self.right is None:
            return self.left.height() + 1
        return max(self.left.height(), self.right.height()) + 1

    def node_type(self):
        if self.parent is None:
            return "root"
        if self.left is None and self.right is None:
            return "leaf"
        return "internal node"

    def sibling(self):
        if self.parent is None:
            return None
        if self is self.parent.left:
            return self.parent.right
        else:
            return self.parent.left

n = int(input())
nodes = [BinaryTreeNode(i, None, None, None) for i in range(n)]
for _ in range(n):
    info = list(map(int, input().split()))
    idx = info[0]
    left = info[1]
    right = info[2]
    node = nodes[idx]
    if left != -1:
        node.left = nodes[left]
        nodes[left].parent = nodes[idx]
    if right != -1:
        node.right = nodes[right]
        nodes[right].parent = nodes[idx]

for node in nodes:
    print("node {}: parent = {}, sibling = {}, degree = {}, depth = {}, height = {}, {}".format(node.idx, node.parent.idx if node.parent is not None else -1, node.sibling().idx if node.sibling() is not None else -1, node.degree(), node.depth(), node.height(), node.node_type()))
```

</details>

## ALDS1_7_C: Tree Walk

<details>
<summary>答え</summary>

```python
class BinaryTreeNode:
    def __init__(self, idx, parent=None, left=None, right=None):
        self.idx = idx
        self.parent = parent
        self.left = left
        self.right = right

n = int(input())
nodes = [BinaryTreeNode(idx) for idx in range(n)]

for i in range(n):
    idx, left, right = map(int, input().split())
    if left != -1:
        nodes[idx].left = nodes[left]
        nodes[left].parent = nodes[idx]
    if right != -1:
        nodes[idx].right = nodes[right]
        nodes[right].parent = nodes[idx]

root = None
for node in nodes:
    if node.parent is None:
        root = node
        break

def preorder(root):
    ret = []
    def rec(root):
        if root is None:
            return
        ret.append(root.idx)
        rec(root.left)
        rec(root.right)
    rec(root)
    return ret

def inorder(root):
    ret = []
    def rec(root):
        if root is None:
            return
        rec(root.left)
        ret.append(root.idx)
        rec(root.right)
    rec(root)
    return ret

def postorder(root):
    ret = []
    def rec(root):
        if root is None:
            return
        rec(root.left)
        rec(root.right)
        ret.append(root.idx)
    rec(root)
    return ret

print("Preorder")
print("", *preorder(root))
print("Inorder")
print("", *inorder(root))
print("Postorder")
print("", *postorder(root))
```

</details>

## ALDS1_7_D: Reconstruction of a Tree

<details>
<summary>答え</summary>

```python
class BinaryTreeNode:
    def __init__(self, idx, left=None, right=None):
        self.idx = idx
        self.left = left
        self.right = right

n = int(input())
preorder = list(map(int, input().split()))
inorder = list(map(int, input().split()))

def build_binary_tree(preorder, inorder):
    if len(inorder) == 0:
        return None
    idx = inorder.index(preorder.pop(0))
    root = BinaryTreeNode(inorder[idx])
    root.left = build_binary_tree(preorder, inorder[:idx])
    root.right = build_binary_tree(preorder, inorder[idx+1:])
    return root

def postorder(root):
    ret = []
    def rec(root):
        if root is None:
            return
        rec(root.left)
        rec(root.right)
        ret.append(root.idx)
    rec(root)
    return ret

root = build_binary_tree(preorder, inorder)
print(*postorder(root))
```

</details>

## ALDS1_8_A: Binary Search Tree I

<details>
<summary>答え</summary>

```python
class BSTNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder_traverse(root):
    ret = []
    def rec(root):
        if root is None:
            return
        rec(root.left)
        ret.append(root.val)
        rec(root.right)
    rec(root)
    return ret

def preorder_traverse(root):
    ret = []
    def rec(root):
        if root is None:
            return
        ret.append(root.val)
        rec(root.left)
        rec(root.right)
    rec(root)
    return ret

def insert(root, val):
    if root is None:
        return BSTNode(val)
    parent = None
    ptr = root
    while ptr is not None:
        parent = ptr
        if val < ptr.val:
            ptr = ptr.left
        else:
            ptr = ptr.right
    if val < parent.val:
        parent.left = BSTNode(val)
    else:
        parent.right = BSTNode(val)
    return root

root = None

n = int(input())
for _ in range(n):
    command = input().split()
    if command[0] == "insert":
        val = int(command[1])
        root = insert(root, val)
    else:
        print("", *inorder_traverse(root))
        print("", *preorder_traverse(root))
```

</details>

## ALDS1_8_B: Binary Search Tree II

<details>
<summary>答え</summary>

```python
class BSTNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder_traverse(root):
    ret = []
    def rec(root):
        if root is None:
            return
        rec(root.left)
        ret.append(root.val)
        rec(root.right)
    rec(root)
    return ret

def preorder_traverse(root):
    ret = []
    def rec(root):
        if root is None:
            return
        ret.append(root.val)
        rec(root.left)
        rec(root.right)
    rec(root)
    return ret

def insert(root, val):
    if root is None:
        return BSTNode(val)
    parent = None
    ptr = root
    while ptr is not None:
        parent = ptr
        if val < ptr.val:
            ptr = ptr.left
        else:
            ptr = ptr.right
    if val < parent.val:
        parent.left = BSTNode(val)
    else:
        parent.right = BSTNode(val)
    return root

def find(root, val):
    if root is None:
        return False
    if root.val == val:
        return True
    if val < root.val:
        return find(root.left, val)
    else:
        return find(root.right, val)

root = None

n = int(input())
for _ in range(n):
    command = input().split()
    if command[0] == "insert":
        val = int(command[1])
        root = insert(root, val)
    elif command[0] == "find":
        val = int(command[1])
        if find(root, val):
            print("yes")
        else:
            print("no")
    else:
        print("", *inorder_traverse(root))
        print("", *preorder_traverse(root))
```

</details>

## ALDS1_8_C: Binary Search Tree III

<details>
<summary>答え</summary>

```python
class BSTNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder_traverse(root):
    ret = []
    def rec(root):
        if root is None:
            return
        rec(root.left)
        ret.append(root.val)
        rec(root.right)
    rec(root)
    return ret

def preorder_traverse(root):
    ret = []
    def rec(root):
        if root is None:
            return
        ret.append(root.val)
        rec(root.left)
        rec(root.right)
    rec(root)
    return ret

def insert(root, val):
    if root is None:
        return BSTNode(val)
    parent = None
    ptr = root
    while ptr is not None:
        parent = ptr
        if val < ptr.val:
            ptr = ptr.left
        else:
            ptr = ptr.right
    if val < parent.val:
        parent.left = BSTNode(val)
    else:
        parent.right = BSTNode(val)
    return root

def find(root, val):
    if root is None:
        return False
    if root.val == val:
        return True
    if val < root.val:
        return find(root.left, val)
    else:
        return find(root.right, val)

def _delete_minimum(root):
    if root.left is None:
        return root.val, None
    else:
        val, root.left = _delete_minimum(root.left)
        return val, root

def delete(root, val):
    if root.val == val:
        if root.left is not None and root.right is not None:
            root.val, root.right = _delete_minimum(root.right)
        else:
            return root.left or root.right
    elif val < root.val and root.left is not None:
        root.left = delete(root.left, val)
    elif root.val < val and root.right is not None:
        root.right = delete(root.right, val)
    return root

root = None

n = int(input())
for _ in range(n):
    command = input().split()
    if command[0] == "insert":
        val = int(command[1])
        root = insert(root, val)
    elif command[0] == "find":
        val = int(command[1])
        if find(root, val):
            print("yes")
        else:
            print("no")
    elif command[0] == "delete":
        val = int(command[1])
        root = delete(root, val)
    else:
        print("", *inorder_traverse(root))
        print("", *preorder_traverse(root))
```

</details>

## ALDS1_8_D: Treap

<details>
<summary>答え</summary>

```python
class TreapNode:
    def __init__(self, key, priority, left=None, right=None):
        self.key = key
        self.priority = priority
        self.left = left
        self.right = right

def inorder_traversal(root):
    ret = []
    def rec(root):
        if root is None:
            return
        rec(root.left)
        ret.append(root.key)
        rec(root.right)
    rec(root)
    return ret

def preorder_traversal(root):
    ret = []
    def rec(root):
        if root is None:
            return
        ret.append(root.key)
        rec(root.left)
        rec(root.right)
    rec(root)
    return ret

def _right_rotate(root):
    rotated_root = root.left
    root.left = rotated_root.right
    rotated_root.right = root
    return rotated_root

def _left_rotate(root):
    rotated_root = root.right
    root.right = rotated_root.left
    rotated_root.left = root
    return rotated_root

def insert(root, key, priority):
    if root is None:
        return TreapNode(key, priority)

    if key == root.key:
        return root

    if key < root.key:
        root.left = insert(root.left, key, priority)
        if root.priority < root.left.priority:
            root = _right_rotate(root)
    else:
        root.right = insert(root.right, key, priority)
        if root.priority < root.right.priority:
            root = _left_rotate(root)

    return root

def find(root, key):
    if root is None:
        return None
    if key == root.key:
        return root
    if key < root.key:
        return find(root.left, key)
    else:
        return find(root.right, key)

def _delete(root, key):
    if root.left is None and root.right is None:
        return None
    elif root.left is None:
        root = _left_rotate(root)
    elif root.right is None:
        root = _right_rotate(root)
    else:
        if root.right.priority < root.left.priority:
            root = _right_rotate(root)
        else:
            root = _left_rotate(root)
    return delete(root, key)

def delete(root, key):
    if root is None:
        return None

    if key < root.key:
        root.left = delete(root.left, key)
    elif root.key < key:
        root.right = delete(root.right, key)
    else:
        return _delete(root, key)
    return root

root = None

n = int(input())
for _ in range(n):
    command = input().split()
    if command[0] == "insert":
        key = int(command[1])
        priority = int(command[2])
        root = insert(root, key, priority)
    elif command[0] == "find":
        key = int(command[1])
        if find(root, key) is not None:
            print("yes")
        else:
            print("no")
    elif command[0] == "delete":
        key = int(command[1])
        root = delete(root, key)
    else: # command[0] == "print":
        print("", *inorder_traversal(root))
        print("", *preorder_traversal(root))
```

</details>

## ALDS1_9_A: Complete Binary Tree

<details>
<summary>答え</summary>

```python
class HeapNode:
    def __init__(self, idx, key, parent=None, left=None, right=None):
        self.idx = idx
        self.key = key
        self.parent = parent
        self.left = left
        self.right = right

n = int(input())
heap = list(map(int, input().split()))
nodes = [None]* (n + 1)
for idx, key in enumerate(heap):
    idx += 1
    node = HeapNode(
        idx,
        key,
        parent=idx // 2 if idx // 2 != 0 else -1,
        left=idx * 2 if idx * 2 <= n else -1,
        right=idx * 2 + 1 if idx * 2 + 1 <= n else -1
    )
    nodes[idx] = node

for node in nodes[1:]:
    line = "node {}: key = {}, ".format(node.idx, node.key)
    line += "parent key = {}, ".format(nodes[node.parent].key) if node.parent != -1 else ""
    line += "left key = {}, ".format(nodes[node.left].key) if node.left != -1 else ""
    line += "right key = {}, ".format(nodes[node.right].key) if node.right != -1 else ""
    print(line)

```

</details>

## ALDS1_9_B: Maximum Heap

<details>
<summary>答え</summary>

```python
def max_heapify(arr, i):
    left_idx = 2*i + 1
    right_idx = 2*i + 2
    largest = -1
    if left_idx < len(arr) and arr[left_idx] > arr[i]:
        largest = left_idx
    else:
        largest = i
    if right_idx < len(arr) and arr[right_idx] > arr[largest]:
        largest = right_idx

    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        max_heapify(arr, largest)

def build_max_heap(arr):
    for i in range(len(arr) // 2 - 1, -1, -1):
        max_heapify(arr, i)

_ = int(input())
arr = list(map(int, input().split()))
build_max_heap(arr)
print("", *arr)
```

</details>

## ALDS1_9_C: Priority Queue

<details>
<summary>答え</summary>

```python
import heapq
heap = []

while True:
    command = input().split()
    if command[0] == "end":
        break
    elif command[0] == "insert":
        key = int(command[1])
        heapq.heappush(heap, -key)
    elif command[0] == "extract":
        print(-heapq.heappop(heap))
```

</details>

## ALDS1_9_D: Heap Sort

<details>
<summary>答え</summary>

隣接項の大小関係が毎回逆転すればいい？ちがう？

```python
N = int(input())
*A, = map(int, input().split())
A.sort()
for i in range(N - 1):
    j = i
    while j > 0:
        k = (j - 1) // 2
        A[j], A[k] = A[k], A[j]
        j = k
    A[0], A[i + 1] = A[i + 1], A[0]
print(*A)
```

</details>

## ALDS1_10_A: Fibonacci Number

<details>
<summary>答え</summary>

```python
n = int(input())

memo = [-1] * 50

def fibo(n, memo):
    if memo[n] != -1:
        return memo[n]
    if n == 0:
        return 1
    if n == 1:
        return 1
    memo[n] =  fibo(n - 1, memo) + fibo(n - 2, memo)
    return memo[n]

print(fibo(n, memo))
```

</details>

## ALDS1_10_B: Matrix Chain Multiplication

<details>
<summary>答え</summary>

行数$a$・列数$b$の行列と行数$b$・列数$c$の行列の掛け算に必要な要素同士の掛け算は$a \times b \times c$回．

`p[i] (1 <= i)`：$M_{i}$の列数 = $M_{i+1}$の行数
`dp[i][j] (1 <= i, 1 <= j)`：$M_i$から$M_j$までの積を計算するときの要素同士の掛け算の最小回数

```python
N = 110
dp = [[0 for _ in range(N)] for _ in range(N)]
n = int(input())
p = [0] * N
for i in range(1, n + 1):
    h, w = map(int, input().split())
    p[i - 1] = h
    p[i] = w

for l in range(2, n + 1):
    for i in range(n - l + 2):
        min_cost = float("inf")
        j = i + l - 1
        for k in range(i, j):
            if k == i:
                min_cost = dp[k + 1][j] + p[i - 1] * p[k] * p[j]
            else:
                min_cost = min(min_cost, dp[i][k] + p[i - 1] * p[k] * p[j] + dp[k + 1][j])
        dp[i][j] = min_cost
print(dp[1][n])
```

</details>

## ALDS1_10_C: Longest Common Subsequence

<details>
<summary>答え</summary>

`dp[i][j]`：`X[:i]`と`Y[:j]`の LCS の長さ

```py
dp[i+1][j+1] =
    if X[i+1] == Y[j+1]:
        dp[i][j] + 1
    else:
        max(dp[i][j+1], dp[i][j+1])
```

このコードだと TLE．

```python
n = int(input())
for _ in range(n):
    X = input().strip()
    Y = input().strip()
    lenx = len(X)
    leny = len(Y)

    dp = [[0 for _ in range(leny)] for _ in range(lenx)]

    same_flag = False
    for i in range(lenx):
        if same_flag or X[i] == Y[0]:
            dp[i][0] = 1
            same_flag = True

    same_flag = False
    for j in range(leny):
        if same_flag or Y[j] == X[0]:
            dp[0][j] = 1
            same_flag = True

    for i in range(0, lenx - 1):
        for j in range(0, leny - 1):
            if X[i+1] == Y[j+1]:
                dp[i+1][j+1] = dp[i][j] + 1
            else:
                dp[i+1][j+1] = max(dp[i+1][j], dp[i][j+1])

    print(dp[-1][-1])
```

</details>

## ALDS1_10_D: Optimal Binary Search Tree

<details>
<summary>答え</summary>

Not Yet...

```python
pass
```

</details>

## ALDS1_11_A: Graph

<details>
<summary>答え</summary>

```python
n = int(input())
G = [[] for _ in range(n)]
for _ in range(n):
    info = list(map(int, input().split()))
    node = info[0] - 1
    num_neighbor = info[1]
    neighbors = info[2:]
    for neighbor in neighbors:
        G[node].append(neighbor - 1)

adj = [[0 for _ in range(n)] for _ in range(n)]
for node in range(n):
    for neighbor in G[node]:
        adj[node][neighbor] = 1

for r in adj:
    print(*r)
```

</details>

## ALDS1_11_B: Depth First Search

<details>
<summary>答え</summary>

発見時刻は行きがけ時，終了時刻は帰りがけ時に計測．

```python
n = int(input())
G = [[] for _ in range(n)]
for _ in range(n):
    info = list(map(int, input().split()))
    nid = info[0] - 1
    for neighbor in info[2:]:
        neighbor -= 1
        G[nid].append(neighbor)

time_in = [0] * n
time_out = [0] * n
has_visited = set()

clock = 1

def dfs(node):
    global clock
    time_in[node] = clock
    clock += 1

    for neighbor in G[node]:
        if neighbor in has_visited:
            continue
        has_visited.add(neighbor)
        dfs(neighbor)

    time_out[node] = clock
    clock += 1

for i in range(n):
    if i in has_visited:
        continue
    has_visited.add(i)
    dfs(i)

for node in range(n):
    print("{} {} {}".format(node + 1, time_in[node], time_out[node]))
```

</details>

## ALDS1_11_C: Breadth First Search

<details>
<summary>答え</summary>

```python
n = int(input())
G = [[] for _ in range(n)]
for _ in range(n):
    info = list(map(int, input().split()))
    nid = info[0] - 1
    for neighbor in info[2:]:
        neighbor -= 1
        G[nid].append(neighbor)

dist = [-1] * n

def bfs(node):
    suspended = [node]
    dist[node] = 0
    while len(suspended) != 0:
        u = suspended.pop(0)
        for v in G[u]:
            if dist[v] == -1:
                suspended.append(v)
                dist[v] = dist[u] + 1

bfs(0)

for node in range(n):
    print("{} {}".format(node + 1, dist[node]))
```

</details>

## ALDS1_11_D: Connected Components

<details>
<summary>答え</summary>

DFS でも BFS でも答えは出るけど TLE．下のコードは DFS で書いたもの．

```python
n, m = map(int, input().split())
G = [[] for _ in range(n)]
for _ in range(m):
    s, t = map(int, input().split())
    G[s].append(t)
    G[t].append(s)

q = int(input())
for _ in range(q):
    s, t = map(int, input().split())
    has_visited = set()
    has_visited.add(s)
    suspended = [s]
    while suspended:
        u = suspended.pop()
        for n in G[u]:
            if n not in has_visited:
                suspended.append(n)
                has_visited.add(n)
    if t in has_visited:
        print("yes")
    else:
        print("no")
```

UnionFind 木を使うやり方で通る．

```python
class UnionFind:
    def __init__(self, size):
        self.size = size
        self.parents = [-1] * size

    # xの親を返す
    def find(self, x):
        if self.parents[x] < 0:
            return x # x自身が親
        else:
            # 親を再帰的に探す
            self.parents[x] = self.find(self.parents[x])
            return self.parents[x]

    # xとyをまとめる
    def union(self, x, y):
        x = self.find(x)
        y = self.find(y)

        # 親が一緒なのですでにまとまっている
        if x == y:
            return

        if self.parents[x] > self.parents[y]:
            x, y = y, x

        # xの配下にyを入れる
        self.parents[x] += self.parents[y]
        self.parents[y] = x # yの親をxにする

    def same(self, x, y):
        return self.find(x) == self.find(y)

n, m = map(int, input().split())

uf = UnionFind(n)
for _ in range(m):
    s, t = map(int, input().split())
    uf.union(s, t)

q = int(input())
for _ in range(q):
    s, t = map(int, input().split())
    print("yes") if uf.same(s, t) else print("no")
```

</details>

## ALDS1_12_A: Minimum Spanning Tree

<details>
<summary>答え</summary>

クラスカル法

```python
# クラスカル法
# (1) 森F（各頂点だけからかる木の集合）を生成
# (2) 辺がなくなるまで，辺(s, t)を重みの小さい順に取り出し，sとtが別の木に所属していたらsの木とtの木をマージして辺(s, t)を最小全域木に追加
import heapq

class UnionFind:
    def __init__(self, size):
        self.size = size
        self.parents = [-1] * size

    def find(self, x):
        if self.parents[x] < 0:
            return x
        self.parents[x] = self.find(self.parents[x])
        return self.parents[x]

    def union(self, x, y):
        x = self.find(x)
        y = self.find(y)
        if x == y:
            return
        if self.parents[x] > self.parents[y]:
            x, y = y, x
        self.parents[x] += self.parents[y]
        self.parents[y] = x

    def same(self, x, y):
        return self.find(x) == self.find(y)

n = int(input())

uf = UnionFind(n)
heap = []

for s in range(n):
    line = map(int, input().split())
    for t, weight in enumerate(line):
        if weight == -1:
            continue
        else:
            heap.append((weight, s, t))

heapq.heapify(heap)
mst_weight = 0
while heap:
    weight, s, t = heapq.heappop(heap)
    if not uf.same(s, t):
        mst_weight += weight
        uf.union(s, t)
print(mst_weight)
```

プリム法

```python
# プリム法
# (1) V = [任意の頂点一つ]
# (2) Vがすべての頂点を含むまで，(s in V, t not in V）で重み最小の辺を取り出して木に加えることを繰り返す

import heapq

n = int(input())
G = [[] for _ in range(n)]
for i in range(n):
    line = list(map(int, input().split()))
    for j, weight in enumerate(line):
        if weight == -1:
            continue
        else:
            G[i].append((j, weight))

has_used = {0}
heap = [(weight, t) for (t, weight) in G[0]]
heapq.heapify(heap)

mst_weight = 0
while heap:
    weight, t = heapq.heappop(heap)
    if t in has_used:
        continue
    has_used.add(t)
    mst_weight += weight
    for u, weight in G[t]:
        if u in has_used:
            continue
        heapq.heappush(heap, (weight, u))

print(mst_weight)
```

</details>

## ALDS1_12_B: Single Source Shortest Path I

<details>
<summary>答え</summary>

```python
import heapq

n = int(input())
G = [[] for _ in range(n)]
for _ in range(n):
    line = list(map(int, input().split()))
    u = line[0]
    k = line[1]
    G[u] = [()] * k
    for i in range(0, k):
        v = line[(i+1)*2]
        weight = line[(i+1)*2 + 1]
        G[u][i] = (v, weight)

def dijkstra(G, s):
    dist = [float("inf")] * len(G)
    has_visited = set()
    dist[s] = 0
    suspended = [(0, s)]
    while suspended:
        _, u = heapq.heappop(suspended)
        if u in has_visited:
            continue
        has_visited.add(u)
        for v, uv_cost in G[u]:
            if v in has_visited:
                continue
            new_dist = dist[u] + uv_cost
            if new_dist < dist[v]:
                dist[v] = new_dist
                heapq.heappush(suspended, (new_dist, v))
    return dist

ans = dijkstra(G, 0)
for idx, dist in enumerate(ans):
    print(idx, dist)
```

</details>

## ALDS1_12_C: Single Source Shortest Path II

<details>
<summary>答え</summary>

```python
import heapq

n = int(input())
G = [[] for _ in range(n)]
for _ in range(n):
    line = list(map(int, input().split()))
    u = line[0]
    k = line[1]
    G[u] = [()] * k
    for i in range(0, k):
        v = line[(i+1)*2]
        weight = line[(i+1)*2 + 1]
        G[u][i] = (v, weight)

def dijkstra(G, s):
    dist = [float("inf")] * len(G)
    has_visited = set()
    dist[s] = 0
    suspended = [(0, s)]
    while suspended:
        _, u = heapq.heappop(suspended)
        if u in has_visited:
            continue
        has_visited.add(u)
        for v, uv_cost in G[u]:
            if v in has_visited:
                continue
            new_dist = dist[u] + uv_cost
            if new_dist < dist[v]:
                dist[v] = new_dist
                heapq.heappush(suspended, (new_dist, v))
    return dist

ans = dijkstra(G, 0)
for idx, dist in enumerate(ans):
    print(idx, dist)
```

</details>

## ALDS1_13_A: 8 Queens Problem

<details>
<summary>答え</summary>

DFS．

```python
n = int(input())
pos = []
for _ in range(n):
    row, col = map(int, input().split())
    pos.append((row, col))

N = 8

board = [[0 for _ in range(N)] for _ in range(N)]

queens = [0 for _ in range(N)]

def print_board(queens):
    for pos in queens:
        print("." * pos + "Q" + (N - pos - 1) * ".")

def update_board(board, row, col, set_flag):

    # 横を埋める
    for _col in range(N):
        board[row][_col] += set_flag

    # 縦を埋める
    for _row in range(N):
        board[_row][col] += set_flag

    board[row][col] += set_flag

    _row = row
    _col = col
    # (+1, +1)
    while _row + 1 < N and _col + 1 < N:
        _row += 1
        _col += 1
        board[_row][_col] += set_flag

    _row = row
    _col = col
    # (-1, +1)
    while 0 <= _row - 1 and _col + 1 < N:
        _row -= 1
        _col += 1
        board[_row][_col] += set_flag

    _row = row
    _col = col
    # (+1, -1)
    while _row + 1 < N and 0 <= _col - 1:
        _row += 1
        _col -= 1
        board[_row][_col] += set_flag

    _row = row
    _col = col
    # (-1, -1)
    while 0 <= _row - 1 and 0 <= _col - 1:
        _row -= 1
        _col -= 1
        board[_row][_col] += set_flag

def set_queen(queens, board, row):
    if row == N:
        if all([queens[r] == c for r, c in pos]):
            print_board(queens)
            exit()
        return
    for col in range(N):
        if board[row][col] == 0:
            queens[row] = col
            update_board(board, row, col, 1)
            set_queen(queens, board, row + 1)
            update_board(board, row, col, -1)

set_queen(queens, board, 0)
```

</details>

## ALDS1_13_B: 8 Puzzle

<details>
<summary>答え</summary>

片方だけからの BFS だと，初期の盤によってはゴールまでの探索範囲が大きすぎて TLE．

```python
from collections import deque

moves = {"U": (0, -1), "D": (0, 1), "R": (1, 0), "L": (-1, 0)}

def get_next(board):
    for d in "UDRL":
        zero_idx = board.index(0)
        dst_row = zero_idx % 3 + moves[d][0]
        dst_col = zero_idx // 3 + moves[d][1]
        if 0 <= dst_row < 3 and 0 <= dst_col < 3:
            dst_idx = dst_row + 3 * dst_col
            next_board = list(tuple(board))
            next_board[zero_idx], next_board[dst_idx] = next_board[dst_idx], next_board[zero_idx]
            yield d, tuple(next_board)

def BFS(init_board):
    queue = deque([(init_board, "")])
    has_visited = set()
    while queue:
        board, sofar = queue.popleft()
        if board == (1, 2, 3, 4, 5, 6, 7, 8, 0):
            return len(sofar)
        for direction, next_board in get_next(board):
            if next_board not in has_visited:
                queue.append((next_board, sofar + direction))

board = []
for _ in range(3):
    a, b, c = map(int, input().split())
    board.append(a)
    board.append(b)
    board.append(c)

print(BFS(board))
```

TODO: ゴールからも同時に BFS して衝突したら答えという感じに実装したい．

</details>

## ALDS1_13_C: 15 Puzzle

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>

## ALDS1_14_A: Naive String Search

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>

## ALDS1_14_B: String Search

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>

## ALDS1_14_C: Pattern Search

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>

## ALDS1_14_D: Multiple String Matching

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>

## ALDS1_15_A: Change Making

<details>
<summary>答え</summary>

```python
n = int(input())
coins = [25, 10, 5, 1]
ans = 0
for coin in coins:
    ans += n // coin
    n %= coin
print(ans)
```

</details>

## ALDS1_15_B: Fractional Knapsack Problem

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>

## ALDS1_15_C: Activity Selection Problem

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>

## ALDS1_15_D: Huffman Coding

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>
