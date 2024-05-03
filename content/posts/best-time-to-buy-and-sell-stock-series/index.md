---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Best Time to Buy and Sell Stock Series"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-04-09T14:40:23+09:00
lastmod: 2021-04-09T14:40:23+09:00
featured: false
draft: true
---

LeetCode にて，時系列の株価データと売り買いについての条件を与えられて，その制約を満たして売り買いをしたときの最大利益を計算せよ，という問題が「Best Time to Buy and Sell Stock」シリーズとして出題されている．

そこで，今回はこのシリーズをまとめて解く．

問題一覧はこちら

- [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/)
- [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/)
- [Best Time to Buy and Sell Stock III](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/)
- [Best Time to Buy and Sell Stock IV](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/)
- [Best Time to Buy and Sell Stock with Cooldown](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/)
- [Best Time to Buy and Sell Stock with Transaction Fee](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/)

## [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/)

1 回だけ売り買いができるときの最大利益を計算する問題．売り買いのタイミングを全探索すると，株価データの長さを$n$として時間計算量$O(n^2)$・空間計算量$O(1)$．

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        n = len(prices)
        max_profit = 0
        for i in range(n):
            for j in range(i + 1, n):
                max_profit = max(max_profit, prices[j] - prices[i])
        return max_profit
```

普通に考えて，底値で買って最高値で売るときに最大利益なので，底値を覚えておいて売りどきを探れば良い．これを実装して時間計算量$O(n)$・空間計算量$O(1)$．

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        bottom_price = float("inf")
        max_profit = 0
        n = len(prices)
        for i in range(n):
            max_profit = max(max_profit, prices[i] - bottom_price)
            bottom_price = min(bottom_price, prices[i])
        return max_profit
```

逆に考えても良くて，最高値を保存しておいて，時間をさかのぼって買いどきを探るのでも良い．同じく，時間計算量$O(n)$・空間計算量$O(1)$．

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        top_price = float("-inf")
        max_profit = 0
        for price in reversed(prices):
            max_profit = max(max_profit, top_price - price)
            top_price = max(top_price, price)
        return max_profit
```

## [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/)

売り買いの回数について制限がないときの最大利益を計算する問題．今日より明日のほうが高値なら今日買って明日売ろう．

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        return sum(max(0, prices[i + 1] - prices[i]) for i in range(len(prices) - 1))
```

## [Best Time to Buy and Sell Stock III](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii/)

売り買いの回数について，最大で 2 回まで売り買いを実行できるという制約を与えられたときの最大利益を計算する問題．

何も考えずに力技で解こうとすると，売り買いのタイミングを全通り試して時間計算量$O(n^4)$．これは遅い．

1 回目の売り買いと 2 回目の売り買いを独立に考えれば$O(n^2)$で解ける．問題の制約からこれは TLE．

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        def _max_profit(prices):
            bottom_price = float("inf")
            max_profit = 0
            for i in range(len(prices)):
                max_profit = max(max_profit, prices[i] - bottom_price)
                bottom_price = min(bottom_price, prices[i])
            return max_profit

        bottom_price = float("inf")
        max_profit = 0
        for i in range(len(prices)):
            curr_profit = (prices[i] - bottom_price) + _max_profit(prices[i + 1:])
            max_profit = max(max_profit, curr_profit)
            bottom_price = min(bottom_price, prices[i])
        return max_profit
