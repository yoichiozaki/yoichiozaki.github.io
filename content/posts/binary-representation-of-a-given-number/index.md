---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Binary Representation of a Given Number"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-24T21:54:26+09:00
lastmod: 2021-03-24T21:54:26+09:00
featured: false
draft: false
---

## 問題

数字を 2 進数表示にしなさい．

## 答え

再帰で解く．

```python
def num_to_bits(num):
    if 1 < num:
        return num_to_bits(num // 2) + str(num % 2)
    return str(num % 2)


for num in range(10):
    print("{}:{}".format(num, num_to_bits(num)))
```

繰り返しで解く．

```python
def num_to_bits(num):
    if num == 0:
        return 0
    bits = ""
    while num:
        if num % 2:
            bits = "1" + bits
        else:
            bits = "0" + bits
        num >>= 1
    return bits


for num in range(10):
    print("{}:{}".format(num, num_to_bits(num)))
```
