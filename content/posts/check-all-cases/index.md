---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "全探索"
subtitle: ""
summary: ""
authors: []
tags: [AtCoder, Competitive Programming, C++, cpp, 競技プログラミング, 競プロ, 全探索, ビット全探索, 順列全探索, ABC]
categories: []
date: 2020-04-05T20:32:33+09:00
lastmod: 2020-04-05T20:32:33+09:00
featured: false
draft: false
---

## 全探索

競技プログラミングの「キホン」の「キ」．論理的に考えることになれすぎてると，当たり前過ぎて「なんかずるい」って思うけど，競技プログラムでは当たり前に使う．計算機が高速に計算できるんだから，それを使って問題を解決して何が悪いってか．

全探索とは **「ありうるパターンを全部調べ上げる」** こと．

百聞は一見にしかずということで例題を見てみる．

### 例題

> 【**問題**】数字が書かれている$N$枚の紙切れが入った袋がある．この袋から紙切れを取り出し，その紙切れに書いてある数字を確認して袋に戻すことを4回行い，4回の数字の和が$M$になればあなたの勝ちである．紙切れに書かれている数字が${K_1, K_2, ..., K_N}$であるとき，あなたはこのゲームに勝つことができるだろうか．判定せよ．
>
> 【**制約**】$N \leq 50$，$M \leq 10^8$，$N \leq 10^8$

難しいことを考えずに，「1回目に$K_a$，2回目に$K_b$，2回目に$K_c$，1回目に$K_d$を引く」として，起こりうるすべての数字の組$(a, b, c, d)$を全部調べれば判定できる．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n, m; cin >> n >> m;
  vector<int> k;
  for (int i = 0; i < n; i++) cin >> k[i];
  for (int a = 0; a < n; a++) {
    for (int b = 0; b < n; b++) {
      for (int c = 0; c < n; c++) {
        for (int d = 0; d < n; d++) {
          if (k[a] + k[b] + k[c] + k[d] == m) {
            cout << "Yes" << endl;
            return 0;
          }
        }
      }
    }
  }
  cout << "No" << endl;
  return 0;
}
```

## 4種類の全探索

全探索には4種類ある．

1つ目は，**純粋に全通り調べ上げる全探索**．めちゃめちゃ`for`ループ書くタイプ．制約次第で有効．

2つ目は，**工夫して探索の数を減らす全探索**．これもめちゃめちゃ`for`ループ書くタイプ．問題の性質やちょっとした考察を加えることで，やらなくていい探索をやらずに済ませる．純粋に全探索するのでは制約的に間に合わないような問題でも答えが得られるようになる．　　

3つ目は，**ビット全探索**．`for`ループで書きにくい問題はこれで解くことができる．

4つ目は，**順列全探索**．これも`for`ループで書きにくい問題を解くときに使う．

### 純粋な全探索

純粋な全探索は上で上げた例題のように，多重ループで全通りを調べ上げる．ループがネストしていくので問題の制約に注意を払う必要がある．上の例題だと4重の`for`ループになっているが，問題の制約として$N \leq 50$とあるので，最大でも$50^4 = 6.25 \times 10^6$回のループなので，現代的な計算機の性能を考慮すると余裕を持って問題を解くことができる．

### 工夫して探索数を減らした全探索

問題の性質やちょっとした考察を加えることで，やらなくていいループを見つけることができる．これによって1つ目の全探索よりもサイズの大きい問題を解くことができる．

例えば，先程の例題だと，$(a, b, c)$が決まってしまえば，$X = M - K_a - K_b - K_c$として，$X$が書かれた紙切れを引くことができるのかを調べれば問題を解くことができる．そのためには予め長さが$10^8$の`bool`配列を定義しておいて，$1$以上$10^8$以下の整数について，紙切れに書かれているのかを最初に記録しておけば，`O(1)`で「$X$を引くことができるか」は判定することができる．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n, m; cin >> n >> m;
  vector<int> k;
  vector<bool> exist(100000005, false);
  for (int i = 0; i < n; i++) {
    cin >> k[i];
    exist[k[i]] = true;
  }
  for (int a = 0; a < n; a++) {
    for (int b = 0; b < n; b++) {
      for (int c = 0; c < n; c++) {
        int x = m - k[a] - k[b] - k[c];
        if (exist[x]) {
          cout << "Yes" << endl;
          return 0;
        }
      }
    }
  }
  cout << "No" << endl;
  return 0;
}
```

### ビット全探索

ビット全探索とは，**$n$個の要素からなる集合${0, 1, 2, ..., n-1}$の部分集合をすべて数え上げる手法**のことで，**$N$個のものから，いくつか選ぶ方法を全列挙して調べ上げる手法**である．

