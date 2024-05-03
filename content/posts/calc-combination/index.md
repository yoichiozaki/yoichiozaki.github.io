---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "組み合わせを高速に計算する"
subtitle: ""
summary: "パスカルの三角形で高速に組み合わせ計算"
authors: []
tags: [組み合わせ, combination, AtCoder, 競技プログラミング, 競プロ]
categories: []
date: 2020-12-14T09:00:00+09:00
lastmod: 2020-12-14T09:00:00+09:00
featured: false
draft: false
---

## ${}_n \mathrm{C} _r$の定義

異なる$n$個のものから$r$個を選ぶ組み合わせの総数．

## いろんな実装

- 再帰的に計算する

```cpp
long long combination(long long n, long long r) {
    if (n == r || r == 0)
        return 1;
    else
        return combination(n - 1, r - 1) + combination(n - 1, r);
}
```

- [パスカルの三角形](https://ja.wikipedia.org/wiki/%E3%83%91%E3%82%B9%E3%82%AB%E3%83%AB%E3%81%AE%E4%B8%89%E8%A7%92%E5%BD%A2)を用いる
  - 二次元配列の下半分をパスカルの三角形のルールに従って埋めていく
  - 小さいところから埋まっていくので直接定義式どおりに計算したときにオーバーフローするような大きい組み合わせを計算できる．
    - [ABC185-C](https://atcoder.jp/contests/abc185/tasks/abc185_c)はこれを使って AC

```cpp
vector<vector<long long>> combination(long long n, long long r) {
    vector<vector<long long>> table(n+1, vector<long long>(n+1, 0));
    for (int i = 0; i < table.size(); i++) {
        table[i][0] = 1;
        table[i][i] = 1;
    }

    for (int j = 1; j < table.size(); j++) {
        for (int k = 1; k < j; k++) {
            table[j][k] = table[j - 1][k - 1] + table[j - 1][k]; // 真上と左上の和
        }
    }

    return table; // table[n][r]がnCrの値
}
```
