---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Strongly Connected Components in Directed Graph"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-12-03T12:25:43+09:00
lastmod: 2021-12-03T12:25:43+09:00
featured: false
draft: false


---

## 有向グラフにおける強連結成分分解

- 強連結：任意の2頂点対$(u, v)$について，$u$から$v$に至るパスと$v$から$u$に至るパスの双方が存在する

- 強連結成分：互いに強連結である頂点からなる頂点集合

- 強連結成分を計算するアルゴリズム
  - 2回のDFSを行う
    - 【1】DFSを行って，頂点の帰りがけ順を求める
    - 【2】帰りがけ順上位から，元のグラフの辺の向きを逆転させたグラフ上でDFS

### 例題

- https://atcoder.jp/contests/typical90/tasks/typical90_u


```
#include <bits/stdc++.h>

using namespace std;

int N, M;

bool has_visited[1 << 18];
vector<int> G[1 << 18];
vector<int> RG[1 << 18];
vector<int> post_order;
long long cnt = 0;

void DFS(int node)
{
    has_visited[node] = true;
    for (int neighbor : G[node])
    {
        if (!has_visited[neighbor])
            DFS(neighbor);
    }
    post_order.push_back(node);
}

void RDFS(int node)
{
    has_visited[node] = true;
    cnt += 1;
    for (int neighbor : RG[node])
    {
        if (!has_visited[neighbor])
            RDFS(neighbor);
    }
}

int main()
{
    cin >> N >> M;
    for (int i = 1; i <= M; i++)
    {
        int A, B;
        cin >> A >> B;
        G[A].push_back(B);
        RG[B].push_back(A);
    }

    for (int i = 1; i <= N; i++)
        has_visited[i] = false;

    for (int node = 1; node <= N; node++)
    {
        if (!has_visited[node])
            DFS(node);
    }

    reverse(post_order.begin(), post_order.end());
    long long ans = 0;

    for (int i = 1; i <= N; i++)
        has_visited[i] = false;

    for (int node : post_order)
    {
        if (has_visited[node])
            continue;
        cnt = 0;
        RDFS(node);
        ans += cnt * (cnt - 1LL) / 2LL;
    }

    cout << ans << endl;

    return 0;
}
```