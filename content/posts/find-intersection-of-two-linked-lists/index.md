---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find Intersection of Two Linked Lists"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T18:17:26+09:00
lastmod: 2021-03-19T18:17:26+09:00
featured: false
draft: false
---

## 問題

2 つの片連結リストの頭を与えられる．この 2 つのリストがどこかで交わっているか，交わっているなら交わっているノードのデータを取れ．

## 解答

交わっているか否かは両方のリストのお尻が同じノードなのかで判定できる．

どこで交わっているのかは，2 つのリストの長さの差がわかれば簡単にわかる．

```python
def check_intersection(ll0, ll1):
    ll0_tail = ll0
    ll0_len = 0
    ll1_tail = ll1
    ll1_len = 0
    while ll0_tail.next_node is not None:
        ll0_tail = ll0_tail.next_node
        ll0_len += 1
    while ll1_tail.next_node is not None:
        ll1_tail = ll1_tail.next_node
        ll1_len += 1

    if ll0_tail is not ll1_tail:
        return (False, None)

    diff = abs(ll0_len - ll1_len)
    longer = None
    shorter = None
    if ll0_len < ll1_len:
        longer = ll1
        shorter = ll0
    else:
        longer = ll0
        shorter = ll1
    for _ in range(diff):
        longer = longer.next_node

    while longer is not shorter:
        longer = longer.next_node
        shorter = shorter.next_node

    return (True, longer)
```
