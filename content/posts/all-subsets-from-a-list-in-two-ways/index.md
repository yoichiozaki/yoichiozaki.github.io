---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "All Subsets From a List in Two Ways"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-24T21:20:40+09:00
lastmod: 2021-03-24T21:20:40+09:00
featured: false
draft: false
---

## 配列の部分配列を全部求める

要素数$n$の配列の部分配列を全部求めたい．部分配列の総数は$2^n$．

```sh
[1, 2, 3]
-> [[1, 2, 3], [1, 2], [1, 3], [1], [2, 3], [2], [3], []]
```

### 再帰で求める

`lst[i:]`の部分配列のそれぞれに`lst[i]`が入る・入らないの 2 択．

```python
lst = [1, 2, 3]

def subsets(lst):
    if len(lst) == 0:
        return [[]]
    x = subsets(lst[1:])
    return x + [[lst[0]] + ele for ele in x]

print(subsets(lst))
```

### ビット全探索

`000`，`001`，`010`，`011`，`100`，`101`，`110`，`111`でどの要素を部分配列に入れるか入れないかを決める．

```python
lst = [1, 2, 3]

def subsets(lst):
    ret = []
    for i in range(1 << len(lst)):
        sub = []
        for j in range(len(lst)):
            if i & (1 << j):
                sub.append(lst[j])
        ret.append(sub)
    return ret

print(subsets(lst))
```