$N$個のものからいくつか選ぶ場合の数は，それぞれについて「選ぶ」「選ばない」の2通りがあるので，ぜんぶで$2^N$通りある．ビット全探索では，**それぞれのものの選び方をビット列に対応付けることで全通りを調べ上げる**．

「$N$個のものからいくつか選ぶ」系の問題は例えば次のようなものがある．

> 【**問題**】$N$個の正整数$a_1, a_2, ... a_{N-1}$からいくつか選んでその総和を$W$にすることができるかを判定せよ．
>
> 【**制約**】$1 \leq N \leq 20$

こういう問題は，`for`ループで調べ上げにくい．そこで登場するのがビット全探索．

ビット全探索では，**「$N$個のものからいくつか選ぶ方法」を整数値に一対一に対応付ける**
．ものの選び方を，$i$個目のものを選ぶなら$1$，選ばないなら$0$として2進数の整数にしてあげることでこの対応付けを設ける．

この対応付けから，$N$個のものの選び方の全探索は

```cpp
for (int bit = 0; bit < (1 << N); bit++) {
  ;
}
```

と書ける．このループを回るとき`bit`は`000...000`から`111...111`を1つずつ巡っていくことになる．

数字から「ものの選び方」を復元する際にはビット演算を利用する．`bit`にエンコードされた「ものの選び方」をしたときに，$i$番目のものは選ばれているのかどうかは

```cpp
if (bit & (1 << i)) {
  ;
}
```

で判定できる．`1 << i`は「1をiビットだけ左シフトした値」なので，それとの`AND`を取ることで，`bit`の$i$番目のビットだけを取り出すことができる．

ものの選び方を表す整数`bit`から，そのときの選ばれたアイテムの番号を記録した配列を返す関数は次のように書ける．

```cpp
vector<int> Bit2Vec(int bit, int N) {
  vector<int> items;
  for (int i = 0; i < N; i++) {
    if (bit & (1 << i)) {
      items.push_back(i);
    }
  }
  return items;
}
```

しかし実際には，上のように「ものの選び方」を表す配列を用意することなく，**各アイテム番号`i = 0, 1, ...`に対して，アイテム`i`が`bit`で表現されるアイテムの集合に含まれていることがわかったら，それに応じた処理をその場で行ってしまう**ような実装をしている人が多い．

また，$i$ビット目を取り出す演算は，

```cpp
if ((bit >> i) & 1) {
  ;
}
```

とも書けて，こっちのほうが安全だったりすることがあるようなことを聞いたことがある（要出典）．

#### ビット全探索の例

> 【**問題**】$N$個の正整数$a_1, a_2, ... a_{N-1}$と正整数$W$が与えられる．$a_1, a_2, ... a_{N-1}$からいくつか選んでその総和を$W$にすることができるかを判定せよ．
>
> 【**制約**】$1 \leq N \leq 20$

この問題は， **「$N$個の正整数からいくつか選ぶ方法は$2^N$通りあり，それを1つづつ試しながら，総和が$W$になるかを確認する」** ことで解くことができる．正整数の選び方それぞれに対して，$O(N)$かけて総和を取ることになるので，全体の計算量は$O(2^N \times N)$．

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> Bit2Vec(int bit, int N) {
  vector<int> items;
  for (int i = 0; i < N; i++) {
    if ((bit >> i) & 1) {
      items.push_back(i);
    }
  }
  return items;
}

int main() {
  int N, W; cin >> N >> W;
  vector<int> a(N);
  for (int i = 0; i < N; i++) cin >> a[i];

  for (int bit = 0; bit < (1 << N); i++) {
    vector<int> items = Bit2Vec(bit, N);
    int sum = 0;
    for (int i : items) sum += a[i];
    if (sum == W) {
      cout << "Yes" << endl;
      return 0;
    }
  }
  cout << "No" << endl;
  return 0;
}
```

上の実装でも正しいが，**`bit`に対応するものの選び方において，アイテム`i`が選ばれるのかの判定と，選ばれるならその際の処理（ここでは総和の計算に用いる）をその場でやってしまう**ような実装にすることもできて，そうすることで`Bit2Vec`関数を書かなくて済むようになる．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int N, W; cin >> N >> W;
  vector<int> a(N);
  for (int i = 0; i < N; i++) cin >> a[i];
  for (int bit = 0; bit < (1 << N); i++) {
    int sum = 0;
    for (int i = 0; i < N; i++) {
      if ((bit >> i) & 1) {
        sum += a[i];
      }
    }
    if (sum == W) {
      cout << "Yes" << endl;
      return 0;
    }
  }
  cout << "No" << endl;
  return 0;
}
```

### 順列全探索

