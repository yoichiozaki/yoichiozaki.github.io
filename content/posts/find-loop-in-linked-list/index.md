---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find Loop in Linked List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T18:38:59+09:00
lastmod: 2021-03-19T18:38:59+09:00
featured: false
draft: false


---

## 問題

片連結リストが与えられたとき，そのリストがループしているか判定し，しているならどこでループしているのかを求めろ．

## 答え

2 つのポインタ！

```python
def check_loop(head):
    faster = head
    slower = head
    while faster is not None and faster.next_node is not None:
        faster = faster.next_node.next_node
        slower = slower.next_node
        if faster is slower:
            break # there is a loop!

    if faster is None or faster.next_node is None:
        return (False, None)

    slower = head
    while slower is not faster:
        slower = slower.next_node
        faster = faster.next_node

    return (True, slower)
```
