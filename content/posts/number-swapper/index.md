---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Number Swapper"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-06-06T16:52:29+09:00
lastmod: 2021-06-06T16:52:29+09:00
featured: false
draft: false


---

## 問題

一時変数を使用しないで数字の交換を実装せよ．

## 答え

- 差をうまく使うやり方

```python
a = 10
b = 5

print("a: {}, b: {}".format(a, b))
a = a - b
b = a + b
a = b - a
print("a: {}, b: {}".format(a, b))
```

- `xor`をうまく使うやり方
  - 同じ数字同士の`xor`はキャンセルされることを利用する

```python
a = 10
b = 5

print("a: {}, b: {}".format(a, b))
a = a ^ b
b = a ^ b
a = a ^ b
print("a: {}, b: {}".format(a, b))
```