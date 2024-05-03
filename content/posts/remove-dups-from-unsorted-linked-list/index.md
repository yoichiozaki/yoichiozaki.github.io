---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Remove Dups From Unsorted Linked List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T12:47:55+09:00
lastmod: 2021-03-19T12:47:55+09:00
featured: false
draft: false


---

一つずつ舐めながら，重複しているならポインタの付替えをする

```python
class LinkedListNode:
    def __init__(self, data, next_node):
        self.data = data
        self.next_node = next_node

def remove_dups_from_linked_list(head):
    table = set()
    prev = None
    curr = head
    while curr is not None:
        if curr.data not in table:
            table.add(curr.data)
            prev = curr
        else:
            prev.next_node = curr.next_node
        curr = curr.next_node
```