順列全探索は，**順序付きのものの選び方として考えられるものを全て調べ上げる**全探索．例えば「$N$個の都市を，好きな都市から出発して，全ての都市をちょうど1回ずつ訪れる方法のうち，最短の所要時間を求める」という巡回セールスマン問題を考えるとき，都市のめぐり方の総数は$N!$通りなので，その全てを試せば原理的に解ける．

C++では`std::next_permutation()`という便利関数があり，順列全探索をかんたんに書くことができる．

```cpp
#include <bits/stdc++.h>
using namespace std;

const int INF = 100000000;

int main() {
  int n; cin >> n;
  vector<vector<int>> g(n, vector<int>(n));
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
      cin >> g[i][j];
    }
  }

  vector<int> order(n);
  for (int i =0 ; i < n; i++) order[i] = i; // 都市番号順に訪れる方法で初期化

  int res = INF;

  // 順列全探索の典型的な書き方
  do {
    int tmp = 0;
    for (int i = 1; i < n; i++) {
      tmp += g[order[i-1]][order[i]];
    }
    if (tmp < res) {
      res = tmp;
    }
  } while (next_permutation(order.begin(), order.end()));

  cout << res << end;
  return 0;
}
```

`do {...} while (next_permutation(...));`で$n!$回ループして，それぞれについて，$O(n)$かけてコストの総和を取るので全体としては$O(n! \times n)$

## 全探索の練習問題

### 単純な全探索・ちょっと工夫する全探索

