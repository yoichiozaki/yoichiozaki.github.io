---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "How Many Zeros in Suffix of Factorial"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T17:42:03+09:00
lastmod: 2021-03-27T17:42:03+09:00
featured: false
draft: false


---

## 問題

$n$の階乗の末尾には$0$がいくつ並んでいるか．求めよ．

## 答え

よくある中学受験問題．素因数分解したときに$2$より$5$のほうが数が多いので，$5$の個数を数えれば良い．

```python
def factorial_zeros(n):
    def factor_of_5(n):
        count = 0
        while n % 5 == 0:
            count += 1
            n = n / 5
        return count
    ans = 0
    for i in range(1, n + 1):
        ans += factor_of_5(i)
    return ans
```

$5$の累乗の倍数がそれぞれ何個あるかを計算して足し上げてもいい．

```python
def factorial_zeros(n):
    ans = 0
    i = 5
    while i <= n:
        ans += n // i
        i *= 5
    return ans
```

階段を縦に見てるか，横に見てるかの違い．
