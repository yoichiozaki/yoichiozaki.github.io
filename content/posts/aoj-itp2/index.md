---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "AOJ ITP2 in Python"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-04-12T21:09:57+09:00
lastmod: 2021-04-12T21:09:57+09:00
featured: false
draft: true
---

[AOJ-ITP2](https://judge.u-aizu.ac.jp/onlinejudge/finder.jsp?course=ITP2)を Python で解く．

## ITP2_1_A: Vector

<details>
<summary>答え</summary>

```python
arr = []

q = int(input())

for _ in range(q):
    command = input().split()
    if command[0] == "0":
        arr.append(command[1])
    elif command[0] == "1":
        print(arr[int(command[1])])
    else:
        arr.pop()
```

</details>

## ITP2_1_B: Deque

<details>
<summary>答え</summary>

```python
from collections import deque
arr = deque([])

q = int(input())

for _ in range(q):
    command = input().split()
    if command[0] == "0":
        if command[1] == "0":
            arr.appendleft(command[2])
        else:
            arr.append(command[2])
    elif command[0] == "1":
        print(arr[int(command[1])])
    else:
        if command[1] == "0":
            arr.popleft()
        else:
            arr.pop()
```

</details>

## ITP2_1_C: List

<details>
<summary>答え</summary>

```python
class ListNode:
    def __init__(self, val=float("inf"), prev=None, next=None):
        self.val = val
        self.prev = prev
        self.next = next

def insert(x, ptr):
    node = ListNode(val=x, prev=ptr.prev, next=ptr)
    ptr.prev.next = node
    ptr.prev = node
    ptr = node
    return ptr

def move(d, ptr):
    if 0 < d:
        for _ in range(d):
            ptr = ptr.next
    else:
        for _ in range(-d):
            ptr = ptr.prev
    return ptr

def erase(ptr):
    ptr.next.prev = ptr.prev
    ptr.prev.next = ptr.next
    ptr = ptr.next
    return ptr

root = ListNode()
sentinel = ListNode(prev=root)
root.next = sentinel
ptr = sentinel

q = int(input())
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        x = int(command[1])
        ptr = insert(x, ptr)
    elif command[0] == "1":
        d = int(command[1])
        ptr = move(d, ptr)
    else:
        ptr = erase(ptr)

itr = root.next
while itr.next:
    print(itr.val)
    itr = itr.next
```

</details>

## ITP2_1_D: Vector II

<details>
<summary>答え</summary>

```python
n, q = map(int, input().split())

A = [[] for _ in range(n)]
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        t = int(command[1])
        x = int(command[2])
        A[t].append(x)
    elif command[0] == "1":
        t = int(command[1])
        print(*A[t])
    else:
        t = int(command[1])
        A[t] = []
```

</details>

## ITP2_2_A: Stack

<details>
<summary>答え</summary>

```python
n, q = map(int, input().split())

A = [[] for _ in range(n)]
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        t = int(command[1])
        x = int(command[2])
        A[t].append(x)
    elif command[0] == "1":
        t = int(command[1])
        if A[t]:
            print(A[t][-1])
    else:
        t = int(command[1])
        if A[t]:
            A[t].pop()
```

</details>

## ITP2_2_B: Queue

<details>
<summary>答え</summary>

```python
import collections

n, q = map(int, input().split())

A = [collections.deque([]) for _ in range(n)]
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        t = int(command[1])
        x = int(command[2])
        A[t].append(x)
    elif command[0] == "1":
        t = int(command[1])
        if A[t]:
            print(A[t][0])
    else:
        t = int(command[1])
        if A[t]:
            A[t].popleft()
```

</details>

## ITP2_2_C: Priority Queue

<details>
<summary>答え</summary>

```python
from heapq import heappop, heappush

n, q = map(int, input().split())

A = [[] for _ in range(n)]
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        t = int(command[1])
        x = int(command[2])
        heappush(A[t], -x)
    elif command[0] == "1":
        t = int(command[1])
        if A[t]:
            print(-A[t][0])
    else:
        t = int(command[1])
        if A[t]:
            heappop(A[t])
```

</details>

## ITP2_2_D: Splice

<details>
<summary>答え</summary>

何も考えずに実装すると TLE．`extend`で時間がかかってる？

```python
n, q = map(int, input().split())

L = [[] for _ in range(n)]

for _ in range(q):
    command = input().split()
    if command[0] == "0":
        t = int(command[1])
        x = int(command[2])
        L[t].append(x)
    elif command[0] == "1":
        t = int(command[1])
        print(*L[t])
    else: # command[0] == "2":
        s = int(command[1])
        t = int(command[2])
        L[t].extend(L[s])
        L[s] = []
```

`L[i]`の`extend`を高速に行いたいので連結リストを実装する．

```python
class ListNode:
    def __init__(self, val=0, prev=None, next=None):
        self.val = val
        self.prev = prev
        self.next = next

def insert_at_tail(tail, val):
    new_tail = ListNode(val=val, prev=tail, next=None)
    tail.next = new_tail
    return new_tail

def dump(head):
    ret = []
    ptr = head
    while ptr is not None:
        ret.append(ptr.val)
        ptr = ptr.next
    print(*ret)

n, q = map(int, input().split())

L = [[None, None] for _ in range(n)] # [(head, tail), ...]

for _ in range(q):
    command = input().split()

    if command[0] == "0":
        t = int(command[1])
        x = int(command[2])
        if L[t][1] is None:
            new_node = ListNode(x)
            L[t][0] = new_node
            L[t][1] = new_node
        else:
            L[t][1] = insert_at_tail(L[t][1], x)
    elif command[0] == "1":
        t = int(command[1])
        dump(L[t][0])
    else: # command[0] == "2":
        s = int(command[1])
        t = int(command[2])
        s_head = L[s][0]
        t_tail = L[t][1]
        if s_head is None:
            pass
        elif t_tail is None:
            L[t][0] = L[s][0]
            L[t][1] = L[s][1]
            L[s][0] = L[s][1] = None
        else:
            L[t][1].next = L[s][0]
            L[s][0].prev = L[t][1]
            L[t][1] = L[s][1]
            L[s][0] = None
            L[s][1] = None
```

</details>

## ITP2_3_A: Min-Max

<details>
<summary>答え</summary>

```python
a, b, c = map(int, input().split())
print(min(a, b, c), max(a, b, c))
```

</details>

## ITP2_3_B: Min-Max Element

<details>
<summary>答え</summary>

```python
_ = input()
arr = list(map(int, input().split()))
q = int(input())
for _ in range(q):
    comm, b, e = map(int, input().split())
    if comm == 0:
        print(min(arr[b:e]))
    else:
        print(max(arr[b:e]))
```

</details>

## ITP2_3_C: Count

<details>
<summary>答え</summary>

```python
_ = input()
arr = list(map(int, input().split()))
q = int(input())

def count(arr, k):
    return sum([1 for ele in arr if ele == k])

for _ in range(q):
    b, e, k = map(int, input().split())
    print(count(arr[b:e], k))
```

</details>

## ITP2_3_D: Lexicographical Comparison

<details>
<summary>答え</summary>

```python
_ = input()
a = "".join(input().split())
_ = input()
b = "".join(input().split())

print(1 if a < b else 0)
```

</details>

## ITP2_4_A: Reverse

<details>
<summary>答え</summary>

```python
_ = input()
arr = list(map(int, input().split()))
q = int(input())
for _ in range(q):
    b, e = map(int, input().split())
    arr = arr[:b] + list(reversed(arr[b:e])) + arr[e:]
print(*arr)
```

</details>

## ITP2_4_B: Rotate

<details>
<summary>答え</summary>

```python
_ = input()
arr = list(map(int, input().split()))
q = int(input())
for _ in range(q):
	b, m, e = map(int, input().split())
	s = arr[b:e]
	arr = arr[:b] + s[m-b:] + s[:m-b] + arr[e:]
print(*arr)
```

</details>

## ITP2_4_C: Swap

<details>
<summary>答え</summary>

```python
_ = input()
arr = list(map(int, input().split()))
q = int(input())
for _ in range(q):
	b, e, t = map(int, input().split())
	for k in range(e - b):
	    arr[b + k], arr[t + k] = arr[t + k], arr[b + k]
print(*arr)
```

</details>

## ITP2_4_D: Uniqu

<details>
<summary>答え</summary>

```python
_ = input()
print(*sorted(list(set(list(map(int, input().split()))))))
```

</details>

## ITP2_5_A: Sorting Pairs

<details>
<summary>答え</summary>

```python
n = int(input())
points = []
for _ in range(n):
    (x, y) = map(int, input().split())
    points.append((x, y))
for point in sorted(points):
    print(point[0], point[1])
```

</details>

## ITP2_5_B: Sorting Tuples

<details>
<summary>答え</summary>

```python
n = int(input())
items = []
for _ in range(n):
    item = input().split()
    items.append((int(item[0]), int(item[1]), item[2], int(item[3]), item[4]))
for item in sorted(items):
    print(*item)
```

</details>

## ITP2_5_C: Permutation

<details>
<summary>答え</summary>

```python
import copy
import bisect
n = int(input())
arr = list(map(int, input().split()))

def next_perm(arr):
    i = len(arr) - 1
    while 0 < i and arr[i-1] >= arr[i]:
        i -= 1
    if i == 0:
        arr.reverse()
        return
    i -= 1
    pivot = arr[i]
    j = len(arr) - 1
    while arr[j] <= pivot:
        j -= 1
    arr[i], arr[j] = arr[j], arr[i]
    arr[i+1:] = reversed(arr[i+1:])

def prev_perm(arr):
    i = len(arr) - 1
    while 0 < i and arr[i-1] <= arr[i]:
        i -= 1
    if i == 0:
        arr.reverse()
        return
    i -= 1
    pivot = arr[i]
    j = len(arr) - 1
    while arr[j] >= pivot:
        j -= 1
    # j = bisect.bisect_left(arr[i+1:], arr[i]) + i
    arr[i], arr[j] = arr[j], arr[i]
    arr[i+1:] = reversed(arr[i+1:])

prev_arr = copy.deepcopy(arr)
if prev_arr != sorted(arr):
    prev_perm(prev_arr)
    print(*prev_arr)

print(*arr)

next_arr = copy.deepcopy(arr)
if next_arr != sorted(arr, reverse=True):
    next_perm(next_arr)
    print(*next_arr)
```

</details>

## ITP2_5_D: Permutation Enumeration

<details>
<summary>答え</summary>

```python
n = int(input())

arr = [i for i in range(1, n+1)]

def permutation(arr):
    ret = []
    def rec(arr, sofar):
        if len(arr) == 0:
            ret.append(sofar)
            return
        for i in range(len(arr)):
            rec(arr[:i] + arr[i+1:], sofar + [arr[i]])
    rec(arr, [])
    return ret

for perm in permutation(arr):
    print(*perm)
```

</details>

## ITP2_6_A: Binary Search

<details>
<summary>答え</summary>

```python
_ = input()
arr = list(map(int, input().split()))
q = int(input())

def binary_search(arr, key):
    ok = len(arr)
    ng = -1
    def is_ok(mid):
        return k <= arr[mid]
    while 1 < abs(ok - ng):
        mid = (ng + ok) // 2
        if is_ok(mid):
            ok = mid
        else:
            ng = mid
    return ok

for _ in range(q):
    k = int(input())
    idx = binary_search(arr, k)
    print(1 if 0 <= idx < len(arr) and arr[idx] == k else 0)
```

`bisect`を使う例．

```python
from bisect import bisect_left
_ = input()
arr = list(map(int, input().split()))
q = int(input())

for _ in range(q):
    k = int(input())
    idx = bisect_left(arr, k)
    print(1 if 0 <= idx < len(arr) and arr[idx] == k else 0)
```

</details>

## ITP2_6_B: Includes

<details>
<summary>答え</summary>

$O(n \log n)$

```python
_ = input()
A = list(map(int, input().split()))
_ = input()
B = list(map(int, input().split()))

def binary_search(arr, key):
    ok = len(arr)
    ng = -1
    def is_ok(mid):
        return key <= arr[mid]
    while 1 < abs(ok - ng):
        mid = (ng + ok) // 2
        if is_ok(mid):
            ok = mid
        else:
            ng = mid
    return ok

def is_in(arr, ele):
    idx = binary_search(arr, ele)
    return 0 <= idx < len(arr) and arr[idx] == ele

for b in B:
    if not is_in(A, b):
        print(0)
        exit()
print(1)
```

`set`を使う例．$O(n)$

```python
_ = input()
A = set(list(map(int, input().split())))
_ = input()
B = list(map(int, input().split()))

for b in B:
    if b not in A:
        print(0)
        exit()
print(1)
```

</details>

## ITP2_6_C: Lower Bound

<details>
<summary>答え</summary>

```python
import bisect

_ = input()
arr = list(map(int, input().split()))
q = int(input())

for _ in range(q):
    k = int(input())
    print(bisect.bisect_left(arr, k))
```

</details>

## ITP2_6_D: Equal Range

<details>
<summary>答え</summary>

```python
import bisect

_ = input()
arr = list(map(int, input().split()))
q = int(input())

for _ in range(q):
    k = int(input())
    print(bisect.bisect_left(arr, k), bisect.bisect_right(arr, k))
```

</details>

## ITP2_7_A: Set: Search

<details>
<summary>答え</summary>

```python
s = set()
q = int(input())
for _ in range(q):
    command, x = map(int, input().split())
    if command == 0:
        s.add(x)
        print(len(s))
    else:
        print(1 if x in s else 0)
```

</details>

## ITP2_7_B: Set: Delete

<details>
<summary>答え</summary>

```python
s = set()
q = int(input())
for _ in range(q):
    command, x = map(int, input().split())
    if command == 0:
        s.add(x)
        print(len(s))
    elif command == 2:
        if x in s:
            s.remove(x)
    else:
        print(1 if x in s else 0)
```

</details>

## ITP2_7_C: Set: Range Search

<details>
<summary>答え</summary>

そのまま書いて TLE．

```python
from bisect import bisect_left, bisect_right

s = set()
q = int(input())
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        x = int(command[1])
        s.add(x)
        print(len(s))
    elif command[0] == "1":
        x = int(command[1])
        print(1 if x in s else 0)
    elif command[0] == "2":
        x = int(command[1])
        if x in s:
            s.remove(x)
    else:
        L = int(command[1])
        R = int(command[2])
        for ele in range(L, R+1):
            if ele in s:
                print(ele)
```

TODO: `MultiSet`

</details>

## ITP2_7_D: Multi-Set

<details>
<summary>答え</summary>

```python
table = dict()
q = int(input())
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        key = command[1]
        x = int(command[2])
        table[key] = x
    else:
        key = command[1]
        print(table[key])
```

</details>

## ITP2_8_A: Map: Search

<details>
<summary>答え</summary>

```python
table = dict()
q = int(input())
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        key = command[1]
        x = int(command[2])
        table[key] = x
    else:
        key = command[1]
        print(table.get(key, 0))
```

</details>

## ITP2_8_B: Map: Delete

<details>
<summary>答え</summary>

```python
table = dict()
q = int(input())
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        key = command[1]
        x = int(command[2])
        table[key] = x
    elif command[0] == "1":
        key = command[1]
        print(table.get(key, 0))
    elif command[0] == "2":
        key = command[1]
        table.pop(key, None)
```

</details>

## ITP2_8_C: Map: Range Search

<details>
<summary>答え</summary>

そのまま書くと TLE．

```python
table = dict()
q = int(input())
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        key = command[1]
        x = int(command[2])
        table[key] = x
    elif command[0] == "1":
        key = command[1]
        print(table.get(key, 0))
    elif command[0] == "2":
        key = command[1]
        table.pop(key, None)
    elif command[0] == "3":
        L = command[1]
        R = command[2]
        keys = sorted(table.keys())
        for key in keys:
            if L <= key <= R:
                print(key, table[key])
```

TODO: 解く

</details>

## ITP2_8_D: Multi-Map

<details>
<summary>答え</summary>

```python
print("Hello World")
```

TODO: 解く

</details>

## ITP2_9_A: Set Union

<details>
<summary>答え</summary>

```python
_ = input()
a = set(list(map(int, input().split())))
_ = input()
b = set(list(map(int, input().split())))
for ele in sorted(list(a | b)):
    print(ele)
```

</details>

## ITP2_9_B: Set Intersection

<details>
<summary>答え</summary>

```python
_ = input()
a = set(list(map(int, input().split())))
_ = input()
b = set(list(map(int, input().split())))
for ele in sorted(list(a & b)):
    print(ele)
```

</details>

## ITP2_9_C: Set Difference

<details>
<summary>答え</summary>

```python
_ = input()
a = set(list(map(int, input().split())))
_ = input()
b = set(list(map(int, input().split())))
for ele in sorted(list(a - b)):
    print(ele)
```

</details>

## ITP2_9_D: Set Symmetric Difference

<details>
<summary>答え</summary>

```python
_ = input()
a = set(list(map(int, input().split())))
_ = input()
b = set(list(map(int, input().split())))
for ele in sorted(list(a ^ b)):
    print(ele)
```

</details>

## ITP2_10_A: Bit Operation I

<details>
<summary>答え</summary>

```python
x = int(input())
MASK = (1 << 32) - 1
print("{:032b}".format(x))
print("{:032b}".format(~x & MASK))
print("{:032b}".format((x << 1) & MASK))
print("{:032b}".format((x >> 1) & MASK))
```

</details>

## ITP2_10_B: Bit Operation II

<details>
<summary>答え</summary>

```python
a, b = map(int, input().split())
MASK = (1 << 32) - 1
print("{:032b}".format(a & b))
print("{:032b}".format(a | b))
print("{:032b}".format(a ^ b))
```

</details>

## ITP2_10_C: Bit Flag

<details>
<summary>答え</summary>

```python
flags = 0
MASK = (1 << 64) - 1

q = int(input())
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        i = int(command[1])
        print(1 if flags & (1 << i) else 0)

    elif command[0] == "1":
        i = int(command[1])
        flags |= (1 << i)

    elif command[0] == "2":
        i = int(command[1])
        if flags & (1 << i):
            flags ^= (1 << i)

    elif command[0] == "3":
        i = int(command[1])
        flags ^= (1 << i)

    elif command[0] == "4":
        print(1 if flags & MASK == MASK else 0)

    elif command[0] == "5":
        print(1 if flags & MASK > 0 else 0)

    elif command[0] == "6":
        print(1 if flags & MASK == 0 else 0)

    elif command[0] == "7":
        print(bin(flags)[2:].count("1"))

    elif command[0] == "8":
        print(flags)
```

</details>

## ITP2_10_D: Bit Mask

<details>
<summary>答え</summary>

```python
flags = 0
MASK = (1 << 64) - 1

n = int(input())
M = [0 for _ in range(n)]
for i in range(n):
    _, *pos = map(int, input().split())
    M[i] = sum(1 << p for p in pos)

q = int(input())
for _ in range(q):
    command = input().split()
    if command[0] == "0":
        i = int(command[1])
        print(1 if flags & (1 << i) else 0)

    elif command[0] == "1":
        m = int(command[1])
        flags |= M[m]

    elif command[0] == "2":
        m = int(command[1])
        flags = (flags | M[m]) ^ M[m]

    elif command[0] == "3":
        m = int(command[1])
        flags ^= M[m]

    elif command[0] == "4":
        m = int(command[1])
        print(1 if flags & M[m] == M[m] else 0)

    elif command[0] == "5":
        m = int(command[1])
        print(1 if flags & M[m] > 0 else 0)

    elif command[0] == "6":
        m = int(command[1])
        print(1 if flags & M[m] == 0 else 0)

    elif command[0] == "7":
        m = int(command[1])
        print(bin(flags & M[m])[2:].count("1"))

    elif command[0] == "8":
        m = int(command[1])
        print(flags & M[m])
```

</details>

## ITP2_11_A: Enumeration of Subsets I

<details>
<summary>答え</summary>

```python
n = int(input())
for i in range(1 << n):
    arr = []
    for j in range(n):
        if i & (1 << j):
            arr.append(j)
    print("{}:".format(i), *arr)
```

</details>

## ITP2_11_B: Enumeration of Subsets II

<details>
<summary>答え</summary>

```python
n = int(input())
_, *t = map(int, input().split())
t = set(t)
for i in range(1 << n):
    s = set()
    for j in range(n):
        if i & (1 << j):
            s.add(j)
    if t <= s:
        print("{}:".format(i), *sorted(list(s)))
```

</details>

## ITP2_11_C: Enumeration of Subsets III

<details>
<summary>答え</summary>

```python
n = int(input())
k, *t = map(int, input().split())
for i in range(1 << k):
    s = []
    for j in range(k):
        if i & (1 << j):
            s.append(t[j])
    print("{}:".format(sum((0 | (1 << ele) for ele in s))), *sorted(s))
```

</details>

## ITP2_11_D: Enumeration of Combinations

<details>
<summary>答え</summary>

```python
n, k = map(int, input().split())
def combination(nums, k):
    ret = []
    def rec(nums, sofar):
        if len(sofar) == k:
            ret.append(sofar)
            return
        for i in range(len(nums)):
            rec(nums[i+1:], sofar + [nums[i]])
    rec(nums, [])
    return ret
nums = list(range(n))
for comb in sorted(combination(nums, k), key=lambda comb: sum(1 << i for i in comb)):
    print("{}:".format(sum(1 << i for i in comb)), *comb)
```

</details>
