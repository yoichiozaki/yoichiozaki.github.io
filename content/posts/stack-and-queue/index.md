---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "スタックとキュー"
subtitle: ""
summary: ""
authors: []
tags: [Stack, スタック, Queue, キュー, FIFO, LIFO, AtCoder, Competitive Programming, C++, cpp, 競技プログラミング, 競プロ, ABC]
categories: []
date: 2020-04-10T21:18:07+09:00
lastmod: 2020-04-10T21:18:07+09:00
featured: false
draft: false


---

## スタックとキュー

スタックとキューはとても基本的なデータ構造．スタックとキューの本質は **データをどのように扱うか** という部分．スタックやキューは配列や連結リストを用いて用意に実装でき，配列や連結リストの上手な使い方の部分がスタックやキューの本質であるとも言える．まあ，組み込み系など資源が限られている環境では実装方法自体に注意を向ける必要があることもある．

### スタック

スタックは「データをLast-In-First-Outというマナーで扱う」データ構造である．スタックには，「データを積む」と「データを取り出す」という操作ができる．ここで大事なのは， **一番最後に追加したアイテムを一番最初に取り出す** というところである．

### キュー

キューは「データをFirst-In-First-Outというマナーで扱う」データ構造である．キューには「データを入れる」と「データを取り出す」という操作ができ，大事なのは **一番最初に追加したアテムを一番最初に取り出す** というところである．

## 実装

簡易的な実装をしてみる．スタックとキューはとても基本的で大事なデータ構造なので，大抵の場合もっと作り込まれた実装が標準ライブラリなどの形で提供されているので，自前実装よりそっちを使うほうが安心感がある．以下では配列を用いた実装を示すが，ほかにも連結リストを用いて実装することもできる．

### スタック

スタックを配列を用いて実装する．ここではスタックの一番上を指す変数`top`が必要になり，この`top`がスタックの真髄．

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAX = 1000000;

int st[MAX];
int top = 0;

void init() {
  top = 0;
}

bool is_empty() {
  return (top == 0);
}

bool is_full() {
  return (top == MAX);
}

void push(int v) {
  if (is_full()) {
    cout << "error: stack is full" << endl;
    return;
  }
  st[top] = v;
  top++;
}

int pop() {
  if (is_empty()) {
    cout << "error: sstack is empty" << endl;
    return -1;
  }
  top--;
  return st[top];
}

int main() {
  init();

  push(3);
  push(5);
  push(7);

  cout << pop() << endl;
  cout << pop() << endl;

  push(9);
  cout << pop() << endl;
  return 0;
}
```

### キュー

キューを配列を用いて実装する．ここではキューの頭とお尻の管理が必要になる．

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAX = 1000000;

int qu[MAX];
int tail = 0, head = 0;

void init() {
  head = tail = 0;
}

bool is_empty() {
  return (head == tail);
}

bool is_full() {
  return (head == (tail+1)%MAX);
}

void enqueue(int v) {
  if (is_full()) {
    cout << "error: queue is full" << endl;
    return;
  }
  qu[tail] = v;
  tail++;
  if (tail == MAX) {
    tail == 0;
  }
}

int dequeue() {
  if (is_empty()) {
    cout << "error: queue is empty" << endl;
    return -1;
  }
  int res = qu[head];
  head++;
  if (head == MAX) head = 0;
  return res;
}

int main() {
  init();

  enqueue(3);
  enqueue(5);
  enqueue(7);

  cout << dequeue() << endl;
  cout << dequeue() << endl;

  enqueue(9);
  cout << dequeue() << endl;
  return 0;
}
```

### 標準ライブラリを使う

- `std::stack`

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  stack<int> s;
  s.push(3);
  s.push(5);
  s.push(7);

  cout << s.top() << endl; s.pop();
  cout << s.top() << endl; s.pop();
  cout << s.top() << endl; s.pop();

  s.push(9);
  cout << s.top() << endl; s.pop();
  reteurn 0;
}
```

- `std::queue`

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  queue<int> q;
  q.push(3);
  q.push(5);
  q.push(7);

  cout << q.front() << endl; q.pop();
  cout << q.front() << endl; q.pop();
  cout << q.front() << endl; q.pop();

  q.push(9);
  cout << q.front() << endl; q.pop();
  return 0;
}
```

## スタックやキューで解決できる問題

### カッコ列の整合性をスタックを用いて確認する問題

`((()(()))())(())`のようなカッコ記号の列が与えられたときに，左括弧と右括弧の対応がきちんと取れているのかを確認する問題は，スタックを用いることできれいに解ける．

カッコ列の特徴は，カッコ列を左から読んでいったときに **一番最後に見つけた左括弧に対応するのは，一番最初に見つけた右括弧である** というところである．この性質がまさしく LIFOであり，スタックを用いるときれいに解ける理由である．