- [ITP 1-7 B](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ITP1_7_B&lang=ja)
- [ABC 144 B](https://atcoder.jp/contests/abc144/tasks/abc144_b)
- [ABC 150 B](https://atcoder.jp/contests/abc150/tasks/abc150_b)
- [ABC 122 B](https://atcoder.jp/contests/abc122/tasks/abc122_b)
- [ABC 136 B](https://atcoder.jp/contests/abc136/tasks/abc136_b)
- [ABC 106 B](https://atcoder.jp/contests/abc106/tasks/abc106_b)
- [ABC 120 B](https://atcoder.jp/contests/abc120/tasks/abc120_b)
- [ABC 57 C](https://atcoder.jp/contests/abc057/tasks/abc057_c)
- [ABC 95 C](https://atcoder.jp/contests/abc095/tasks/arc096_a)
- [住銀2019 D](https://atcoder.jp/contests/sumitrust2019/tasks/sumitb2019_d)
- [パ研杯2019 C](https://atcoder.jp/contests/pakencamp-2019-day3/tasks/pakencamp_2019_day3_c)
- [JOI2017 本選3](https://atcoder.jp/contests/joi2007ho/tasks/joi2007ho_c)
- [Square869120Contest #6 B](https://atcoder.jp/contests/s8pc-6/tasks/s8pc_6_b)
- [JOI2008 予選4](https://atcoder.jp/contests/joi2008yo/tasks/joi2008yo_d)

### ビット全探索

- [ABC 128 C](https://atcoder.jp/contests/abc128/tasks/abc128_c)
- [ABC 147 C](https://atcoder.jp/contests/abc147/tasks/abc147_c)
- [ABC 2 D](https://atcoder.jp/contests/abc002/tasks/abc002_4)
- [JOI2008 予選5](https://atcoder.jp/contests/joi2008yo/tasks/joi2008yo_e)
- [Square869120Contest #4 B](https://atcoder.jp/contests/s8pc-4/tasks/s8pc_4_b)

### 順列全探索

- [ABC 145 C](https://atcoder.jp/contests/abc145/tasks/abc145_c)
- [ABC 150 C](https://atcoder.jp/contests/abc150/tasks/abc150_c)
- [ABC 54 C](https://atcoder.jp/contests/abc054/tasks/abc054_c)
- [ALDS 1-13 A](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ALDS1_13_A&lang=ja)

## 解説

### 単純な全探索・ちょっと工夫する全探索

#### [ITP 1-7 B](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ITP1_7_B&lang=ja)

「$1$から$n$までの整数の中から，重複無しで3つの数を選ぶ」ときの数の選び方は${}_n\mathrm{P}_3$通りあり，全通り試してみれば原理的に解ける．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n, x;
  while (cin >> n >> x) {
    int cnt = 0;
    if (n == 0 && x == 0) break;
    for (int i = 1; i <= n-2; i++) {
      for (int j = i+1; j <= n-1; j++) {
        for (int k = j+1; k <= n; k++) {
          if (i + j + k == x) cnt++;
        }
      }
    }
    cout << cnt << endl;
  }
  return 0;
}
```

#### [ABC 144 B](https://atcoder.jp/contests/abc144/tasks/abc144_b)

与えられた整数$N$が$1$以上$9$以下の2整数の積と等しいかを，**$1$以上$9$以下の2整数の積をぜんぶ試しながら調べる**ことで原理的に解ける．制約を考慮しても，特に工夫することなく解ける．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n; cin >> n;
  for (int i = 1; i <= 9; i++) {
    for (int j = 1; j <= 9; j++) {
      if (i * j == n) {
        cout << "Yes" << endl;
        return 0;
      }
    }
  }
  cout << "No" << endl;
  return 0;
}
```

#### [ABC 150 B](https://atcoder.jp/contests/abc150/tasks/abc150_b)

入力文字列`S`の$i$文字目から$i+3$文字目までが`ABC`と一致するかを全ての$i$に対して調べる．入力文字列の大きさがそこまで大きくないので特に工夫せず解ける．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n; cin >> n;
  string s; cin >> s;
  int ans = 0;
  for (int i = 0; i <= n-3; i++) {
    if (s[i] == 'A' && s[i+1] == 'B' && s[i+2] == 'C') {
      ans++;
    }
  }
  cout << ans << endl;
  return 0;
}
```

#### [ABC 122 B](https://atcoder.jp/contests/abc122/tasks/abc122_b)

入力文字列を先頭から一文字づつ舐めていって，その文字が`A`/`C`/`G`/`T`なら文字列の長さに1を加えて，そうでないならそこで一旦リセット．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  string s; cin >> s;
  int len = 0;
  int ans = 0;
  for (int i = 0; i < s.size(); i++) {
    if (s[i] == 'A' || s[i] == 'C' || s[i] == 'G' || s[i] == 'T') {
      len += 1;
      ans = max(ans, len);
    } else {
      len = 0;
    }
  }
  cout << ans << endl;
  return 0;
}
```

#### [ABC 136 B](https://atcoder.jp/contests/abc136/tasks/abc136_b)

$N$以下の正整数に対して，桁数が奇数になるのかを調べてやるだけ．整数を文字列に変換する関数は大体の言語でもできる．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  string ns; cin >> ns;
  int n = stoi(ns);
  int ans = 0;
  for (int i = 1; i <= n; i++) {
    string s = to_string(i);
    if (s.size() % 2 == 1) ans++;
  }
  cout << ans << endl;
  return 0;
}
```

#### [ABC 106 B](https://atcoder.jp/contests/abc106/tasks/abc106_b)

$N$以下の各正奇数に対して，正の約数が8個であるかを調べてあげる．

```cpp
#include <bits/stdc++.h>
using namespace std;

bool check(int n) {
  int cnt = 0;
  for (int i = 1; i <= n; i++) {
    if (n%i == 0) cnt++;
  }
  if (cnt == 8) return true;
  else return false;
}

int main() {
  int n; cin >> n;
  int ans = 0;
  for (int i = 1; i <= n; i += 2) {
    if (check(i)) ans++;
  }
  cout << ans << endl;
  return 0;
}
```

#### [ABC 120 B](https://atcoder.jp/contests/abc120/tasks/abc120_b)

与えられた2整数$A$，$B$の約数をぜんぶ調べ上げれば良い．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int a, b, k; cin >> a >> b >> k;
  if (b < a) swap(a, b);
  int cnt = 0;
  for (int i = a; 1 <= i; i--) {
    if (a%i == 0 && b%i == 0) {
      cnt++;
      if (cnt == k) {
        cout << i << endl;
        return 0;
      }
    }
  }
  return 0;
}
```

#### [ABC 57 C](https://atcoder.jp/contests/abc057/tasks/abc057_c)

$A < B$としても一般性は失われないので，$1 \leq A \leq \sqrt N$まで調べればいい．

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
  ll N;
  cin >> N;
  ll digit = 1;
  for (ll i = 2; i <= sqrt(N); i++) {
    if (N%i == 0) {
      digit = i;
    }
  }
  cout << to_string(N/digit).length() << endl;
  return 0;
}
```

#### [ABC 95 C](https://atcoder.jp/contests/abc095/tasks/arc096_a)

ABピザを奇数枚買って一枚余らせることしてもただの無駄でしかないので，ABピザは2枚1組のABセットとして考える．ここで問題の制約から，AピザでもBピザでもABセットでも，買う個数を$0$から$10^5$までぜんぶ試せば，買い方の場合の数は全て網羅するので原理的に解けることになる．

というか，ぜんぶABセットで買って余らせるか，Aピザ or Bピザが足りる分までABセットで買って不足分を単品で買い足すか，ABセットを使わずに単品で買い揃えるか，のいずれのパターンで最も安上がりのものを調べれば良いので，探索はいらない．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    int a, b, c, x, y;
    cin >> a >> b >> c >> x >> y;
    int res = a * x + b * y;
    res = min(res, (c * 2) * max(x, y));
    res = min(res, min(x, y) * 2 * c + a * (x - min(x, y)) + b * (y - min(x, y)));
    cout << res << endl;
    return 0;
}
```

#### [住銀2019 D](https://atcoder.jp/contests/sumitrust2019/tasks/sumitb2019_d)

まじめに，入力されたラッキーナンバーから3桁取ってきて...とやると，ラッキーナンバーの桁数が最大30000もあるので制限時間内に終わらない．ここで，**3桁の暗証番号は`000`から`999`のどれかにしかならない**ので，暗証番号を決め打ちしてから，その暗証番号を与えられたラッキーナンバーから作れるかを調べたほうが良い．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int N, cnt = 0;
  string S;
  cin >> N >> S;
  for (int i = 0; i < 1000; i++) {
    vector<int> c = {i/100, (i/10)%10, i%10};
    int f = 0;
    for (int j = 0; j < N; j++) {
      if (S.at(j) == ('0' + c.at(f))) {
        f++;
      }
      if (f == 3) {
        break;
      }
    }
    if (f == 3) {
      cnt++;
    }
  }
  cout << cnt << endl;
  return 0;
}
```

#### [パ研杯2019 C](https://atcoder.jp/contests/pakencamp-2019-day3/tasks/pakencamp_2019_day3_c)

コンテストで実際に歌う歌の組み合わせはぜんぶで${}_M\mathrm{C}_2$通りあり，$2 \leq M \leq 100$という制約を考慮して，全通り試せば原理的に解ける．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n, m; cin >> n >> m;
  vector<vector<long long>> a(n+1, vector<long long>(m+1, -1));
  for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= m; j++) {
      cin >> a[i][j];
      }
  }
  vector<vector<bool>> done(m+1, vector<bool>(m+1, false));
  long long ans = -1;
  for (int i = 1; i <= m-1; i++) {
  for (int j = i+1; j <= m; j++) {
    if (done[j][i]) continue;
      done[i][j] = done[j][i] = true;
      long long s = 0;
      for (int k = 1; k <= n; k++) {
        s += max(a[k][i], a[k][j]);
      }
      ans = max(ans, s);
    }
  }
  cout << ans << endl;
  return 0;
}
```

#### [JOI2017 本選3](https://atcoder.jp/contests/joi2007ho/tasks/joi2007ho_c)

入力された$n$個の点から$2$点選び，その$2$点を結ぶ線分を1辺とする正方形を構成する他の2点を計算し，その頂点が存在するかを調べれば正方形を構成することができるかを判定することができ，$n$の大きさに対する制約を考えると，全部試しても間に合う．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n; cin >> n;
  set<pair<int, int>> points;
  for (int i = 0; i < n; i++) {
    int x, y; cin >> x >> y;
    points.insert(pair<int, int>(x, y));
  }
  long long sum, ans = 0;
  for (auto c: points) {
    for (auto v: points) {
      if (c == v) continue;
      int dx = v.first - c.first;
      int dy = v.second - c.second;
      int nx1 = v.first - dy;
      int ny1 = v.second + dx;
      int nx2 = c.first - dy;
      int ny2 = c.second + dx;

      if (points.count(pair<int, int>(nx1, ny1)) && points.count(pair<int, int>(nx2, ny2))) {
        sum = dy * dy + dx * dx;
        ans = max(ans ,sum);
      }
    }
  }
  cout << ans << endl;
  return 0;
}
```

#### [Square869120Contest #6 B](https://atcoder.jp/contests/s8pc-6/tasks/s8pc_6_b)

出入り口を，わざわざ買い物しない店に設けるのは無駄でしかないので，**出入り口の候補は$a_1, a_2, ..., a_N$，$b_1, b_2, ..., b_N$**．出入り口の候補は$O(n^2)$通りあり，買い物客それぞれに対して移動時間を$O(n)$で計算し，その合計を調べ上げれば原理的に解ける．

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
  int n;cin >> n;
  vector<ll> a(n), b(n);
  set<ll> ab;
  for (int i = 0; i < n; i++) {
    ll _a, _b;
    cin >> _a >> _b;
    ab.insert(_a); ab.insert(_b);
    a[i] = _a;
    b[i] = _b;
  }
  ll s, t;
  ll ans = 9223372036854775807;
  for (auto s : ab) {
    for (auto t : ab) {
      ll elapsed = 0;
      for (int k = 0; k < n; k++) {
        elapsed += abs(s - a[k]) + abs(a[k] - b[k]) + abs(t - b[k]);
      }
      ans = min(ans, elapsed);
    }
  }
  cout << ans << endl;
  return 0;
}
```

#### [JOI2008 予選4](https://atcoder.jp/contests/joi2008yo/tasks/joi2008yo_d)

$n$個の与えられた星の位置から1つずつ取り出して，それを星座を構成する$m$個の星の位置の1つと仮定して，星座を構成する星を移動し，移動した先の位置が星の位置として妥当かどうかを全ての場合について調べ上げれば原理的に解ける．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int m; cin >> m;
  set<pair<int, int>> sign;
  for (int i = 0; i < m; i++) {
    int x, y; cin >> x >> y;
    sign.insert(pair<int, int>(x, y));
  }
  int n; cin >> n;
  set<pair<int, int>> night_sky;
  for (int i = 0; i < n; i++) {
    int x, y; cin >> x >> y;
    night_sky.insert(pair<int, int>(x, y));
  }

  for (auto star: night_sky) {
    pair<int, int> ss = *begin(sign);
    int dx = star.first - ss.first;
    int dy = star.second - ss.second;
    bool flag = true;
    for (auto sstar: sign) {
      int nx = sstar.first + dx;
      int ny = sstar.second + dy;
      if (!(night_sky.count(pair<int, int>(nx, ny)))) flag = false;
    }
    if (flag) {
      cout << dx << " " << dy << endl;
      return 0;
    }
  }
  return 0;
}
```

### ビット全探索

#### [ABC 128 C](https://atcoder.jp/contests/abc128/tasks/abc128_c)

$N$個のスイッチの状態はぜんぶで$2^N$通りで，それを全部試して，$M$個ある電球が全部点灯するかを調べれば原理的には解ける．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int N, M; cin >> N >> M;
  vector<vector<int>> vec(M);
  for (int i = 0; i < M; i++) {
    int k; cin >> k;
    vec[i].resize(k);
    for (int j = 0; j < k; j++) {
      cin >> vec[i][j];
      vec[i][j] -= 1;
    }
  }
  vector<int> p(M);
  for (int i = 0; i < M; i++) {
    cin >> p[i];
  }

  int ans = 0;
  for (int bit = 0; bit < (1 << N); bit++) {
    bool ok = true;
    for (int j = 0; j < M; j++) {
      int c = 0; // 電球jにつながっていて，かつonになっているスイッチの個数
      for (auto id : vec[j]) {
        if ((bit >> id) & 1) {
          c++;
        }
      }
      c %= 2;
      if (c != p[j]) {
        ok = false;
      }
    }
    if (ok) ans++;
  }
  cout << ans << endl;
}
```

#### [ABC 147 C](https://atcoder.jp/contests/abc147/tasks/abc147_c)

「だれが正直者で，だれが不親切なのか」を先に決め打ちしてしまい，それに対して与えられた情報が矛盾しないかを考えてやることで解くことができる．数学パズルが好きな人には「それはずるい」って言われる気がするがまあいいや．「だれが正直者で，だれが不親切なのか」のパターンはぜんぶで$2^N$通りで，ビット全探索が使える．

```cpp
#include <bits/stdc++.h>
using namespace std;

using testimony = pair<int, int>; // first: 人, second: 正直者か不親切か

int N;
vector<vector<testimony>> testimonies;

bool check(int bit) {
  // N人それぞれについて
  for (int i = 0; i < N; i++) {

    // その人が「不親切な人」ならその人の証言は調べなくて良い
    if (!((bit >> i) & 1)) continue;

    // 各証言の整合性を取る
    for (auto test : testimonies[i]) {
      int x = test.first;
      int y = test.second;
      if (y == 0 && ((bit >> x) & 1)) return false;
      if (y == 1 && !((bit >> x) & 1)) return false;
    }
  }
  return true;
}

int main() {
  cin >> N;
  testimonies.resize(N);
  for (int i = 0; i < N; i++) {
    int A; cin >> A;
    testimonies[i].resize(A);
    for (int j = 0; j < A; j++) {
      cin >> testimonies[i][j].first >> testimonies[i][j].second;
      testimonies[i][j].first -= 1;
    }
  }

  int res = 0;

  // 全通りを調べ上げる
  for (int bit = 0; bit < (1 << N); bit++) {

    // 決め打ちした「正直者-不親切な人分布」与えられた証言と整合性があるか
    if (check(bit)) {
      int cnt = 0;


      // 正直者をカウント
      for (int i = 0; i < N; i++) {
        if ((bit >> i) & 1) {
          cnt++;
        }
      }
      res = max(res, cnt);
    }
  }
  cout << res << endl;
  return 0;
}
```

#### [ABC 2 D](https://atcoder.jp/contests/abc002/tasks/abc002_4)

$N$人いる国会議員について，最大派閥に所属するか否かの場合の数の総数は$2^N$通りであり，$1 \leq N \leq 12$という$N$の制約を考えると全パターンを調べ上げることで原理的に解ける．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n, m; cin >> n >> m;
  vector<vector<bool>> friends(n, vector<bool>(n, false));
  for (int i = 0; i < m; i++) {
    int x, y; cin >> x >> y;
    x--; y--;
    friends[x][y] = friends[y][x] = true;
  }
  int ans = 0;
  for (int bit = 0; bit < (1 << n); bit++) {
    bool flag = true;
    for (int i = 0; i < n; i++) {
      if ((bit >> i) & 1) {
        for (int j = 0; j < i; j++) {
          if ((bit >> j) & 1) {
            if (!friends[i][j]) flag = false;
          }
        }
      }
    }
    if (flag) ans = max(ans, __builtin_popcount(bit));
  }
  cout << ans << endl;
  return 0;
}
```

#### [JOI2008 予選5](https://atcoder.jp/contests/joi2008yo/tasks/joi2008yo_e)

行のひっくり返し方を固定したとき，ある列をひっくり返すか否かは他の列をひっくり返すか否かの判断に影響を与えない．よって，各列において出荷可能なせんべいの枚数を最大化するしたとき，全体として出荷できるせんべいの枚数を（その行のひっくり返し方において）最大化できるといえる．各列のひっくり返すか中の判断は，「列を上から舐めていき，表になっているせんべいの枚数のほうが裏になっているせんべいより多ければひっくり返す．そうでなければひっくり返さない」とすればその列で焼いているせんべいのうち，出荷可能なせんべいの枚数を最大にすることができる．

まとめると，行のひっくり返し方（総数$2^C$通り）のそれぞれに対して，各列の状態を見ていき，「表になっているせんべいの枚数のほうが裏になっているせんべいより多ければひっくり返す．そうでなければひっくり返さない」という操作を行って，全体として出荷できるせんべいの枚数を調べ，その最大値を計算する．

```cpp
#include <bits/stdc++.h>
using namespace std;

int table[10][10000];

int main() {
  int row, col; cin >> row >> col;
  for (int i = 0; i < row; i++) {
    for (int j = 0; j < col; j++) {
      cin >> table[i][j];
    }
  }

  int ans = 0;
  for (int bit = 0; bit < (1 << row); bit++) {
    int cnt = 0;
    for (int j = 0; j < col; j++) {
      int omote = 0, ura = 0, state;
      for (int r = 0; r < row; r++) {
        state = table[r][j];
        if ((bit >> r) & 1) {
          state = !state;
        }
        if (state) omote++;
        else ura++;
      }
      cnt += max(omote, ura);
    }
    ans = max(ans, cnt);
  }
  cout << ans << endl;
  return 0;
}
```

#### [Square869120Contest #4 B](https://atcoder.jp/contests/s8pc-4/tasks/s8pc_4_b)

$N$個ある建物について，どの建物が見えて，どの建物が見えないかはぜんぶで$2^N$通りであるが，$K$色見えてほしいので，**$N$桁のビット列から$K$桁だけ`1`が立っているようなビット列を計算できたら，ビット全探索と同様に考えることができる**．建物の見え方を固定したとき，建物を左から順番に見ていって，見えてほしい建物はその建物より左側にある最も背の高い建物より1だけ高く，見えなくてもいい建物はそのままにしておく．

```cpp
#include <bits/stdc++.h>
using namespace std;

int next_combination(int bit) {
  int x = bit & -bit;
  int y = bit + x;
  return (((bit & ~y) / x) >> 1) | y;
}

int main() {
  int n, k; cin >> n >> k;
  k--;
  vector<long long> a(n);
  for (int i = 0; i < n; i++) cin >> a[i];
  if (k == 0) {
    cout << 0 << endl;
    return 0;
  }
  n--;
  long long res = 1001001001001;
  int bit = (1 << k) - 1;
  for (; bit < (1 << n); bit = next_combination(bit)) {
    long long highest = a[0];
    long long tmp = 0;
    for (int i = 0; i < n; i++) {
      if ((bit >> i) & 1) {
        if (a[i+1] <= highest) {
          tmp += (highest - a[i+1] + 1);
          highest += 1;
        } else {
          highest = a[i+1];
        }
      } else {
        if (highest < a[i+1]) {
          highest = a[i+1];
        }
      }
    }
    res = min(res, tmp);
  }
  cout << res <<endl;
  return 0;
}
```

### 順列全探索

#### [ABC 145 C](https://atcoder.jp/contests/abc145/tasks/abc145_c)

順列全探索を使えっていう意図が丸裸って感じの問題．

```cpp
#include <bits/stdc++.h>
using namespace std;

int N;
double x[10], y[10];

double dist(int i, int j) {
  double dx = x[i] - x[j];
  double dy = y[i] - y[j];
  return pow(dx*dx + dy*dy, 0.5);
}

int main() {
  cin >> N;
  for (int i = 1; i <= N; i++) cin >> x[i] >> y[i];
  double sum = 0.0;
  vector<int> towns(N);
  for (int i = 0; i < N; i++) towns[i] = i+1;
  do {
    for (int i = 0; i < N-1; i++) {
      sum += dist(towns[i], towns[i+1]);
    }
  } while (next_permutation(towns.begin(), towns.end()));
  int fact = 1;
  for (int i = 2; i <= N; i++) fact *= i;
  cout << fixed << setprecision(12) << sum/fact << endl;
  return 0;
}
```

#### [ABC 150 C](https://atcoder.jp/contests/abc150/tasks/abc150_c)

`do {...} while (next_permutation());`の練習問題．ソートし直すのを忘れないように．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n; cin >> n;
  vector<int> p(n), q(n);
  for (int i = 0; i < n; i++) cin >> p[i];
  for (int i = 0; i < n; i++) cin >> q[i];

  vector<int> s(n);
  for (int i = 0; i < n; i++) s[i] = i+1;
  int i = 0;
  int pidx = 0;
  int qidx = 0;
  do {
    bool pflag = true;
    for (int i = 0; i < n; i++) {
      if (s[i] != p[i]) pflag = false;
    }
    if (pflag) {
      pidx = i;
      break;
    } else i++;
  } while (next_permutation(s.begin(), s.end()));
  sort(s.begin(), s.end());
  i = 0;
  do {
    bool qflag = true;
    for (int i = 0; i < n; i++) {
      if (s[i] != q[i]) qflag = false;
    }
    if (qflag) {
      qidx = i;
      break;
    } else i++;
  } while (next_permutation(s.begin(), s.end()));

  cout << abs(pidx - qidx) << endl;
  return 0;
}
```

#### [ABC 54 C](https://atcoder.jp/contests/abc054/tasks/abc054_c)

`1`を始点とするDFSで条件を満たすパスを数え上げる方法が一番素直だけれども，制約に注目すると，与えられるグラフの頂点数が最大でも8ということを考慮すると，**頂点の訪問順序を，生えている辺を無視して順列全探索をして，編の生え方に矛盾しないものをカウントする**としても解ける．まあ教育的な観点からはDFSの練習として思った方が良さそうだけれど．

- DFSによる解答

```cpp
#include <bits/stdc++.h>
using namespace std;

// 1を始点としてDFSでグラフ上を探索し条件を満たすパスを数え上げる

const int nmax = 8;
bool graph[nmax][nmax];

int dfs(int v, int N, bool has_visited[nmax]) {
  bool has_visited_all = true;
  for (int i = 0; i < N; i++) {
    if (has_visited[i] == false) {
      has_visited_all = false;
    }
  }
  if (has_visited_all) {
    return 1;
  }

  int ret = 0;
  for (int i = 0; i < N; i++) {
    if (graph[v][i] == false) continue;
    if (has_visited[i]) continue;
    has_visited[i] = true;
    ret += dfs(i, N, has_visited);
    has_visited[i] = false;
  }
  return ret;
}

int main() {
  int N, M; cin >> N >> M;
  for (int i = 0; i < M; i++) {
    int A, B; cin >> A >> B;
    graph[A-1][B-1] = graph[B-1][A-1] = true;
  }
  bool has_visited[nmax];
  for (int i = 0; i < N; i++) {
    has_visited[i] = false;
  }
  has_visited[0] = true;
  cout << dfs(0, N, has_visited) << endl;
  return 0;
}
```

- 順列全探索による解答

```cpp
#include <bits/stdc++.h>
using namespace std;

const int nmax = 8;
bool graph[nmax][nmax];

int main() {
  int N, M; cin >> N >> M;
  for (int i = 0; i < M; i++) {
    int A, B; cin >> A >> B;
    graph[A-1][B-1] = graph[B-1][A-1] = true;
  }
  vector<int> nodes(N);
  for (int i = 0; i < N; i++) nodes[i] = i;
  int cnt = 0;
  do {
    bool flag = true;
    if (nodes[0] != 0) continue;
    for (int i = 0; i < N-1; i++) {
      if (graph[nodes[i]][nodes[i+1]] == false) flag = false; continue;
    }
    if (flag) cnt++;
  } while (next_permutation(nodes.begin(), nodes.end()));
  cout << cnt << endl;
  return 0;
}
```

## おわりに

:smile: これでぼくも全探索マスター！