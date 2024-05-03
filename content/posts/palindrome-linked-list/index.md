---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Palindrome Linked List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-22T20:50:37+09:00
lastmod: 2022-02-22T20:50:37+09:00
featured: false
draft: false


---

## 問題

次のように定義される連結リストが与えられる．

```python
# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

与えられた連結リストが回分になっているか判定せよ．

## 解法

- 回分になっているかを知るためにはとりあえず真ん中がほしいので，🐰と🐢が使える

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def isPalindrome(self, head: Optional[ListNode]) -> bool:
        if head is None:
            return None
        faster = head
        slower = head
        while faster is not None and faster.next is not None:
            faster = faster.next.next
            slower = slower.next
        stack = []
        while slower is not None:
            stack.append(slower.val)
            slower = slower.next
        current = head
        while len(stack) != 0:
            if stack.pop() != current.val:
                return False
            current = current.next
        return True
```

## 出典

- https://leetcode.com/problems/palindrome-linked-list/