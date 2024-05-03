---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Swap Two Intergers Without Additional Mrmory"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T17:17:31+09:00
lastmod: 2021-03-27T17:17:31+09:00
featured: false
draft: false


---

## 問題

一時変数を使わずに整数`a`と`b`を交換せよ．

## 答え

```python
a = 10
b = 3
print(a, b) # => 10 3
a = a - b
b = a + b # (1)
a = b - a # (2)
print(a, b) # => 3, 10
```

`a`，`b`を交換前の数字とすると，

- (1)：`(a - b) + b = a`
- (2)：`a - (a - b) = b`

`xor`を使う方が汎用性は高そう．`a xor a = 0`，`0 xor a = a`という性質を利用する．

```python
a = 10
b = 3
print(a, b) # => 10 3
a = a ^ b
b = a ^ b # (1)
a = a ^ b # (2)
print(a, b) # => 3, 10
```

`a`，`b`を交換前の数字とすると，

- (1)：`(a xor b) xor b = a xor (b xor b) = a xor 0 = a`
- (2)：`(a xor b) xor a = b xor (a xor a) = b xor 0 = b`
