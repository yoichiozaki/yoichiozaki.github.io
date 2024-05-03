---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Coin Change"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T11:57:01+09:00
lastmod: 2021-03-27T11:57:01+09:00
featured: false
draft: false
---

## 問題

手元に$1$円硬貨，$5$円硬貨，$10$円硬貨，$25$円硬貨が無限に存在する．$n$円支払うときの，硬貨の出し方の総数はいくらか．

## 答え

```python
coins = [25, 10, 5, 1]
def make_change(n, coins):
    # remain円をcoins[pos:]を使って支払うときの支払い方の総数
    def rec(coins, pos, remain):
        if pos == len(coins) - 1:
            return 1 # remain円を1円硬貨で支払う方法は「remain枚の1円硬貨」の1通り
        ways = 0
        i = 0
        while i * coins[pos] <= remain:
            ways += rec(coins, pos + 1, remain - i * coins[pos])
            i += 1
        return ways
    return rec(coins, 0, n)
```

実際の支払い方を保存しておくこともできる．

```python
coins = [25, 10, 5, 1]
def make_change(n, coins):
    payments = []
    # remain円をcoins[pos:]を使って支払うときの支払い方の総数
    def rec(remain, pos, sofar):
        if pos == len(coins) - 1:
            payments.append(sofar + [1 for _ in range(remain)])
            return 1 # remain円を1円硬貨で支払う方法は「remain枚の1円硬貨」の1通り
        ways = 0
        i = 0
        while i * coins[pos] <= remain:
            ways += rec(remain - i * coins[pos], pos + 1, sofar + [coins[pos] for _ in range(i)])
            i += 1
        return ways
    ans = rec(n, 0, [])
    return ans, payments

ways, payments = make_change(100, coins)
print("ways:", ways)
for i, payment in enumerate(payments):
    print("{}: coin usage: {}, payment: {}".format(i, len(payment), payment))
```

`rec()`の求めるものを「`remain`円を`coins[:pos]`を使って支払うときの支払い方の総数」とした方が自然．

```python
def make_change(n, coins):
    # remain円をcoins[:pos+1]を使って支払うときの支払い方の総数
    def rec(remain, pos):
        if pos == 0:
            return 1
        ways = 0
        i = 0
        while i * coins[pos] <= remain:
            ways += rec(remain - i * coins[pos], pos - 1)
            i += 1
        return ways
    coins.sort() # coins = [1, ...]
    return rec(n, len(coins) - 1)
```

TODO：メモ化
