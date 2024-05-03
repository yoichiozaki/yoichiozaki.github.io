---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "How Many Ways to Run Up the Stairs?"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-26T22:10:18+09:00
lastmod: 2021-03-26T22:10:18+09:00
featured: false
draft: false


---

## 問題

$n$段の階段がある．おじさんは筋トレにハマっており，$i$段飛ばしが好きだ．現状おじさんは$i = 1, 2, 3$の$i$段飛ばしができる．おじさんが$n$段の階段をのぼる方法は全部で何通りあるか．

## 答え

```python
def solve(n):
    if n < 0:
        return 0
    if n == 0:
        return 1
    return solve(n - 1) + solve(n - 2) + solve(n - 3)
```

メモ化再帰

```python
def solve(n, memo):
    if n < 0:
        return 0
    if n == 0:
        return 1
    if memo[n] != -1:
        return memo[n]
    ret = solve(n - 1, memo) + solve(n - 2, memo) + solve(n - 3, memo)
    memo[n] = ret
    return ret
```