```

ただこのやり方だと無駄な計算をしている．`_max_profit(prices)`は底値を追うことで最大利益を計算しているが，要するにこれはある時刻$i$における値段での売りに対して，$i$より前の時刻の最小値の値段で買うということをしている．とすると，`_max_profit(prices[1:])`と`_max_profit(prices[2:])`ではダブった計算をしている．

そこで逆に，ある時刻$i$における値段で買ったときに，$i$以降の時刻での最高値で売ることで最大利益を狙うように計算すれば，ダブった計算が発生しない．時刻$i$までの最大利益と時刻$i$以降での最大利益を別々に求めて足す．時刻$i$までの最大利益は底値で買うことを固定して売りどきを追うことで計算し，時刻$i$以降での最大利益は最高値で売ることを固定して買い時を追うことで計算する．

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        if len(prices) < 2:
            return 0 # 1回の売り買いには2単位時間必要

        # 売りどきを追うことで最大利益を計算 -> 後ろから前へ
        # second_max_profit[i]: prices[i:]での取引で可能な最大利益
        second_max_profit = [0] * (len(prices) + 1)
        top_price = float("-inf")
        for i in range(len(prices)-1, -1, -1):
            second_max_profit[i] = max(top_price - prices[i], second_max_profit[i + 1])
            top_price = max(top_price, prices[i])

        # 買いどきを追うことで最大利益を計算 -> 前から後ろへ
        max_profit = 0
        first_max_profit = 0
        bottom_price = float("inf")
        for i in range(len(prices)):
            first_max_profit = max(first_max_profit, prices[i] - bottom_price)
            bottom_price = min(bottom_price, prices[i])

            max_profit = max(max_profit, first_max_profit + second_max_profit[i + 1])
        return max_profit
```

## [Best Time to Buy and Sell Stock IV](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/)

売り買いの回数が最大$k$回のときの最大利益を計算する問題．

まず，最大でも`len(prices) // 2`回までしか取引できないので，$k$がそれを超えているなら，II の問題と同じ．

$k$が小さいときを考える．$k$回売り買いをしたときの最大利益は$k-1$回売り買いをしたときの最大利益から計算できそう．なので DP を考えてみる．

`dp[i][j]`：`prices[:j+1]`で最大`i`回の売り買いをしたときの最大利益

とすると，

```sh
dp[i][j] = max(dp[i][j-1], prices[j] - prices[jj] + dp[i-1][jj]) (jj in range(0, j))
         = max(dp[i][j-1], prices[j] + max(dp[i-1][0] - prices[0], dp[i-1][1] - prices[1], ..., dp[i-1][j] - prices[j]))
```

`prices[j] - prices[jj]`が`i`回目の取引で得る利益．

```python
class Solution:
    def maxProfit(self, k: int, prices: List[int]) -> int:
        n = len(prices)
        if n < 2:
            return 0 # 1回の売り買いには2単位時間必要

        if n // 2 <= k:
            profit = 0
            for i in range(1, n):
                if prices[i - 1] < prices[i]:
                    profit += prices[i] - prices[i - 1]
            return profit

        # dp[i][j]: prices[:j+1]で最大i回の売り買いをしたときの最大利益
        dp = [[0 for _ in range(n)] for _ in range(k + 1)]
        for i in range(1, k + 1, 1):
            m = dp[i - 1][0] - prices[0]
            for j in range(1, n, 1):
                dp[i][j] = max(dp[i][j - 1], prices[j] + m)
                m = max(m, dp[i - 1][j] - prices[j])
        return dp[k][n - 1]
```

## [Best Time to Buy and Sell Stock with Cooldown](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/)

連続で売り買いを実行できない制約を与えられたときの最大利益を計算する問題．

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        n = len(prices)
        profit_at_buy = float("-inf") # 買いの直後の利益
        profit_at_sell = 0 # 売りの直後の利益
        profit_at_stay = 0 # cooldown直後の利益
        for i in range(n):
            profit_at_buy, profit_at_sell, profit_at_stay = max(profit_at_buy, profit_at_stay - prices[i]), max(profit_at_sell, profit_at_buy + prices[i]), max(profit_at_stay, profit_at_sell)
        return max(profit_at_sell, profit_at_stay)
```

## [Best Time to Buy and Sell Stock with Transaction Fee](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/)

売買手数料を考慮した上での最大利益を計算する問題．

```python
class Solution:
    def maxProfit(self, prices: List[int], fee: int) -> int:
        n = len(prices)
        profit_at_buy = float("-inf") # 買い直後の利益
        profit_at_sell = 0 # 売り直後の利益
        for i in range(n):
            profit_at_buy, profit_at_sell = max(profit_at_buy, profit_at_sell - prices[i]), max(profit_at_sell, profit_at_buy + prices[i] - fee)
        return profit_at_sell
```