```cpp
#include <bits/stdc++.h>
using namespace std;

bool check(const string &s) {
  stack<int> st;
  vector<pair<int, int>> ps;

  for (int i = 0; i < (int)s.size(); i++) {
    if (s[i] == '(') st.push(i);
    else {
      if (st.empty()) {
        cout << "error" << endl;
        return false;
      }
      int t = st.top(); st.pop();
      ps.push_back(make_pair(t, i));
    }
  }

  if (!st.empty()) {
    cout << "too many (" << endl;
    return false;
  }

  sort(ps.begin(), ps.end());
  for (auto p: ps) {
    cout << "[" << p.first << ", " << p.second << "]" << endl;
  }
}

int main() {
  check("((()(()))())(())");
  return 0;
}
```

### 逆ポーランド記法で記述された数式の計算

逆ポーランド記法とは，数式の記法の1つで，

$$
(1 + 2) \times (3 - 4)
$$

という一般的なものに対して，

$$
1 \space 2 \space + 3 \space 4 \space - \space \times
$$

と， **演算子を，演算対象に対して後置する** ような記法である．

逆ポーランド記法の特徴は，逆ポーランド記法で書かれた数式を左から右へ読んでいく時に，最初に遭遇する演算子の適用先が，一番最後に遭遇する数字であるという点である．この特徴がスタックのデータの扱い方と符合する．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  string s;
  stack<int> st;
  while (cin >> s) {
    if (s == "|") break;
    int a, b;
    if (s == "+") {
      b = st.top(); st.pop();
      a = st.top(); st.pop();
      st.push(a + b);
    } else if (s == "-") {
      b = st.top(); st.pop();
      a = st.top(); st.pop();
      st.push(a - b);
    } else if (s == "*") {
      b = st.top(); st.pop();
      a = st.top(); st.pop();
      st.push(a * b);
    } else if (s == "/") {
      b = st.top(); st.pop();
      a = st.top(); st.pop();
      st.push(a / b);
    } else {
      st.push(stoi(s));
    }
  }
  cout << st.top() << endl;
  return 0;
}
```

### ヒストグラム中の面積最大の長方形

ヒストグラムが与えられたときに，そのヒストグラムの外枠に内包されるような長方形のうち，面積が最大のものを求める問題はスタックで解くことができる．

スタックを使わないで求めようとするならば，長方形の底辺を形成する範囲を全て探索すれば原理的には解くことができ，$O(n^2)$の計算量がかかる．

```cpp
int get_rectangle_area(int size, int buffer[]) {
  int maxv = 0;
  for (int i = 0; i < size; i++) {
    for (int j = i; j < size; j++) {
      int minh = INF;
      for (int k = i; k <= j; k++) {
        minh = min(minh, buffer[k]);
      }
      maxv = max(maxv, minh * (j-i+1));
    }
  }
  return maxv;
}
```

これをスタックを用いると，$O(n)$で解くことができる．

スタックにはヒストグラムを形成する各長方形の情報を記録する．この情報には，長方形の高さ`height`とその左端の位置`pos`が記録されている．まず，スタックを空にして，ヒストグラムを左から順番に右に向かって見ていきながら（`i`が`0`から`n-1`まで動きながら）

1. スタックが空ならば，スタックに今見ている長方形の情報`(height, pos)`を積む
2. スタックの最上位に積まれている長方形の情報の高さが，今見ている長方形より低いならば，スタックに今見ている長方形の`(height, pos)`を積む
3. スタックの最上位に積まれている長方形の情報の高さが，今見ている長方形より等しいならば，何もしない
4. スタックの最上位に積まれている長方形の情報の高さが，今見ている長方形より高いならば，
   1. スタックが空でなく，スタックの最上位に積まれている長方形の情報の高さが，今見ている長方形の高さ以上である限り，スタックから長方形の情報を取り出し，その面積を計算し，最大値を更新する．長方形の横の長さは現在の位置と記録されている左端の位置から計算できる．
   2. 1が終わったら，スタックに今見ている長方形の情報を追加する．ただし，このときの左端の位置は最後にスタックから取り出した長方形の`pos`の値とする．

```cpp
#include <bits/stdc++.h>
using namespace std;

const int MAX = 110000;

struct Rectangle {
  long long height;
  int pos;
}

long long get_rectangle_area(int size, long long buffer[]) {
  stack<Rectangle> S;
  long long maxv = 0;
  buffer[size] = 0;

  for (int i = 0; i <= size; i++) {
    Rectangle rec;
    rect.height = buffer[i];
    rect.pos = i;
    if (S.empty()) S.push(rect);
    else {
      if (S.top().height < rect.height) S.push(rect);
      else if (rect.height < S.top().height) {
        int target = i;
        while (!S.empty() && rect.height <= S.top().height) {
          Rectangle pre = S.top(); S.pop();
          long long area = pre.height * (i - pre.pos);
          maxv = max(maxv, area);
          target = pre.pos;
        }
        rect.pos = target;
        S.push(rect);
      }
    }
  }
  return maxv;
}

