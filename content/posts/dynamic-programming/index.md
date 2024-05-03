---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "動的計画法"
subtitle: ""
summary: "🚧まだ未完成"
authors: []
tags: [AtCoder, Competitive Programming, C++, cpp, 競技プログラミング, 競プロ, ABC, Dynamic Programming, DP, 動的計画法]
categories: []
date: 2020-04-08T22:16:47+09:00
lastmod: 2020-04-08T22:16:47+09:00
featured: false
draft: true
---

## 動的計画法 Dynamic Programming

ある問題$X$を解決しようとするとき，それよりもサイズの小さい問題$x$を解決してその結果を用いて$X$を解こうとするような考え方とその考え方に則ったアルゴリズムを動的計画法 Dynamic Programmingと呼ぶ．

問題にある種の構造を見出すことでDPを使って問題を解決できたりできなかったりする．

「より小さいサイズの問題を解決して，その結果を用いてより大きい問題を解こう」という考え方は，数学の漸化式に似ている．問題を漸化式で表現してそれをそのままプログラムにするとメモ化DP（サイズの小さい問題の結果をメモしておいてその結果を用いて大きいサイズの問題を解くDP）になる．

## 例題

> 【**問題**】$N$個の足場があり，$i$番目の足場の高さは$h_i$である．最初，足場$1$にあなたは立っている．あなたは用事があって足場$N$に向かわなければなりません．あなたは足場$i$に立っているとき，
>
> 1. 体力を$|h_i - h_{i+1}|$だけ消費して，足場$i$から足場$i+1$に移動する
> 2. 体力を$|h_i - h_{i+2}|$だけ消費して，足場$i$から足場$i+2$に移動する
>
> のどちらかの行動を取ることができます．あなたは疲れたくないので，最終的に消費する体力をできるだけ小さくしたいです．あなたが足場$1$から足場$N$に行くまでに，消費すべき最小の体力を求めよ．

この問題はDPで解ける典型的な問題である．「足場$1$から足場$N$まで行くのに，消費すべき最小の体力」を$p_N$とすると，足場$N$（$3 \leq N$）には

1. 足場$N-1$から体力を$|h_{N-1} - h_N|$消費して到達する
2. 足場$N-2$から体力を$|h_{N-2} - h_N|$消費して到達する

のどちらか **しか** なく，つまり，「足場$1$から足場$N$まで行くのに，消費すべき最小の体力$p_N$」は

1. 「足場$1$から足場$N-1$まで行くのに，消費すべき最小の体力$p_{N-1}$」と「足場$N-1$-足場$N$間の移動で消費する体力$|h_{N-1} - h_N|$」の和
2. 「足場$1$から足場$N-2$まで行くのに，消費すべき最小の体力$p_{N-2}$」と「足場$N-2$-足場$N$間の移動で消費する体力$|h_{N-2} - h_N|$」の和

の小さい方となる．

足場$1$から足場$N$まで行くのに，消費すべき最小の体力$p_N$を求めようとするときに，足場$1$から足場$N-1$まで行くのに，消費すべき最小の体力$p_{N-1}$と足場$1$から足場$N-2$まで行くのに，消費すべき最小の体力$p_{N-2}$という部分問題の解が必要になる．これを繰り返していくとサイズが最小の問題にたどり着く．サイズが最小の問題はほとんど解が自明であるので，結果問題を解いたことになる．問題に「玉ねぎ構造」を見いだせるとDPで解くことができそうだと予想がつく．

数式を持ち出して書こうとするならば，

$$p_N = {\rm{min}}(p_{N-1} + |h_{N-1} - h_N|, p_{N-2} + |h_{N-2} - h_N|)$$

実際にコードにこれを落とし込むときには，部分問題の解を配列などに記録しておくことになる．

```cpp
#include <bits/stdc++.h>
using namespace std;

template<class T> inline bool chmax(T &a, T b) {
  if (a < b) {
    a = b;
    return true;
  }
  return false;
}

template<class T> inline bool chmin(T &a, T b) {
  if (b < a) {
    a = b;
    return true;
  }
  return false;
}

const long long INF = 1LL << 60;

long long h[100010];
long long dp[100010];

int main() {
  int N; cin >> N;
  for (int i = 0; i < N; i++) cin >> h[i];
  for (int i = 0; i < 100010; i++) dp[i] = INF;

  dp[0] = 0;

  for (int i = 0; i < N; i++) {
    chmin(dp[i], dp[i-1] + abs(h[i] - h[i-1]));
    if (1 < i) chmin(dp[i], dp[i-2] + abs(h[i] - h[i-2]));
  }

  cout << dp[N-1] << endl;
  return 0;
}
```

