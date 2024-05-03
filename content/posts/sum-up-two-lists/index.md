---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sum Up Two Lists"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T16:19:13+09:00
lastmod: 2021-03-19T16:19:13+09:00
featured: false
draft: false


---

## 問題

2 つのリストを要素ごとに足し上げて 1 つのリストにする

要するにこういうこと．

```sh
(0)    (1)    (1)
 +      +      +
[7] -> [1] -> [6]
 +      +      +
[5] -> [9] -> [2]
 |      |      |
 v      v      v
[2] -> [1] -> [9]
```

```sh
(0)    (1)    (1)    (1)
 +      +      +      +
[7] -> [1] -> [6] -> [1]
 +      +      +      |
[5] -> [9] -> [6]     |
 |      |      |      |
 v      v      v      v
[2] -> [1] -> [3] -> [2]
```

筆算みたい．

## 答え

「繰り上がりと要素を 2 つ足す」を再帰的に繰り返す．

```python
class LinkedListNode:
    def __init__(self, data, next_node):
        self.data = data
        self.next_node = next_node

def sum_up_two_linked_lists(ll0, ll1, carry):
    # base case
    if ll0 is None and ll1 is None and carry == 0:
        return None

    data = carry
    if ll0 is not None:
        data += ll0.data
    if ll1 is not None:
        data += ll1.data

    result = LinkedListNode(-1, None)
    result.data = data

    if ll0 is not None or ll1 is not None:
        next_ll0 = None
        next_ll1 = None
        if ll0 is not None:
            next_ll0 = ll0.next_node
        if ll1 is not None:
            next_ll1 = ll1.next_node
        carry = result.data // 10
        result.next_node = sum_up_two_linked_list(next_ll0, next_ll1, carry)

    return result
```

## 類題

数字が逆向きについていると...

```sh
(1)    (1)    (1)    (0)
 +      +      +      +
[1] -> [6] -> [1] -> [7]
 |      +      +      |
 |     [6] -> [9] -> [5]
 |      |      |      |
 v      v      v      v
[2] -> [3] -> [1] -> [2]
```

## 類題答え

大変そうなので片連結リストを逆転させて元の問題に帰着させる．

```python
# reverseしたリストのheadを返す
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

reverse_linked_list(
    sum_up_two_linked_lists(
        reverse_linked_list(ll0),
        reverse_linked_list(ll1),
        0,
    )
)
```
