---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Linked List Cycle"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-10T17:06:32+09:00
lastmod: 2022-02-10T17:06:32+09:00
featured: false
draft: false


---

## 問題

次のように定義された隣接リストが与えられたとき，そのリストが循環しているかを判定せよ

```python
# Definition for singly-linked list.
 class ListNode:
     def __init__(self, x):
         self.val = x
         self.next = None
```

## 解法

うさぎとかめテクニック．

```python
class Solution:
    def hasCycle(self, head: Optional[ListNode]) -> bool:
        if head is None:
            return False
        faster = head
        slower = head
        while faster.next is not None and faster.next.next is not None:
            faster = faster.next.next # うさぎは二歩進む
            slower = slower.next # かめは一歩進む
            if faster is slower:
                return True # 循環していればどこかで必ず追いつく
        return False
```

## 出典

- https://leetcode.com/problems/linked-list-cycle/