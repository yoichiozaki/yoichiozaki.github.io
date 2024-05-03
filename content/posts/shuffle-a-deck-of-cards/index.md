---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Shuffle a Deck of Cards"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T23:15:43+09:00
lastmod: 2021-03-27T23:15:43+09:00
featured: false
draft: false


---

## 問題

$N$枚のカードをシャッフルせよ．シャッフルの結果に偏りがあってはならない．

## 答え

標準ライブラリを使うとさすがにチートか．

```python
N = int(input())
cards = [i for i in range(N)]

import random
random.shuffle(cards)
print(cards)
```

[`random.shuffle`](http://svn.python.org/projects/python/trunk/Lib/random.py)の内部的には[Fisher-Yates のアルゴリズム](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)が用いられている．

```sh
To shuffle an array A of N elements (indices: 0...N-1):
    for i in range(N - 1, 0, -1)
        j <- random_integer_between(0, i) # 0 <= j <= i
        swap(A[j], A[i])
```

Fisher-Yates アルゴリズムでは末尾の要素から決定する．$i$番目の要素を$0$番目から$i$番目までの中からランダムに選択する．

自前で実装すると以下．

```python
def fisher_yates_shuffle(lst):
    for i in range(len(lst) - 1, 0, -1):
        j = random.randint(0, i) # randint(a, b) returns a random value in a <= n <= b
        lst[i], lst[j] = lst[j], lst[i]
```

Fisher-Yates アルゴリズムでは$N - 1$回乱数を引くことになる．乱数を 1 度だけ引くようなシャッフルアルゴリズムは存在しないのだろうか？

$N$枚のカードのシャッフル結果の総数は$N!$通りある．そこで，それらに$0$から$N!-1$までのインデックスを付けて，一度だけ引いた乱数がと等しいインデックスの結果をシャッフルの結果とするというのを考える．

```python
import random

def shuffle(lst):
    def factorial(n):
        memo = [-1] * (n + 1)
        memo[0] = 1
        def rec(n, memo):
            if memo[n] != -1:
                return memo[n]
            if n == 0:
                return 1
            return n * rec(n - 1, memo)
        return rec(n, memo)
    f = factorial(len(lst))
    idx = random.randrange(f)
    for i in range(len(lst) - 1, -1, -1):
        fi = factorial(i)
        q = idx // fi
        lst.append(lst.pop(q))
        idx = idx % fi
```

乱数を引く回数が減らせる代わりに，階乗を求めるときの計算でメモリを消費する．

手元での実験の感覚では，$N$が大きくなると階乗を計算することが困難になるので，余り効率は良くないと思える．
