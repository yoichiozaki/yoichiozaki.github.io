---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Remove Linked List Elements"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-22T20:26:52+09:00
lastmod: 2022-02-22T20:26:52+09:00
featured: false
draft: false


---

## 問題

次のように定義される連結リストに対して，指定された要素を削除する関数を書け．

```python
# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

関数の引数と返り値は次の通り．
```python
def removeElements(self, head: Optional[ListNode], val: int) -> Optional[ListNode]:
    pass
```

例：
```
head = [1] -> [2] -> [6] -> [3] -> [4] -> [5] -> [6]
val = 6
ans = [1] -> [2] ->  [3] -> [4] -> [5] -> [6]
```

## 解法

- 単連結リストは「1つ次」が追えるデータ構造
  - つまり`curr`があれば`curr.next`が取れる（当たり前）
  - その代わり1つ前が取れないので，追跡したいならそれ用の変数を用意しておく必要がある
- 単連結リストでの要素の削除は，「`curr`を削除したいなら，`prev`の次を（`curr`を飛ばして）`curr.next`にする」で実現される
- 1つ前を追跡したいので`prev`を考えるが，`head`の1つ前はどうしようか，となり，`dummy_head`を用意すればいいじゃないか，と至る．

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def removeElements(self, head: Optional[ListNode], val: int) -> Optional[ListNode]:
        if head is None:
            return None
        dummy_head = ListNode(val=-1, next=head)

        prev = dummy_head
        curr = head

        while curr is not None:
            if curr.val == val:
                prev.next = curr.next
                curr = curr.next
            else:
                curr = curr.next
                prev = prev.next

        return dummy_head.next
```

## 出典

- https://leetcode.com/problems/remove-linked-list-elements/