---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "$K$th to Last in Linked List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T15:27:36+09:00
lastmod: 2021-03-19T15:27:36+09:00
featured: false
draft: false


---

## 問題

片連結リストの，後ろから`k`番目の要素を見つける．

```python
class LinkedListNode:
    def __init__(self, data, next_node):
        self.data = data
        self.next_node = next_node
```

## 答え

片連結リストの長さ`L`が与えられるなら，前から`L-k`番目を取ればいい．

片連結リストの長さが与えられないときはチョット工夫する．

- 再帰で書く

```python
def find_kth_to_last(node, k):
    # base case
    if node is None:
        return 0

    idx = find_kth_to_last(node.next_node, k) + 1

    if idx == k:
        print("{}th to last: {}".format(idx, node.data))

    return idx
```

- ポインタ 2 つ用意する．ポインタ同士が`k`離れているようにしておくことで時間計算量$O(n)$，空間計算量$O(1)$で済む．

```python
def find_kth_to_last(head, k):
    pointer0 = head
    pointer1 = head
    for _ in range(k):
        pointer0 = pointer0.next_node

    while pointer0 is not None:
        pointer0 = pointer0.next_node
        pointer1 = pointer1.next_node

    print("{}th to last: {}".format(k, pointer1.data))
```
