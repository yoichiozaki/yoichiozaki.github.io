---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Union Find Tree"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2020-04-10T18:20:31+09:00
lastmod: 2020-04-10T18:20:31+09:00
featured: false
draft: false


---

## Union-Find木

「アイテムのグループ分け」を木を用いて管理する．具体的には，「同じグループに所属するアイテム同士は，根を同じとする木に属する」として管理する．グループ分けの情報を木を使って管理することのウレシミは，「アイテム$i$とアイテム$2$が同じグループに属しているか」と「アイテム$1$に属しているグループとアイテム$2$に属しているグループを併合して1つのグループにする」という処理が高速に実現できること．

## 実装

```cpp
struct UnionFind {
  vector<int> parents;

  UnionFind(int size): parents(size) {
    for (int i = 0; i < size; i++) parents[i] = i;
  }

  int root(int x) {
    if (parents[x] == x) return x;
    return parents[x] = root(parents[x]);
  }

  void unite(int x, int y) {
    int rootx = root(x);
    int rooty = root(y);
    if (rootx == rooty) return;
    parents[rootx] = rooty;
  }

  bool same(int x, int y) {
    int rootx = root(x);
    int rooty = root(y);
    return rootx == rooty;
  }
}
```

## 練習問題

- [ABC 97 D](https://abc097.contest.atcoder.jp/tasks/arc097_b)
- [ATC 1 B](https://atc001.contest.atcoder.jp/tasks/unionfind_a)
- [ARC 32 D](https://arc032.contest.atcoder.jp/tasks/arc032_2)

## 解説

### [ABC 97 D](https://abc097.contest.atcoder.jp/tasks/arc097_b)

```cpp
#include <bits/stdc++.h>
using namespace std;

struct UnionFind {
  vector<int> parents;

  UnionFind(int size): parents(size) {
    for (int i = 0; i < size; i++) parents[i] = i;
  }

  int root(int x) {
    if (parents[x] == x) return x;
    return parents[x] = root(parents[x]);
  }

  void unite(int x, int y) {
    int rootx = root(x);
    int rooty = root(y);
    if (rootx == rooty) return;
    parents[rootx] = rooty;
  }

  bool same(int x, int y) {
    int rootx = root(x);
    int rooty = root(y);
    return rootx == rooty;
  }
}

int main() {
  int N, M; cin >> N >> M;
  vector<int> P(N);
  for (int i = 0; i < N; i++) cin >> P[i];

  UnionFind tree(N);

  for (int i = 0; i < M; i++) {
    int x, y; cin >> x >> y; x--; y--;
    tree.unite(x, y);
  }

  int cnt = 0;
  for (int i = 0; i < N; i++) {
    if (tree.same(i. P[i]-1)) cnt++;
  }
  cout << cnt << endl;
  return 0;
}
```

### [ATC 1 B](https://atc001.contest.atcoder.jp/tasks/unionfind_a)

```cpp
#include <bits/stdc++.h>
using namespace std;

struct UnionFind {
  vector<int> parents;

  UnionFind(int size): parents(size) {
    for (int i = 0; i < size; i++) parents[i] = i;
  }

  int root(int x) {
    if (parents[x] == x) return x;
    return parents[x] = root(parents[x]);
  }

  void unite(int x, int y) {
    int rootx = root(x);
    int rooty = root(y);
    if (rootx == rooty) return;
    parents[rootx] = rooty;
  }

  bool same(int x, int y) {
    int rootx = root(x);
    int rooty = root(y);
    return rootx == rooty;
  }
}

int main() {
  int N, Q; cin >> N >> Q;
  UnionFind tree(N);

  for (int i = 0; i < Q; i++) {
    int p, x, y; cin >> p >> x >> y;
    if (p == 0) {
      tree.unite(x, y);
    } els {
      if (tree.same(x, y)) cout << "Yes" << endl;
      else cout << "No" << endl;
    }
  }
  return 0;
}
```

### [ARC 32 D](https://arc032.contest.atcoder.jp/tasks/arc032_2)

```cpp
#include <bits/stdc++.h>
using namespace std;

struct UnionFind {
  vector<int> parents;

  UnionFind(int size): parents(size) {
    for (int i = 0; i < size; i++) parents[i] = i;
  }

  int root(int x) {
    if (parents[x] == x) return x;
    return parents[x] = root(parents[x]);
  }

  void unite(int x, int y) {
    int rootx = root(x);
    int rooty = root(y);
    if (rootx == rooty) return;
    parents[rootx] = rooty;
  }

  bool same(int x, int y) {
    int rootx = root(x);
    int rooty = root(y);
    return rootx == rooty;
  }
}

int main() {
  int N, M; cin >> N >> M;
  UnionFind tree(N);

  for (int i = 9; i < M; i++) {
    int x, y; cin >> x >> y; x--; y--;
    tree.unite(x, y);
  }
  int cnt = 0;
  for (int i = 0; i < N; i++) {
    if (!tree.same(0, i)) {
      tree.unite(0, i);
      cnt++;
    }
  }
  cout << cnt << endl;
  return 0;
}
```