## DPの実装の大枠

DPはだいたい次のような実装になる．

```
1. 部分問題の解をメモっておくDP配列を用意し，問題の性質に応じて初期化
2. 初期条件を入力
3. ループを回して（添字を回して）DP配列を更新
4. DP配列から答えを得て出力
```

問題によってDP配列の初期値や更新ルールは変わってくる．上の例題では，最小値を求めたかったので，DP配列はとにかく大きい値で初期化しておいて，小さい値に更新していくように`chmin()`関数をつかってDP配列を更新していく．最大化問題では，とにかく小さい値で初期化しておいて，大きい値に更新していくように`chmax()`関数を使ってDP配列を更新していく．数え上げ問題では，DP配列は$0$に初期化しておくと良い．

## 「配るDP」と「貰うDP」

DP配列の更新の仕方に着目すると「配るDP」と「貰うDP」がある．これらは本質的に違うものというわけではなくて， **どの添字を主語にして問題の構造を捉えるか** の差でしかない．

「配るDP」というのは，「よりサイズの大きい君の問題を解くために，サイズの小さい僕の結果でサイズの大きい問題の答えを更新して！」という態度のDPで，上の例題を

```cpp
chmin(dp[i+1], dp[i] + abs(h[i] - h[i+1]));
chmin(dp[i+2], dp[i] + abs(h[i] - h[i+2]));
```

と捉えるようなDPである．このとき，「添字$i$の問題」は「添字$i+1$の問題」や「添字$i+2$の問題」よりサイズが小さいく，その結果を用いて，よりサイズの大きい問題の解を更新している．

一方で「貰うDP」というのは，「よりサイズの大きい問題である僕の解を更新するために，サイズの小さい君の問題の結果を使って，僕の答えを更新する」という態度のDPで，上の例題を

```cpp
chmin(dp[i], dp[i-1] + abs(h[i] - h[i-1]));
chmin(dp[i], dp[i-2] + abs(h[i] - h[i-2]));
```

と捉えるようなDPである．比べればわかるが，要するにどのサイズを主語にしてDP配列の更新を捉えるかという差でしかない．

## 動的計画法の練習問題

