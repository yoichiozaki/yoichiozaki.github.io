---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "部分和問題"
subtitle: ""
summary: "部分和問題で全探索に慣れる"
authors: []
tags: [部分和問題, 全探索, AtCoder, 競技プログラミング, 競プロ]
categories: []
date: 2020-05-12T21:52:41+09:00
lastmod: 2020-05-12T21:52:41+09:00
featured: false
draft: false


---

## 全探索を再帰関数でやるときの 2 流派

全探索を再帰関数で書くにはたいてい 2 流派ある．

- 状態情報を配っていく再帰
- 状態情報を集めていく再帰

全探索しなければならない問題では，探索すべき状態数が指数的に増加してしまうので，問題の制約が小さめであることが多い．大体 $10$ から $20$ ぐらいだと全探索できる．

## 部分和問題

> 【問題】 $n$個の整数列 $a_1, a_2, ... , a_{n-1}$ から部分集合をうまく選んで，その集合内の数の和を $W$ に等しくすることができるか判定せよ．
>
> 【制約】 $1 \leq n \leq 20$

### 状態情報を配っていく再帰

このタイプの再帰では **再帰的な樹形図の最小単位** をそのまま再帰関数が表現していると捉えるとわかりやすい．

```
rec(状態を表す変数) {
    if (状態が樹形図の末端である) { // ベースケース
        条件に対してこの状態が妥当であるかの確認
        return;
    }

    rec(次の状態1)
    rec(次の遷移2)
}
```

樹形図上を深さ優先探索して，末端の状態にたどり着いてから条件との整合性チェックをする．

この方針で部分和問題を解いてみる．ここでは状態を

```
(何番目までの項を用いるか, その時点での部分和)
```

として表現している．

```c++
#include <bits/stdc++.h>
using namespace std;

int N, W;
vector<int> a;

bool rec(int depth, int sum) {

    // 樹形図の末端に到達したとき
    if (depth == N) {
        if (sum == W) return true;
        else return false;
    }

    // a[depth]を部分和計算に用いる場合
    if (rec(depth+1, sum + a[depth])) return true;

    // a[depth]を部分和計算に用いない場合
    if (rec(depth+1, sum)) return true;

    return false;
}

int main() {
    cin >> N >> W;
    a.resize(N);
    for (int i = 0; i < N; i++) cin >> a[i];

    // 状態(0, 0)から樹形図を末端に向かって深さ優先探索
    if (rec(0, 0)) cout << "Yes" << endl;
    else cout << "No" << endl;
}
```

### 状態情報を集めていく再帰

配っていく再帰との対比で考えると，集めていく再帰では状態を

```
(何番目以降の項を用いるか, その時点でのWとの差)
```

で状態を表現することになる．「実現したい和 W との差」で状態を表現するところが配る再帰とは違っている．

```c++
#include <bits/stdc++.h>
using namespace std;

int N, W;
vector<int> a;

bool rec(int idx, int remain) {

    // 樹形図の末端に到達したとき: N番目以降の項を用いるときの部分和は自明
    if (idx == N) {
        if (remain == 0) return true;
        else return false;
    }

    // a[idx]を部分和計算に用いる場合
    if (a[idx] <= remain && rec(idx+1, remain - a[idx])) return true;

    // a[idx]を部分和計算に用いない場合
    if (rec(idx+1, remain)) return true;

    return false;
}

int main() {
    cin >> N >> W;
    a.resize(N);
    for (int i = 0; i < N; i++) cin >> a[i];

    // 状態(0, W)から樹形図を末端に向かって深さ優先探索
    if (rec(0, W)) cout << "Yes" << endl;
    else cout << "No" << endl;
}
```

状態の定義次第では別の書き方もできる．状態を

```
(0から何番目までの項を用いたか, その時点でのWとの差)
```

とすると，

```c++
#include <bits/stdc++.h>
using namespace std;

int N, W;
vector<int> a;

bool rec(int idx, int remain) {

    // 樹形図の末端に到達したとき: 0番目までの項を用いた時の部分和は自明
    if (idx == 0) {
        if (remain == 0) return true;
        else return false;
    }

    // a[idx-1]を部分和計算に用いる場合
    if (a[idx-1] <= remain && rec(idx-1, remain - a[idx-1])) return true;

    // a[idx-1]を部分和計算に用いない場合
    if (rec(idx-1, remain)) return true;

    return false;
}

int main() {
    cin >> N >> W;
    a.resize(N);
    for (int i = 0; i < N; i++) cin >> a[i];

    // 状態(N, W)から樹形図を末端に向かって深さ優先探索
    if (rec(N, W)) cout << "Yes" << endl;
    else cout << "No" << endl;
}
```

### 状態情報を集めていく再帰でメモ化

集めていく再帰では，サイズ $n$ の問題を解くために サイズ $n-1$ の問題の結果を利用するのだから，それを配列などにメモしておけば再帰計算の無駄を減らせる．

```c++
#include <bits/stdc++.h>
using namespace std;

int N, W;
vector<int> a;

// dp[i][j]: i番目までの項を用いて部分和Wとの差をjにできたか
// -1: まだ解決していない
//  0: できない
//  1: できる
vector<vector<int>> dp;

int rec(int idx, int remain) {

    // まずメモを確認
    if (dp[idx][remain] != -1)
        return dp[idx][remain]; // すでに計算してあったのでメモの内容を返す

    // 樹形図の末端に到達したとき: 0番目までの工を用いた時の部分和は自明
    if (idx == 0) {
        if (remain == 0) return true;
        else return false;
    }

    int ans = 0;

    // a[idx-1]を部分和計算に用いる場合
    if (a[idx-1] <= renaib && rec(idx-1, remain - a[idx-1])) ans = 1;

    // a[idx-1]を部分和計算に用いない場合
    if (rec(idx-1, remain)) ans = 1;

    return dp[idx][remain] = ans;
}

int main() {
    cin >> N >> W;
    a.resize(N);
    for (int i = 0; i < N; i++) cin >> a[i];

    // dpテーブル初期化
    dp.assign(N+1, vector<int>(W+1, -1));

    // 状態(N, W)から樹形図を末端に向かって深さ優先探索
    if (rec(N, W) == 1) cout << "Yes" << endl;
    else cout << "No" << endl;
}
```

### 再帰ではなく bit 全探索で

項の選び方を 2 進数にエンコードして状態を表現することもできる．そうすれば bit 全探索になる．

```c++
#include <bits/stdc++.h>
using namespace std;

int main() {
    int N, W;
    cin >> N >> W;
    vector<int> a(N);
    for (int i = 0; i < N; i++)
        cin >> a[i];

    for (int bit = 0; bit < (1 << N); bit++) {
        int tmpsum = 0;
        for (int i = 0; i < N; i++) {
            if (bit && (1 << i)) {
                tmpsum += a[i];
            }
        }
        if (tmpsum == W) {
            cout << "Yes" << endl;
            return 0;
        }
    }
    cout << "No" << endl;
    return 0;
}
```
