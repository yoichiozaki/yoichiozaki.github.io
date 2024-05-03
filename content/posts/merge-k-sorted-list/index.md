---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Merge $k$ Sorted List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-10-06T14:16:22+09:00
lastmod: 2021-10-06T14:16:22+09:00
featured: false
draft: false


---

## 問題

$k$個の単連結リスト`lists`が与えられる．連結リストは次のように定義される．各リストは昇順に整列されている．

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

すべてのリストを統合した上で昇順に整列した連結リストを返せ．

例：
```
Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]
Explanation: The linked-lists are:
[
  1->4->5,
  1->3->4,
  2->6
]
merging them into one sorted list:
1->1->2->3->4->4->5->6
```

## 解法1

なんにも考えずに，全ノードを一旦舐めて値を回収してソートする．マージ結果の連結リストに含まれるノード数を$N$として，時間計算量はソートがボトルネックになって$O(N \log N)$．

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: List[ListNode]) -> ListNode:
        vals = []
        for node in lists:
            while node is not None:
                vals.append(node.val)
                node = node.next
        vals.sort()
        head = ListNode()
        ptr = head
        for val in vals:
            ptr.next = ListNode(val=val)
            ptr = ptr.next
        return head.next
```

## 解法2

各連結リストの先頭から一番小さいやつを選んで新しいリストを作っていく．$n$を各リストの平均長として時間計算量は$O(kn)$．各リストから最小の要素を見つけるのに特に工夫をしなければ$O(n)$かかる．

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        ret = ListNode()
        ptr = ret
        current = []
        for node in lists:
            if node is None:
                continue
            current.append(node)

        while len(current) != 0:
            min_node = ListNode(val=float("inf"))
            min_idx = -1
            for idx, node in enumerate(current):
                if node.val < min_node.val:
                    min_node = node
                    min_idx = idx
            ptr.next = min_node
            ptr = ptr.next
            current = current[:min_idx] + current[min_idx + 1:]
            if min_node.next is not None:
                current.append(min_node.next)
        return ret.next
```

## 解法3

解法2を改良する．「各リストから最小の要素を見つける」をPriority Queueを使って$O(1)$にできる．一方でPriority Queueへの要素の追加が$O(\log k)$かかるので，全体の時間計算量は$O(n \log k)$．

- `Wrapper`クラスを作って`ListNode`に演算子`<`を使えるようにする実装

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        class Wrapper:
            def __init__(self, node):
                self.node = node

            def __lt__(self, other):
                return self.node.val < other.node.val

        ret = ListNode()
        ptr = ret

        from queue import PriorityQueue
        pq = PriorityQueue()

        for node in lists:
            if node is None:
                continue
            pq.put(Wrapper(node))

        while not pq.empty():
            min_node = pq.get().node
            ptr.next = min_node
            ptr = ptr.next
            if min_node.next is not None:
                pq.put(Wrapper(min_node.next))
        return ret.next
```

- どのリストから最小値のノードが取れたかを`lists`上のインデックスとして保持しておく実装

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        ret = ListNode()
        ptr = ret
        current = []
        for idx, node in enumerate(lists):
            if node is None:
                continue
            current.append((node.val, idx))
        heapq.heapify(current)

        while len(current) != 0:
            min_val, min_idx = heapq.heappop(current)
            ptr.next = ListNode(val=min_val)
            ptr = ptr.next
            if lists[min_idx].next is not None:
                heapq.heappush(current, (lists[min_idx].next.val, min_idx))
                lists[min_idx] = lists[min_idx].next
        return ret.next
```

## 解法4

「$k$個のリストのマージ」を「2個のリストのマージ，を$k-1$回」と考えて解くことも考えられる．一つ前の統合結果に次のリストを重ねて統合させていくイメージ．各リストの平均長を$n$として，全体の時間計算量は$O(nk^2)$．

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        def merge_two_lists(list1, list2):
            dummy = ListNode(val=-1, next=None)
            current = dummy
            while list1 is not None and list2 is not None:
                if list1.val < list2.val:
                    current.next = list1
                    list1 = list1.next
                else:
                    current.next = list2
                    list2 = list2.next
                current = current.next
            if list1 is not None:
                current.next = list1
            else:
                current.next = list2
            return dummy.next
        head = ListNode(val=-1)
        for i in range(len(lists)):
            head.next = merge_two_lists(head.next, lists[i])
        return head.next
```

## 解法5

解法4を改良する．解法4では，最初の方にマージされた頂点を何回も参照することになる．ここが無駄．そこで，分割統治法．2個ずつ，4個ずつ，8個ずつ...マージしていけばいい．

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:
        def merge_two_lists(list1, list2):
            dummy = ListNode(val=-1, next=None)
            current = dummy
            while list1 is not None and list2 is not None:
                if list1.val < list2.val:
                    current.next = list1
                    list1 = list1.next
                else:
                    current.next = list2
                    list2 = list2.next
                current = current.next
            if list1 is not None:
                current.next = list1
            else:
                current.next = list2
            return dummy.next

        N = len(lists)
        interval = 1

        if N == 0:
            return None

        while interval < N:
            for i in range(0, N - interval, interval * 2):
                lists[i] = merge_two_lists(lists[i], lists[i + interval])
            interval *= 2
        return lists[0]
```

## Ref

- https://leetcode.com/problems/merge-k-sorted-lists/