int main() {
  int size;
  long long buffer[MAX + 1];
  while (1) {
    cin >> size;
    if (size == 0) break;
    for (int i = 0; i < size; i++) {
      cin >> buffer[i];
    }
    cout << get_rectangle_area(size, buffer) << endl;
  }
  return 0;
}
```

上のようなアルゴリズムの亜種として，数列$A_1, A_2, ..., A_N$に対して，$A_i \leq A_j$（$j < i$）なる最大の$j$を見つけるアルゴリズムがある．たとえば，数列

$$
6, 2, 4, 1, 3, 5, 7
$$

に対しては

$$
0, 1, 1, 3, 3, 1, 0
$$

となる．原理的には，各要素に対してそれより前のすべての要素を探索すればよく，$O(N^2)$かかるが解ける．スタックを用いると$O(N)$で解ける．

```cpp
#include <bits/stsdc++.h>
using namespace std;

const int INF = 100000000;

int main() {
  int N; cin >> N;
  vector<int> A(N);
  for (int i = 0; i < N; i++) cin >> A[i];

  stack<pair<int, int>> st;
  st.push(make_pair(INF, 0));
  for (int i = 0; i < N; i++) {
    while (st.top().first < A[i]) st.pop();
    cout << st.top().second() << ", ">>
    st.push(make_pair(A[i], i+1));
  }
  cout << endl;
  return 0;
}
```

### ラウンドロビンスケジューリング

OSのプロセスのスケジューリングに用いられているアルゴリズム．それぞれのプロセスを一定時間だけ処理して，それで終わらなければキューの最後に突っ込む．

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
  int N, Q; cin >> N >> Q;
  queue<pair<string ,int>> que;
  for (int i = 0; i < N; i++) {
    string name;
    int time;
    cin >> name >> time;
    que.push(make_pair(name, time));
  }

  int current_time = 0;
  while (!que.empty()) {
    auto now = que.front(); que.pop();
    if (Q < now.second) {
      current_time += Q;
      now.second -= Q;
      que.push(now);
    } else {
      current_time += now.second;
      cout << now.first << " @ " << current_time << endl;
    }
  }
}
```

### 迷路

グリッドグラフとしてグラフが与えられ，その迷路が解けるのか，解けるなら最短手数はいくつで，そのルートを通れば最短手数で迷路を解けるのかを与える．幅優先探索や深さ優先探索で，スタートからゴールまで探索していくのが良い．以下では幅優先探索で解く．

```cpp
#include <bits/stdc++.h>
using namespace std;

const int dh[4] = {1, 0, -1, 0};
const int dw[4] = {0, 1, 0, -1};

int main() {
  int H, W; cin >> H >> W;
  vector<string> maze(H);
  for (int h = 0; h < H; h++) cin >> maze[h];

  int sh, sw, gh, gw;
  for (int i = 0; i < H; i++) {
    for (int j = 0; j < W; j++) {
      if (maze[i][j] == 'S') {
        sh = i;
        sw = j;
      }
      if (maze[i][j] == 'G') {
        gh = i;
        gw = j;
      }
    }
  }


  vector<vector<int>> dist(H, vector<int>(W, -1));
  dist[sh][sw] = 0;

  vector<vector<int>> prevh(H, vector<int>(W, -1));
  vector<vector<int>> prevw(H, vector<int>(W, -1));

  queue<pair<int, int>> q;
  q.push(make_pair(sh, sw));

  while (!q.empty()) {
    auto p = q.front(); q.pop();
    int h = p.first;
    int w = p.second;
    for (int dir = 0; dir < 4; dir++) {
      int nh = h + dh[dir];
      int nw = w + dw[dir];
      if (nh < 0 || H <= nh || nw < 0 || W <= nw) continue;
      if (maze[nh][nw] == '#') continue;
      if (dist[nh][nw] != -1) continue;
      q.push(make_pair(nh, nw));
      dist[nh][nw] = dist[h][w] + 1;
      prevh[nh][nw] = h;
      prevw[nh][nw] = w;
    }
  }

  int h = gh, w = gw;
  while (h != -1 && w != -1) {
    maze[h][w] = 'o';
    int ph = prevh[h];
    int pw = prevw[w];
    h = ph, w = pw;
  }
  for (int i = 0; i < H; i++) {
    for (int j = 0; j < W; j++) {
      cout << std::setw(3) << maze[i][j];
    }
    cout << endl;
  }
  return 0;
}
```