- [EDPC A](https://atcoder.jp/contests/dp/tasks/dp_a)
  - [ABC 40 C](https://atcoder.jp/contests/abc040/tasks/abc040_c)
  - [ABC 129 C](https://atcoder.jp/contests/abc129/tasks/abc129_c)
  - [AOJ 168](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=0168)
- [EDPC B](https://atcoder.jp/contests/dp/tasks/dp_b)
  - [ABC 99 C](https://atcoder.jp/contests/abc099/tasks/abc099_c)
- [EDPC C](https://atcoder.jp/contests/dp/tasks/dp_c)
- [EDPC D](https://atcoder.jp/contests/dp/tasks/dp_d)
  - [TDPC A](https://atcoder.jp/contests/tdpc/tasks/tdpc_contest)
  - [TDPC D](https://atcoder.jp/contests/tdpc/tasks/tdpc_dice)
  - [ABC 15 D](https://atcoder.jp/contests/abc015/tasks/abc015_4)
  - [JOI2010 予選 D](https://atcoder.jp/contests/joi2011yo/tasks/joi2011yo_d)
  - 🚧[JOI2011 予選 D](https://atcoder.jp/contests/joi2011yo/tasks/joi2011yo_d)
  - 🚧[JOI2012 予選 D](https://atcoder.jp/contests/joi2012yo/tasks/joi2012yo_d)
  - 🚧[JOI2010 本選 B](https://atcoder.jp/contests/joi2011ho/tasks/joi2011ho2)
  - 🚧[AOJ 2566](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=2566)
- [EDPC E](https://atcoder.jp/contests/dp/tasks/dp_e)
  - 🚧[ARC 57 B](https://atcoder.jp/contests/arc057/tasks/arc057_b)
  - 🚧[AOJ 2263](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=2263)
  - 🚧[ABC 32 D](https://atcoder.jp/contests/abc032/tasks/abc032_d)
- 🚧[EDPC F](https://atcoder.jp/contests/dp/tasks/dp_f)
- 🚧[EDPC G](https://atcoder.jp/contests/dp/tasks/dp_g)
- 🚧[EDPC H](https://atcoder.jp/contests/dp/tasks/dp_h)
- 🚧[EDPC I](https://atcoder.jp/contests/dp/tasks/dp_i)
- 🚧[EDPC J](https://atcoder.jp/contests/dp/tasks/dp_j)
- 🚧[EDPC K](https://atcoder.jp/contests/dp/tasks/dp_k)
- 🚧[EDPC L](https://atcoder.jp/contests/dp/tasks/dp_l)
- 🚧[EDPC M](https://atcoder.jp/contests/dp/tasks/dp_m)
- 🚧[EDPC N](https://atcoder.jp/contests/dp/tasks/dp_n)
- 🚧[EDPC O](https://atcoder.jp/contests/dp/tasks/dp_o)
- 🚧[EDPC P](https://atcoder.jp/contests/dp/tasks/dp_p)
- 🚧[EDPC Q](https://atcoder.jp/contests/dp/tasks/dp_q)
- 🚧[EDPC R](https://atcoder.jp/contests/dp/tasks/dp_r)
- 🚧[EDPC S](https://atcoder.jp/contests/dp/tasks/dp_s)
- 🚧[EDPC T](https://atcoder.jp/contests/dp/tasks/dp_t)
- 🚧[EDPC U](https://atcoder.jp/contests/dp/tasks/dp_u)
- 🚧[EDPC V](https://atcoder.jp/contests/dp/tasks/dp_v)
- 🚧[EDPC W](https://atcoder.jp/contests/dp/tasks/dp_w)
- 🚧[EDPC X](https://atcoder.jp/contests/dp/tasks/dp_x)
- 🚧[EDPC Y](https://atcoder.jp/contests/dp/tasks/dp_y)
- 🚧[EDPC Z](https://atcoder.jp/contests/dp/tasks/dp_z)

## 解説

### [EDPC A](https://atcoder.jp/contests/dp/tasks/dp_a)

問題から「玉ねぎ構造」を見つけ出す．ノード$i$に遷移する方法は，ノード$i-1$から遷移してくるかノード$i-2$から遷移してくるの2通り **しか** ないので最小コストについて漸化式が簡単に立てられる．

- 貰うDPでの解答

```cpp
#include <bits/stdc++.h>
using namespace std;

template<class T> inline bool chmax(T &a, T b) {
  if (a < b) {
    a = b;
    return true;
  }
  return false;
}

template<class T> inline bool chmin(T &a, T b) {
  if (b < a) {
    a = b;
    return true;
  }
  return false;
}

const long long INF = 1LL << 60;

long long h[100010];
long long dp[100010];

int main() {
  int N; cin >> N;
  for (int i = 1; i <= N; i++) cin >> h[i];
  for (int i = 0; i < 100010; i++) dp[i] = INF;

  dp[1] = 0;

  for (int i = 2; i <= N; i++) {
    chmin(dp[i], dp[i-1] + abs(h[i] - h[i-1]));
    if (3 <= i) chmin(dp[i], dp[i-2] + abs(h[i] - h[i-2]));
  }

  cout << dp[N] << endl;
  return 0;
}
```

- 配るDPでの解答

```cpp
#include <bits/stdc++.h>
using namespace std;

template<class T> inline bool chmax(T &a, T b) {
  if (a < b) {
    a = b;
    return true;
  }
  return false;
}

template<class T> inline bool chmin(T &a, T b) {
  if (b < a) {
    a = b;
    return true;
  }
  return false;
}

const long long INF = 1LL << 60;

long long h[100010];
long long dp[100010];

int main() {
  int N; cin >> N;
  for (int i = 1; i <= N; i++) cin >> h[i];
  for (int i = 0; i < 100010; i++) dp[i] = INF;

  dp[1] = 0;

  for (int i = 1; i <= N; i++) {
    chmin(dp[i+1], dp[i] + abs(h[i+1] - h[i]));
    chmin(dp[i+2], dp[i] + abs(h[i+2] - h[i]));
  }

  cout << dp[N] << endl;
  return 0;
}
```

DPは「玉ねぎ構造」があるような問題に対して有効な考え方であり，問題の解き方である．一方で，再帰関数もそういった「玉ねぎ構造」を表現する手法として知られていて，もちろん再帰関数を用いてもDPの処理は書くことができる．その際には，再帰関数のスタックが積まれすぎないように，小さい部分問題の解をメモしておく．これは「メモ化再帰」と呼ばれることがある．

- メモ化再帰による解答

```cpp
#include <bits/stdc++.h>
using namespace std;

template<class T> inline bool chmax(T &a, T b) {
  if (a < b) {
    a = b;
    return true;
  }
  return false;
}

template<class T> inline bool chmin(T &a, T b) {
  if (b < a) {
    a = b;
    return true;
  }
  return false;
}

const long long INF = 1LL << 60;

long long h[100010];
long long dp[100010];

long long rec(int i) {
  // メモしてあるならその結果を返し即座に抜ける
  if (dp[i] < INF) return dp[i];

  // ベースケース
  if (i == 1) return 0;

  long long res = INF;
  chmin(res, rec(i-1) + abs(h[i] - h[i-1]));
  if (3 <= i) chmin(res, rec(i-2) + abs(h[i] - h[i-2]));

  dp[i] = res; // メモする
  return res;
}

int main() {
  int N; cin >> N;
  for (int i = 1; i <= N; i++) cin >> h[i];
  for (int i = 0; i < 100010; i++) dp[i] = INF;
  cout << rec(N) << endl;
  return 0;
}
```

### [ABC 40 C](https://atcoder.jp/contests/abc040/tasks/abc040_c)

全く同じ問題．

```cpp
#include <bits/stdc++.h>
using namespace std;

template<class T> inline bool chmax(T &a, T b) {
  if (a < b) {
    a = b;
    return true;
  }
  return false;
}

template<class T> inline bool chmin(T &a, T b) {
  if (b < a) {
    a = b;
    return true;
  }
  return false;
}

const long long INF = 1LL << 60;

long long a[100010];
long long dp[100010];

int main() {
  int N; cin >> N;
  for (int i = 1; i <= N; i++) cin >> a[i];
  for (int i = 0; i < 100010; i++) dp[i] = INF;

  dp[1] = 0;

  for (int i = 1; i <= N; i++) {
    chmin(dp[i+1], dp[i] + abs(a[i] - a[i+1]));
    chmin(dp[i+2], dp[i] + abs(a[i] - a[i+2]));
  }

  cout << dp[N] << endl;
  return 0;
}
```

### [ABC 129 C](https://atcoder.jp/contests/abc129/tasks/abc129_c)

同じような問題設定で，対象が数え上げ．

```cpp
#include <bits/stdc++.h>
using namespace std;

long long MOD = 1000000007;
long long dp[100010];
long long ok[100010];

int main() {
  int N, M; cin >> N >> M;
  for (int i = 0; i < 100010; i++) ok[i] = true;
  for (int i = 0; i < M; i++) {
    int a; cin >> a;
    ok[a] = false;
  }
  for (int i = 0; i < 100010; i++) dp[i] = 0;

  dp[0] = 1;

  for (int now = 0; now <= N; now++) {
    if (ok[now+1]) {
      dp[now+1] += dp[now];
      dp[now+1] %= MOD;
    }
    if (ok[now+2]) {
      dp[now+2] += dp[now];
      dp[now+2] %= MOD;
    }
  }

  cout << dp[N] << endl;
  return 0;
}
```

### [AOJ 168](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=0168)

```cpp
#include <bits/stdc++.h>
using namespace std;

long long dp[35];

int main() {
  for (int i = 0; i < 35; i++) dp[i] = 0;
  dp[0] = 1;
  dp[1] = 2;
  dp[2] = 4;
  for (int i = 3; i < 35; i++) {
    dp[i] = dp[i-1] + dp[i-2] + dp[i-3];
  }
  int n;
  while (cin >> n) {
    if (n == 0) break;
    int days = 0;
    if (dp[n]%10 != 0) days = dp[n-1]/10 + 1;
    else days = dp[n-1]/10;
    int years = 0;
    if (days%365 != 0) years = days/365 + 1;
    else years = days/365;
    cout << years << endl;
  }
  return 0;
}
```

### [EDPC B](https://atcoder.jp/contests/dp/tasks/dp_b)

足場$i$に到達する方法が

- 足場$i-1$から$|h_i - h_{i-1}|$だけコストをかけて移動する
- 足場$i-2$から$|h_i - h_{i-2}|$だけコストをかけて移動する
- 足場$i-3$から$|h_i - h_{i-3}|$だけコストをかけて移動する
- ...
- 足場$i-K$から$|h_i - h_{i-K}|$だけコストをかけて移動する

の$K$通りになったので，

```cpp
chmin(dp[i], dp[i-1] + abs(h[i] - h[i-1]));
chmin(dp[i], dp[i-2] + abs(h[i] - h[i-2]));
chmin(dp[i], dp[i-3] + abs(h[i] - h[i-3]));
...
chmin(dp[i], dp[i-K] + abs(h[i] - h[i-K]));
```

となる．これは`for`文でうまく記述できる．配るDPで書くと$i-K$の処理を考えなくて済むので楽．

- 配るDPでの解答

```cpp
#include <bits/stdc++.h>
using namespace std;

template<class T> inline bool chmax(T &a, T b) {
  if (a < b) {
    a = b;
    return true;
  }
  return false;
}

template<class T>  inline bool chmin(T &a, T b) {
  if (b < a) {
    a = b;
    return true;
  }
  return false;
}

const long long INF = 1LL << 60;

long long h[100110];
long long dp[100110];

int main() {
  int N, K; cin >> N >> K;
  for (int i = 1; i <= N; i++) cin >> h[i];
  for (int i = 0; i < 100110; i++) dp[i] = INF;

  dp[1] = 0;

  for (int i = 1; i <= N; i++) {
    for (int k = 1; k <= K; k++) {
      chmin(dp[i+k], dp[i] + abs(h[i] - h[i+k]));
    }
  }

  cout << dp[N] << endl;
  return 0;
}
```

### [ABC 99 C](https://atcoder.jp/contests/abc099/tasks/abc099_c)

貰うDP．

```cpp
#include <bits/stdc++.h>
using namespace std;

const int INF = 1 << 30;
int dp[100010];

int main() {
  for (int i = 0; i < 100010; i++) dp[i] = INF;
  dp[0] = 0;
  for (int n = 1; n <= 100000; n++) {
    int power = 1;
    while (power <= n) {
      dp[n] = min(dp[n], dp[n-power] + 1);
      power *= 6;
    }
    power = 1;
    while (power <= n) {
      dp[n] = min(dp[n], dp[n-power] + 1);
      power *= 9;
    }
  }
  int N; cin >> N;
  cout << dp[N] << endl;
  return 0;
}
```

### [EDPC C](https://atcoder.jp/contests/dp/tasks/dp_c)

$i$日目の活動を決めるに当たって，$i-1$日目に何をしたのかという情報が必要．

```cpp
#include <bits/stdc++.h>
using namespace std;

long long dp[100010][4];
long long a[100010];
long long b[100010];
long long c[100010];

int main() {
  for (int i = 0; i < 100010; i++) for (int j = 0; j < 4; j++) dp[i][j] = -1;
  for (int i = 0; i < 100010; i++) {
    a[i] = b[i] = c[i] = 0;
  }
  int N; cin >> N;
  for (int i = 1; i <= N; i++) {
    cin >> a[i] >> b[i] >> c[i];
  }

  dp[1][1] = a[1];
  dp[1][2] = b[1];
  dp[1][3] = c[1];

  for (int now = 2; now <= N; now++) {
    dp[now][1] = max(dp[now-1][2] + a[now], dp[now-1][3] + a[now]);
    dp[now][2] = max(dp[now-1][1] + b[now], dp[now-1][3] + b[now]);
    dp[now][3] = max(dp[now-1][1] + c[now], dp[now-1][2] + c[now]);
  }

  cout << max(dp[N][1], max(dp[N][2], dp[N][3])) << endl;
  return 0;
}
```

### [EDPC D](https://atcoder.jp/contests/dp/tasks/dp_d)

ナップザック問題．DP配列を

```
dp[i] = 1番目の品物からi番目までの品物を使って，重さがWを超えないようにいくつかの商品を選んだときの，価値の最大値
```

とすると，`dp[i+1]`への遷移を考えるとき，つまり$i+1$番目の品物を選べるのかを判断するときに，`dp[i]`の価値を得る時に重さがいくつなのかが記録されていないので，$i+1$番目の品物を選べるかがわからない．`dp[i]`の重さが$W-w_{i+1}$以下なら$i+1$番目の品物を選んでもギリギリ$W$を超えないので価値の最大値を更新できる．

なのでDP配列を

```
dp[i][weight] = 1番目の品物からi番目までの品物を使って，重さがweightを超えないようにいくつかの商品を選んだときの，価値の最大値
```

とする．こうすることで

```
dp[i+1][weight] = max(dp[i+1][weight], dp[i][weight-item[i+1].weight] + item[i+1].value)
```

という更新式が得られる．

```cpp
#include <bits/stdc++.h>
using namespace std;

long long item_weight[110], item_value[110];
long long dp[110][100010];

int main() {
  int N, W; cin >> N >> W;
  for (int i = 1; i <= N; i++) {
    cin >> item_weight[i] >> item_value[i];
  }
  for (int i = 0; i < 110; i++) for (int j = 0; j < 100010; j++) dp[i][j] = 0;

  for (int i = 0; i <= N; i++) {
    for (int w = 0; w <= W; w++) {
      if (0 <= w - item_weight[i+1]) {
        dp[i+1][w] = max(dp[i+1][w], dp[i][w - item_weight[i+1]] + item_value[i+1]);
      }
      dp[i+1][w] = max(dp[i+1][w], dp[i][w]);
    }
  }

  cout << dp[N][W] << endl;
  return 0;
}
```

### [TDPC A](https://atcoder.jp/contests/tdpc/tasks/tdpc_contest)

$1$問目から$i$問目までの問題のうちから，適当に選んで得点$p$を達成できるかを持つDP配列を準備する．

```cpp
#include <bits/stdc++.h>
using namespace std;

int points[110];
bool dp[110][10010];

int main() {
  int N; cin >> N;
  for (int i = 0; i < 110; i++) points[110] = 0;
  for (int i = 0; i < 110; i++) for (int j = 0; j < 10010; j++) dp[i][j] = false;
  for (int i = 1; i <= N; i++) cin >> points[i];
  dp[0][0] = true;

  for (int i = 1; i <= N; i++) {
    for (int j = 0; j < 10010; j++) {
      if (0 <= j-points[i]) dp[i][j] |= dp[i-1][j-points[i]];
      dp[i][j] |= dp[i-1][j];
    }
  }

  int ans = 0;
  for (int i = 0; i <= 10010; i++) {
    if (dp[N][i]) ans++;
  }
  cout << ans << endl;
  return 0;
}
```

### [TDPC D](https://atcoder.jp/contests/tdpc/tasks/tdpc_dice)

サイコロの出目は$1$，$2$，$3$，$4$，$5$，$6$のいずれかなので，その積は$2^a \times 3^b \times 5^c$の形であるはず．

$D = 2^i \times 3^j \times 5^k$として，DP配列を

```
dp[n][i][j][k] = サイコロをn回振ったときの出目の積がD（= 2^i * 3^j * 5^k）で割り切れる確率
```

とする．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int N; cin >> N;
  long long D; cin >> D;
  int two = 0, three = 0, five = 0;

  cout << fixed << setprecision(12);

  // Dが2^a * 3^b * 5^cの形かどうかを確認
  while (1 < D) {
    if (D%2 == 0) {
      two++;
      D /= 2;
    }
    if (D%3 == 0) {
      three++;
      D /= 3;
    }
    if (D%5 == 0) {
      five++;
      D /= 5;
    }

    // Dが2^a * 3^b * 5^cの形でなければ出目の積がDで割り切れることは決してない
    if (D%2 != 0 && D%3 != 0 && D%5 != 0 && D != 1) {
      cout << 0 << endl;
      return 0;
    }
  }

  double dp[N+1][two+1][three+1][five+1] = {0};
  dp[0][0][0][0] = 1;

  for (int i = 0; i < N; i++) {
    for (int j = 0; j <= two; j++) {
      for (int k = 0; k <= three; k++) {
        for (int l = 0; l <= five; l++) {
          // i+1回目のサイコロの出目が1
          dp[i+1][j][k][l] += dp[i][j][k][l]/6.0;

          // i+1回目のサイコロの出目が2
          dp[i+1][min(two, j+1)][k][l] += dp[i][j][k][l]/6.0;

          // i+1回目のサイコロの出目が3
          dp[i+1][j][min(three, k+1)][l] += dp[i][j][k][l]/6.0;

          // i+1回目のサイコロの出目が4
          dp[i+1][min(two, j+2)][k][l] += dp[i][j][k][l]/6.0;

          // i+1回目のサイコロの出目が5
          dp[i+1][j][k][min(five, l+1)] += dp[i][j][k][l]/6.0;

          // i+1回目のサイコロの出目が6
          dp[i+1][min(two, j+1)][min(three, k+1)][l] += dp[i][j][k][l]/6.0;
        }
      }
    }
  }

  cout << dp[N][two][three][five] << endl;
  return 0;
}
```

### [ABC 15 D](https://atcoder.jp/contests/abc015/tasks/abc015_4)

ナップザック問題の亜種．幅の制約に加えて，使用枚数の制約がある．DP配列を

```
dp[i][j][k] = k番目までの画像を対象に，幅合計i・使用枚数j枚のときの，重要度の合計の最大値
```

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int W; cin >> W;
  int N, K; cin >> N >> K;
  int width[N], value[N];
  for (int i = 0; i < N; i++) {
    cin >> width[i] >> value[i];
  }

  // dp[i][j][k] = k番目までの画像を対象に，幅合計i・使用枚数j枚のときの，重要度の合計の最大値
  int dp[W+1][K+1][N+1];
  memset(dp, 0, sizeof(dp));

  for (int i = 1; i <= W; i++) {
    for (int j = 1; j <= K; j++) {
      for (int k = 1; k <= N; k++) {
        if (0 <= i - width[k-1]) {
          dp[i][j][k] = max(dp[i][j][k], dp[i-width[k-1]][j-1][k-1] + value[k-1]);
        }
        dp[i][j][k] = max(dp[i][j][k], dp[i][j][k-1]);
      }
    }
  }

  cout << dp[W][K][N] << endl;
  return 0;
}
```

### [JOI2010 予選 D](https://atcoder.jp/contests/joi2011yo/tasks/joi2011yo_d)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n; cin >> n; n--;
  int nums[n];
  for (int i = 0; i < n; i++) {
    cin >> nums[i];
  }
  int sum; cin >> sum;
  long long dp[110][30];
  memset(dp, 0, sizeof(dp));

  // dp[i][j]: 左からi個の穴に+/-を入れてa_0~a_iまでの部分和をjにする方法の総数
  // dp[i+1][j]: 左からi+1個の穴に+/-を入れてa_0~a_iまでの部分和をjにする方法の総数
  //     = dp[i][j-a_(i+1)] + dp[i][j+a_(i+1)]
  // dp[0][a_0]: 左から0個の穴に+/-を入れて部分和をa_0にする方法は1通り
  // dp[0][a_0以外]: 左から0個の穴に+/-を入れて部分和をa_0にする方法は0通り

  dp[0][nums[0]] = 1;

  for (int i = 0; i <= n; i++) {
      for (int j = 0; j <= 20; j++) {
      if (0 <= j + nums[i+1] && j + nums[i+1] <= 20) {
        dp[i+1][j] += dp[i][j+nums[i+1]];
      }
      if (0 <= j - nums[i+1] && j - nums[i+1] <= 20) {
        dp[i+1][j] += dp[i][j-nums[i+1]];
      }
    }
  }

  cout << dp[n-1][sum] << endl;
  return 0;
}

```

### 🚧[JOI2011 予選 D](https://atcoder.jp/contests/joi2011yo/tasks/joi2011yo_d)

TODO: write here

### 🚧[JOI2012 予選 D](https://atcoder.jp/contests/joi2012yo/tasks/joi2012yo_d)

TODO: write here

### 🚧[JOI2010 本選 B](https://atcoder.jp/contests/joi2011ho/tasks/joi2011ho2)

TODO: write here

### 🚧[AOJ 2566](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=2566)

TODO: write here

### [EDPC E](https://atcoder.jp/contests/dp/tasks/dp_e)

$1 \leq W \leq 10^9$という制約から，EDPC Dと同じ解き方だとDP配列のサイズがとんでもなくでかくなってしまう．そこで

```
dp[i][value] = 1番目の品物からi番目までの品物を使って，価値がvalueを以上になるようにいくつかの商品を選んだときの，重さの最小値
```

として，`dp[N][value]`の値が$W$以下であるような`value`の最大値を答えとすれば良い．

```cpp
#include <bits/stdc++.h>
using namespace std;

template<class T> inline bool chmin(T &a, T b) {
  if (b < a) {
    a = b;
    return true;
  }
  return false;
}

template<class T> inline bool chmax(T &a, T b) {
  if (a < b) {
    a = b;
    return true;
  }
  return false;
}

const long long INF = 1LL<<60;

const int MAX_N = 110;
const int MAX_V = 100100;

int N;
long long W, weight[MAX_N], value[MAX_N];

long long dp[MAX_N][MAX_V];

int main() {
  cin >> N >> W;
  for (int i = 0; i < N; i++) {
    cin >> weight[i] >> value[i];

    for (int i = 0; i < MAX_N; i++) {
      for (int j = 0; j < MAX_V; j++) {
        dp[i][j] = INF;
      }
    }
  }

  dp[0][0] = 0;

  for (int i = 0; i < N; i++) {
    for (int sum_v = 0; sum_v < MAX_V; sum_v++) {
      if (0 <= sum_v - value[i]) {
        chmin(dp[i+1][sum_v], dp[i][sum_v - value[i]] + weight[i]);
      }
      chmin(dp[i+1][sum_v], dp[i][sum_v]);
    }
  }

  long long res = 0;
  for (int sum_v = 0; sum_v < MAX_V; sum_v++) {
    if (dp[N][sum_v] <= W) {
      res = sum_v;
    }
  }
  cout << res << endl;
  return 0;
}
```

### 🚧[ARC 57 B](https://atcoder.jp/contests/arc057/tasks/arc057_b)

TODO: write

### 🚧[AOJ 2263](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=2263)

TODO: write

### 🚧[ABC 32 D](https://atcoder.jp/contests/abc032/tasks/abc032_d)

TODO: write

### 🚧[EDPC G](https://atcoder.jp/contests/dp/tasks/dp_g)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC H](https://atcoder.jp/contests/dp/tasks/dp_h)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC I](https://atcoder.jp/contests/dp/tasks/dp_i)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC J](https://atcoder.jp/contests/dp/tasks/dp_j)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC K](https://atcoder.jp/contests/dp/tasks/dp_k)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC L](https://atcoder.jp/contests/dp/tasks/dp_l)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC M](https://atcoder.jp/contests/dp/tasks/dp_m)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC N](https://atcoder.jp/contests/dp/tasks/dp_n)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC O](https://atcoder.jp/contests/dp/tasks/dp_o)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC P](https://atcoder.jp/contests/dp/tasks/dp_p)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC Q](https://atcoder.jp/contests/dp/tasks/dp_q)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC R](https://atcoder.jp/contests/dp/tasks/dp_r)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC S](https://atcoder.jp/contests/dp/tasks/dp_s)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC T](https://atcoder.jp/contests/dp/tasks/dp_t)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC U](https://atcoder.jp/contests/dp/tasks/dp_u)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC V](https://atcoder.jp/contests/dp/tasks/dp_v)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC W](https://atcoder.jp/contests/dp/tasks/dp_w)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC X](https://atcoder.jp/contests/dp/tasks/dp_x)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC Y](https://atcoder.jp/contests/dp/tasks/dp_y)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

### 🚧[EDPC Z](https://atcoder.jp/contests/dp/tasks/dp_z)

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  return 0;
}
```

## ref
- https://www.hamayanhamayan.com/entry/2017/02/27/021246
- http://dai1741.github.io/maximum-algo-2012/docs/dynamic-programming/
- https://kimiyuki.net/blog/2017/05/27/dp-and-competitive-programming/
- http://shindannin.hatenadiary.com/entry/20131208/1386512864
- https://qiita.com/drken/items/a5e6fe22863b7992efdb
- http://kutimoti.hatenablog.com/entry/2018/03/10/220819
- https://qiita.com/drken/items/7c6ff2aa4d8fce1c9361#11-bit-dp
- https://qiita.com/e869120/items/eb50fdaece12be418faa