---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Previious Permutation and Next Permutation"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-04-15T20:53:29+09:00
lastmod: 2021-04-15T20:53:29+09:00
featured: false
draft: false


---

## 問題

整数を要素として持つリストが与えられたとき，辞書順でそのリストの前後の順列を求めよ．

## 答え

```python
def prev_permutation(arr):
    i = len(arr) - 1
    while 0 < i and arr[i-1] <= arr[i]:
        i -= 1
    if i == 0: # arrは昇順に整列されている
        arr.reverse()
        return
    i -= 1
    pivot = arr[i]
    j = len(arr) - 1
    while arr[j] >= arr[i]:
      j -= 1
    # arr[i+1:]は昇順に整列されているので二分探索も可
    # j = bisect_left(arr[i+1:], arr[i]) + i
    arr[i], arr[j] = arr[j], arr[i]
    arr[i+1:] = reversed(arr[i+1:])

def next_permutation(arr):
    i = len(arr) - 1
    while 0 < i and arr[i-1] >= arr[i]:
        i -= 1
    if i == 0: # arrは降順に整列されている
        arr.sort()
        return
    i -= 1
    pivot = arr[i]
    j = len(arr) - 1
    while arr[j] <= pivot:
        j -= 1
    arr[i], arr[j] = arr[j], arr[i]
    arr[i+1:] = reversed(arr[i+1:])

arr = [1, 2, 3]
prev_permutation(arr)
print(arr) # => [3, 2, 1]

arr = [1, 3, 2]
prev_permutation(arr)
print(arr) # => [1, 2, 3]

arr = [1, 2, 3]
next_permutation(arr)
print(arr) # => [1, 3, 2]

arr = [3, 2, 1]
next_permutation(arr)
print(arr) # => [1, 2, 3]
```
