---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Middle of the Linked List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-22T20:37:10+09:00
lastmod: 2022-02-22T20:37:10+09:00
featured: false
draft: false


---

## 問題

次のように定義される連結リストが与えられたときに，真ん中の値はなにか計算する関数を書け．

```python
# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

例
```
head = [1] -> [2] -> [3] -> [4] -> [5],        ans = [3] -> [4] -> [5]
head = [1] -> [2] -> [3] -> [4] -> [5] -> [6], ans = [4] -> [5] -> [6]
```

## 解法

- 🐰と🐢テクニック
  - 二倍の速度で動く🐰を端まで走らせると🐢は真ん中ぐらいにまだいる
- `while`のループの条件は，ループ内部の実行時エラーが発生しない条件を考えれば良い．

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def middleNode(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if head == None:
            return []
        faster = head
        slower = head
        while faster is not None and faster.next is not None:
            faster = faster.next.next
            slower = slower.next
        return slower
```

## 出典

- https://leetcode.com/problems/middle-of-the-linked-list/