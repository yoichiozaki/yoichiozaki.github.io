---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Waven Lined List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T01:55:13+09:00
lastmod: 2021-03-19T01:55:13+09:00
featured: false
draft: false


---

## 連結リストを織り込みたい

長さが偶数の連結リストを真ん中で切断して織り込みたい．

要するにこれを

```sh
[10] -> [11] -> [12] -> [13] -> [14] -> [15] -> [20] -> [21] -> [22] -> [23] -> [24] -> [25]
```

こうしたい

```sh
[10] -> [20] -> [11] -> [21] -> [12] -> [22] -> [13] -> [23] -> [14] -> [24] -> [15] -> [25]
```

## テク：二人走らせる

- 二倍の速さで走るポインタを用意すれば真ん中で切ることができる

```python
class LinkedListNode:
    def __init__(self, data, next_node):
        self.data = data
        self.next_node = next_node

def waven(head):
    faster = head
    slower = head
    while faster is not None:
        faster = faster.next_node.next_node
        slower = slower.next_node
    faster= head
    while slower is not None:
        next_faster = faster.next_node
        next_slower = slower.next_node
        faster.next_node = slower
        if next_slower is not None:
            slower.next_node = next_faster
        faster = next_faster
        slower = next_slower
    return head
```

- waven linked list って英語は間違っていそう．
