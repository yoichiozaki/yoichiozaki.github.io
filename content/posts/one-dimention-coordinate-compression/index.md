---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "1次元の座標圧縮"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-08-09T17:30:50+09:00
lastmod: 2021-08-09T17:30:50+09:00
featured: false
draft: false


---

## 1次元の座標圧縮

- 与えられた数列から，その大小関係だけを表すように値を振り直す操作
- 入力例：`3, 3, 1, 6, 1`
- 出力例：`1, 1, 0, 2, 0`

## 辞書を使う実装

ソートして位置を辞書に保存しておく

```cpp
map<int, int> zip;   // 圧縮前 -> 圧縮後
map<int, int> unzip; // 圧縮前 <- 圧縮後

sort(X.begin(), X.end());
X.erase(unique(X.begin(), X.end()), X.end());
for (int i = 0; i < X.size(); i++) {
  zip[X[i]] = i;
  unzip[i] = X[i];
}
```

## 二分探索を使う実装

ソートして位置を保存しておく．

```cpp
vector<int> vals = X;
sort(vals.begin(), vals.end());
vals.erase(unique(vals.begin(), vals.end()), vals.end());
for (int i = 0; i < (int)X.size(); i++) {
    // 各要素の位置を二分探索で求めてる
    X[i] = lower_bound(vals.begin(), vals.end(), X[i]) - vals.begin();
}
```

## 問題

- https://atcoder.jp/contests/abc036/tasks/abc036_c

```cpp
#include <bits/stdc++.h>

using namespace std;

int main()
{
    int N; cin >> N;
    vector<int> X(N, 0);
    for (int i = 0; i < N; i++) cin >> X[i];
    vector<int> vals(N);
    vals = X;
    sort(vals.begin(), vals.end());
    vals.erase(unique(vals.begin(), vals.end()), vals.end());
    for (int i = 0; i < (int)X.size(); i++) {
        X[i] = lower_bound(vals.begin(), vals.end(), X[i]) - vals.begin();
    }
    for (int i = 0; i < N; i++) cout << X[i] << endl;
    return 0;
}
```

- https://atcoder.jp/contests/abc113/tasks/abc113_c

```cpp
#include <bits/stdc++.h>

using namespace std;

int main()
{
    int N, M;
    cin >> N >> M;
    vector<int> P(M, 0);
    vector<int> Y(M, 0);
    for (int i = 0; i < M; i++) {
        cin >> P[i] >> Y[i];
        P[i] -= 1;
    }
    vector<vector<int>> vals(N);
    for (int i = 0; i < M; i++) {
        vals[P[i]].push_back(Y[i]);
    }
    for (int p = 0; p < N; p++) {
        sort(vals[p].begin(), vals[p].end());
        vals[p].erase(unique(vals[p].begin(), vals[p].end()), vals[p].end());
    }
    for (int i = 0; i < M; i++) {
        int p = P[i];
        printf("%06d", p + 1);
        int id = lower_bound(vals[p].begin(), vals[p].end(), Y[i]) - vals[p].begin();
        printf("%06d\n", id + 1);
    }
    return 0;
}
```