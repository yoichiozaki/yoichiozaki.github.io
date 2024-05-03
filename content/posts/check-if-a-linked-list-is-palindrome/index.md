---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Check if a Linked List Is Palindrome"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T17:33:51+09:00
lastmod: 2021-03-19T17:33:51+09:00
featured: false
draft: false
---

## 問題

片連結リストが与えられたとき，そのリストが頭から読んでもお尻から読んでも同じかを判定する

## 答え

逆転させたリストを作って各要素を確認

```python
def reverse_linked_list(head):
    # base case
    if head.next_node is None:
        return LinkedListNode(head.data, None)

    reversed_head = reverse_linked_list(head.next_node)
    reversed_tail = reversed_head
    while reversed_tail.next_node is not None:
        reversed_tail = reversed_tail.next_node
    reversed_tail.next_node = LinkedListNode(head.data, None)
    return reversed_head


def check_palindrome(head):
    reversed_head = reverse_linked_list(head)
    pointer0 = head
    pointer1 = reversed_head
    while pointer0 is not None and pointer1 is not None:
        if pointer0.data != pointer1.data:
            return False
        pointer0 = pointer0.next_node
        pointer1 = pointer1.next_node
    return True
```

## 別解：2 つポインタ + stack

2 つのポインタを使えば真ん中らへんが取れる．前半要素の逆順で後半要素が出てくれば Palindrome なのでそれを確認する．入れた順番の逆順で取り出せるデータ構造は`stack`

```python
def check_palindrome(head):
    faster = head
    slower = head

    stack = []
    while faster is not None and faster.next_node is not None:
        stack.append(slower.data)
        slower = slower.next_node
        faster = faster.next_node.next_node

    if faster is not None:
        slower = slower.next_node # skip middle node

    while len(stack) != 0:
        data = stack.pop()
        if data != slower.data:
            return False
        slower = slower.next_node

    return True
```
