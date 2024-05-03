---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Smallest Difference in Two Arrays"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T17:56:58+09:00
lastmod: 2021-03-27T17:56:58+09:00
featured: false
draft: false


---

## 問題

配列`a`，`b`が与えられる．それぞれの配列から一つずつ要素を選んだとき，その差の絶対値が最小となるような要素のペアとその差を求めよ．

## 答え

全てのペアを全探索しながら最小の差を与えるペアを探せば原理的に解ける．$O(AB)$．ただし$A$，$B$はそれぞれの配列の長さ．

```python
a = [1, 3, 15, 11, 2]
b = [23, 127, 235, 19, 8]

def smallest_diff(a, b):
    ans = (-1, -1)
    diff = float("inf")
    for i in range(len(a)):
        for j in range(len(b)):
            if abs(a[i] - b[j]) < diff:
                diff = abs(a[i] - b[j])
                ans = (a[i], b[j])
    return diff, ans

print(smallest_diff(a, b)) # => (3, (11, 8))
```

両配列を昇順に並び替えてから探すと効率が良くなる．昇順に並び替えてあると，小さい方を動かすことで`diff`が小さくなるかもしれないから大きい要素の方の位置を固定して小さい要素の位置を動かす．ソートするのに$O(A \log A + B \log B)$かかり，探索に$O(A + B)$かかるので，全体としては$O(A \log A + B \log B)$．

```python
def smallest_diff(a, b):
    a.sort()
    b.sort()
    i = 0
    j = 0
    ans = (-1, -1)
    diff = float("inf")

    while i < len(a) and j < len(b):
        if abs(a[i] - b[j]) < diff:
            ans = (a[i], b[j])
            diff = abs(a[i] - b[j])
        if a[i] < b[j]:
            i += 1
        else:
            j += 1
    return diff, ans

print(smallest_diff(a, b)) # => (3, (11, 8))
```
