---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "「再帰」についての学び直し"
subtitle: ""
summary: ""
authors: []
tags: [再帰, recursion, AtCoder, 競技プログラミング, 競プロ]
categories: []
date: 2020-04-10T18:10:28+09:00
lastmod: 2020-12-17T12:10:28+09:00
featured: false
draft: false


---

# はじめに

- 再帰関数に対する「なんとなくわかる」を「書ける」にまで持っていきたいので，学び直し．

- @drken さんの「[再帰関数を学ぶと，どんな世界が広がるか](https://qiita.com/drken/items/23a4f604fa3f505dd5ad)」を参考に，写経しながら学習．
  - ありがとうございます．

# 再帰関数

- 再帰関数：自分自身を呼び出す

```
戻り値の型 func(引数)
{
    if (ベースケース)
    {
        return ベースケースに対する値;
    }

    func(次の引数); // ここで再帰呼び出し

    return 答え;
}
```

- 再帰関数を書くときのポイント

  - ベースケースに対して必ず`return`する
  - 再帰呼び出しをするとき，もとの問題より**小さい**問題に対する呼び出しを行う．より小さい問題の系列が最終的にベースケースにたどり着くようにする

- ベースケースに対する処理を必ず入れる．入れないと無限に自分を呼び出すことになって stack overflow

- $n$以下の正の整数の総和を再帰で計算するプログラム

```cpp
int sum(int n)
{
    if (n == 0) return 0; // base case
    return sum(n - 1) + n;
}
```

- ベースケースに対しての`return`を書くことで，再帰関数の有限停止性が得られる

- フィボナッチ数列の第$n$項を再帰関数で求める

```cpp
int fibo(int n)
{
    if (n == 0) return 0;      // base case
    else if (n == 1) return 1; // base case

    return fibo(n - 1) + fibo(n - 2);
}
```

- フィボナッチ数列の第$n$項を再帰関数で求める実装では，$n$が大きくなると再帰関数の呼び出しが爆発してしまう

- なので，結果をメモしておくと不必要に再帰関数を呼び出す必要がなくなり大きな$n$に対しても計算可能になる -> メモ化再帰（動的計画法）

```cpp
#include <bits/stdc++.h>
using namespace std;

int main()
{
    vector<long long> table(50);
    table[0] = 0;
    table[1] = 1;

    for (int n = 2; i < 50; i++)
    {
        table[n] = table[n-1] + table[n-2];
    }
    return 0;
}
```

```cpp
long long fibo(int n, vector<long long> &memo)
{
    if (n == 0) return 0;      // base case
    else if (n == 1) return 1; // base case

    if (memo[n] != -1) return memo[n]; // 計算済みなのでメモってあったのを返す

    return memo[n-1] + memo[n-2];
}
```

- 再帰関数は以下のような問題で使える

  - （$n$を変数として）$n$重の`for`文を書きたいとき：数独ソルバ・部分和問題など
  - グラフ上の探索：トポロジカルソート・サイクル検出・二部グラフ判定など
  - 再帰的なアルゴリズム：ユークリッドの互除法・繰り返し自乗法
    ・再帰下降構文解析など
  - 分割統治法：マージソート・クイックソートなど
  - メモ化再帰・動的計画法

- $n$重の`for`ループを書きたい：$a_i$（$i = 0, 1, ..., n-1$）円のコインがそれぞれ 1 枚ずつ手元にあるとき，合計が$X$円になるようなコインの選び方は何通りあるか
  - 全部で$2^n$通りのコインの選び方がある
  - 各コインについて「選ぶ選ばない」で`for`ループを書こうとすると$n$重の`for`ループになるが，実行時に$n$が決まるのでそのまま書けない
  - $a_{n-1}$を選ぶか選ばないかは，$a_0$から$a_{n-2}$の組み合わせで$X-a_{n-1}$円を実現できるかにかかっている
  - ...
  - $a_1$を選ぶか選ばないかは，$a_0$から$a_0$の組み合わせで$X-a_{n-1}-a_{n-2}-...-a_2-a_1$円を実現できるかにかかっている
  - $a_0$を選ぶか選ばないかは，$a_0$から$a_{-1}$の組み合わせで$X-a_{n-1}-a_{n-2}-...-a_2-a_1-a_0$円を実現できるかにかかっている -> $a_0$を選ぶか選ばないかは，$X$が$0$であるかどうかにかかっている

```cpp
// a_0-a_iのコインで合計xを実現できるかを計算
bool solve(int i, int x, const vector<int> &a)
{
    if (i == 0)
    {
        if (x == 0) return true; // 合計0を実現することは可能
        else return false;
    }

    if (solve(i-1, x, a)) return true;
    if (solve(i-1, x-a[i-1], a)) return true;

    return false;
}
```

- メモ化による高速化：`memo[i][x]`に`solve(i, x)`の結果を入れておく

```cpp
bool solve(int i, int x, const vector<int> &a, vector<vector<int>> &memo)
{
    if (i == 0)
    {
        if (x == 0) return true;
        else return false;
    }

    if (memo[i][x] != -1) return dp[i][x];

    if (solve(i-1, x, a, memo)) return memo[i][x] = 1;
    if (solve(i-1, x-a[i-1], a, memo)) return memo[i][x] = 1;

    return memo[i][x] = 0;
}
```

- 数独ソルバ

```cpp
#include <bits/stdc++.h>
using namespace std;

using Field = vector<vector<int>>;

void solve(Field &field, vector<Field> &results)
{
    int emptyi = -1, emptyj = -1;
    for (int i = 0; i < 9 && emptyi == -1; i++)
    {
        for (int j = 0; j < 9 && emptyj == -1; j++)
        {
            if (field[i][j] == -1) {
                emptyi = i;
                emptyj = j;
                break;
            }
        }
    }

    // ベースケース：すべてのマスを埋め終わった
    if (emptyi == -1 || emptyj == -1)
    {
        results.push_back(field);
        return;
    }

    vector<bool> usable(10, true);
    for (int i = 0; i < 9; i++)
    {
        // 同じ列に同じ数字はだめ
        if (field[emptyi][i] != -1) usable[field[emptyi][i]] = false;

        // 同じ行に同じ数字はだめ
        if (field[i][emptyj] != -1) usable[field[i][emptyj]] = false;

        // 同じブロック内に同じ数字はだめ
        int bi = emptyi / 3 * 3 + 1;
        int bj = emptyj / 3 * 3 + 1;
        for (int di = bi - 1; di <= bi + 1; di++)
        {
            for (int dj = bj - 1; dj <= bj + 1; dj++)
            {
                if (field[di][dj] != -1)
                {
                    usable[field[di][dj]] = false;
                }
            }
        }
    }

    // 入れられる数字全部試す
    for (int v = 1; v <= 9; v++)
    {
        if (!usable[v]) continue;
        field[emptyi][emptyj] = v; // 空きマスにおける数字を置いてみた
        solve(field, results); // 再帰的に，空きマスの個数が一つ減った問題を解きに行く
    }

    field[emptyi][emptyj] = -1; // 深さ優先探索なので戻ったときに状態を戻しておく
}

int main()
{
    Field field(9, vector<int>(9, -1));

    for (int i = 0; i < 9; i++)
    {
        string line; cin >> line;
        for (int j = 0; j < 9; j++)
        {
            if (line[j] == '*') continue;
            int num = line[j] - '0';
            field[i][j] = num;
        }
    }

    vector<Field> results;
    solve(field, results);

    if (results.size() == 0) cout << "no solution..." << endl;
    else if (1 < results.size()) cout << "more than one solution" << endl;
    else
    {
        Field ans = results[0];
        for (int i = 0; i < 9; i++)
        {
            for (int j = 0; j < 9; j++)
            {
                cout << ans[i][j] << " ";
            }
            cout << endl;
        }
    }
}
```

- グラフ上の探索：深さ優先探索は再帰関数で書ける

```cpp
#include <bits/stdc++.h>
using namespace std;

using Graph = vector<vector<int>>;

void dfs(int v, const Graph &G, vector<bool> &seen)
{
    seen[v] = true; // 頂点vを訪れたことを記録
    for (auto next: G[v])
    {
        if (seen[next]) continue; // vの隣接頂点のうち訪問済みのものはスキップ
        dfs(next, G, seen);
    }
}

int main()
{
    int N, M; cin >> N >> M;
    Graph G(N);

    for (int i = 0; i < M; i++)
    {
        int a, b; cin >> a >> b;
        G[a].push_back(b);
    }

    vector<bool> seen(N, false);
    for (int v = 0; v < N; v++)
    {
        if (seen[v]) continue; // 連結ではないグラフにも対応
        dfs(v, G, seen);
    }
    return 0;
}
```

- グラフ上の探索：トポロジカルソート．再帰関数から抜けるタイミングでメモっておくことでトポロジカルソートになる

```cpp
#include <bits/stdc++.h>
using namespace std;

using Graph = vector<vector<int>>;

void rec(int v, const Graoh &G, vector<bool> &seen, vector<int> &order)
{
    seen[v] = true;

    for (auto next: G[v])
    {
        if (seen[next]) continue;
        rec(next, G, seen, order);
    }

    order.push_back(v); // 抜けるタイミングでメモ
}

int main()
{
    int N, M; cin >> N >> M;
    Graph G(N);

    for (int i = 0; i < M; i++)
    {
        int a, b; cin >> a >> b;
        G[a].push_back(b);
    }
    vector<bool> seen(N, false);
    vector<int> order;
    for (int v = 0; v < N; v++)
    {
        if (seen[v]) continue; // 連結ではないグラフにも対応
        rec(v, G, seen, order);
    }

    reverse(order.begin(), order.end());

    for (auto v: order) cout << v << " -> ";
    cout << endl;
    return 0;
}
```

- ユークリッドの互除法：最大公約数を求める

```cpp
long long gcd(long long a, long long b)
{
    if (a < b) swap(a, b);

    if (b == 0) return a;
    else return gcd(b, a % b);
}

long long lcm(long long a, long long b)
{
    if (a < b) swap(a, b);
    return a * b / gcd(a, b);
}
```

- 繰り返し自乗法：効率的に$x^n mod m$を求める

```cpp
long long modpow(long long x, long long n, long long m)
{
    if (n == 0) return 1; // ベースケース

    long long half = modpow(x, n/2, m);
    long long res = half * half % m;

    if (n & 1) // nが奇数のとき
        res = res * x % m;

    return res;
}
```

- Union-Find tree

```cpp
struct UnionFindTree
{
    vector<int> parent, rank;

    UnionFindTree(int size): parent(size, -1), rank(size, -1) {}

    void init(int size) {
        parent.assign(size, -1);
        rank.assign(size, 0);
    }

    int root(int x)
    {
        if (parent[x] == -1) return x;
        else return parent[x] = root(parent[x]);
    }

    bool is_same(int x, int y)
    {
        return root(x) == root(y);
    }

    bool merge(int x, int y)
    {
        x = root(x);
        y = root(y);
        if (x == y) return false;
        if (rank[x] < rank[y]) swap(x, y);
        if (rank[x] == rank[y]) rank[x]++;
        parent[y] = x;
        return true;
    }
}
```

- 再帰下降構文解析

```cpp
#include <bits/stdc++.h>
using namespace std;

// 再帰下降パーサ
template<class T> struct Parser {
    // results
    int root;                       // vals[root] is the answer
    vector<T> vals;                 // value of each node
    vector<char> ops;               // operator of each node ('a' means leaf values)
    vector<int> left, right;        // the index of left-node, right-node
    vector<int> ids;                // the node-index of i-th value
    int ind = 0;

    void init() {
        vals.clear(); ops.clear(); left.clear(); right.clear(); ids.clear();
        ind = 0;
    }

    // generate nodes
    int newnode(char op, int lp, int rp, T val = 0) {
        ops.push_back(op); left.push_back(lp); right.push_back(rp);
        if (op == 'a') {
            vals.push_back(val);
            ids.push_back(ind++);
        }
        else {
            if (op == '+') vals.push_back(vals[lp] + vals[rp]);
            else if (op == '-') vals.push_back(vals[lp] - vals[rp]);
            else if (op == '*') vals.push_back(vals[lp] * vals[rp]);
            else if (op == '/') vals.push_back(vals[lp] / vals[rp]);
            ids.push_back(-1);
        }
        return (int)vals.size() - 1;
    }

    // main solver
    T solve(const string &S) {
        int p = 0;
        string nS = "";
        for (auto c : S) if (c != ' ') nS += c;
        root = expr(nS, p);
        return vals[root];
    }

    // parser
    int expr(const string &S, int &p) {
        int lp = factor(S, p);
        while (p < (int)S.size() && (S[p] == '+' || S[p] == '-')) {
            char op = S[p]; ++p;
            int rp = factor(S, p);
            lp = newnode(op, lp, rp);
        }
        return lp;
    }

    int factor(const string &S, int &p) {
        int lp = value(S, p);
        while (p < (int)S.size() && (S[p]== '*' || S[p] == '/')) {
            char op = S[p]; ++p;
            int rp = value(S, p);
            lp = newnode(op, lp, rp);
        }
        return lp;
    }

    int value(const string &S, int &p) {
        if (S[p] == '(') {
            ++p;                    // skip '('
            int lp = expr(S, p);
            ++p;                    // skip ')'
            return lp;
        }
        else {
            T val = 0;
            int sign = 1;
            if (p < (int)S.size() && S[p] == '-') sign = -1;
            while (p < (int)S.size() && S[p] >= '0' && S[p] <= '9') {
                val = val * 10 + (int)(S[p] - '0');
                ++p;
            }
            return newnode('a', -1, -1, val);
        }
    }
};


int main() {
    Parser<int> parse;
    cout << parse.solve("6 + 3") << endl;
    cout << parse.solve("3 + (10 - 4) / 2") << endl;
    cout << parse.solve("((6 - 3) * 2 + 10 / 5) * (-3)") << endl;
}
```

- 末尾再帰による最適化

  - 再帰関数内での自身の呼び出しが再帰関数内の末尾，正確には`return`の直前なら，再帰関数のコールスタックの再利用が可能なので通常の繰り返しと同じ計算が可能
  - 再帰関数を末尾再帰に書き換えることでより大きい問題を計算できることがある
  - ref: https://qiita.com/pebblip/items/cf8d3230969b2f6b3132

- 末尾再帰ではない階乗の計算

```javascript
function factorial(n) {
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1); // この再帰呼び出しは，再帰呼び出しの結果を用いて計算をしているので末尾再帰ではない（再帰呼び出しがreturnの直前ではない）
}
```

- 末尾再帰に書き換えた階乗の計算

```javascript
function factorial(n) {
  function factorialTail(n, accum) {
    // accumに直前の結果をためておく
    if (n === 0) {
      return accum;
    }
    return factorialTail(n - 1, n * accum); // このfactorialTailの呼び出しは末尾再帰
  }

  return factorialTail(n, 1);
}
```

- Babel では末尾再帰な再帰関数は通常の`while`ループで書き直す最適化が実装されている

```javascript
function factorial(n) {
  // 再帰呼び出しが除去されている
  function factorialTail(_x, _x2) {
    var _again = true;

    _function: while (_again) {
      var n = _x,
        accum = _x2;
      _again = false;

      if (n === 0) {
        return accum;
      }
      _x = n - 1;
      _x2 = n * accum;
      _again = true;
      continue _function;
    }
  }

  return factorialTail(n, 1);
}
```
