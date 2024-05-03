---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Ones and Zeros"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-02T17:33:44+09:00
lastmod: 2022-02-02T17:33:44+09:00
featured: false
draft: false


---

## 問題

`0`と`1`のみから構成される文字列を格納する配列`strs`と整数`m`，`n`が与えられる．`strs`からいくつかの文字列を取り出して，次の条件を満たすような文字列の集合`X`を作りたい．

- `X`に含まれる文字列について，`0`の個数と`1`の個数がそれぞれ最大でも`m`個，`n`個である

`X`の最大のサイズはいくつか

## 答え

- ナップザック問題

```python
class Solution:
    def findMaxForm(self, strs: List[str], m: int, n: int) -> int:
        # dp[i][j][k]: 1, 2, ..., i番目までの文字列を対象に0が最大でj個，1が最大でi個存在するような部分集合を取ったときの要素数の最大値
        # 更新式の立て方：dp[i][j][k]を一つ前の状態から更新することで求めると考える．今回はi番目のstrを入れるか入れないかの2つの状態から遷移してくるので
        # dp[i][j][k] = max(入れる場合, 入れない場合)になる．入れない場合は前と同じになるので
        # dp[i][j][k] = max(入れる場合, dp[i-1][j][k])．入れる場合を考えると，i番目のstrに0がzeros個，1がones個含まれているので，
        # i番目のstrを採用してdp[i][j][k]に至るということはその前はdp[i-1][j-zeros][k-ones]であるはずなので
        # dp[i][j][k] = max(dp[i-1][j-zeros][k-ones], dp[i-1][j][k])．ここで，j-zerosとk-onesがインデックスの値として正当な値になるためには0以上である必要があるので
        # j-zeros >= 0 and k-ones >= 0を条件に分岐する必要がある．elseの方はそもそも0をzeros個，1をones個追加してdp[i][j][k]に到達することができない（その前状態が存在してない）ので
        # i番目のstrを含むことができずそのままになる．
        # -----------------------------
        # if 0 <= j - zeros and 0 <= k - ones:
        #     dp[i][j][k] = max(dp[i - 1][j][k], dp[i - 1][j - zeros][k - ones] + 1)
        # else:
        #     dp[i][j][k] = dp[i - 1][j][k]

        l = len(strs)
        dp = [[[0 for _ in range(n + 1)] for _ in range(m + 1)]
              for _ in range(l + 1)]

        def count01(s):
            zeros, ones = 0, 0
            for c in s:
                if c == '0':
                    zeros += 1
                elif c == '1':
                    ones += 1
            return (zeros, ones)

        for i in range(1, l + 1, 1):
            s = strs[i - 1]
            zeros, ones = count01(s)
            for j in range(0, m + 1, 1):
                for k in range(0, n + 1, 1):
                    if 0 <= j - zeros and 0 <= k - ones:
                        dp[i][j][k] = max(
                            dp[i - 1][j][k], dp[i - 1][j - zeros][k - ones] + 1)
                    else:
                        dp[i][j][k] = dp[i - 1][j][k]

        return dp[l][m][n]
```

## 出典

https://leetcode.com/problems/ones-and-zeroes/