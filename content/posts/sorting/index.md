---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "C++でソートする"
subtitle: ""
summary: ""
authors: []
tags: [ソート, C++, 競プロ, 競技プログラミング, メモ]
categories: []
date: 2020-05-10T20:19:03+09:00
lastmod: 2020-05-10T20:19:03+09:00
featured: false
draft: false


---

## 複数の要素をまとめてソート

`pair` を使うと簡単．

```c++
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n;
  vector<pair<int, int>>, a(n);
  for (int i = 0; i < n; i++) {
    int no; string name; cin >> no >> name;
    cin >> no >> name;

    // ソートの優先順位は第1要素・第2要素の順
    sort(a.begin(), a.end());

    for (int i = 0; i < n; i++) {
      cout << a[i].first << " " << a[i].second << endl;
    }
  }
  return 0;
}
```

## ソート順序の指定

`std::sort()` ではデフォルトでは昇順． `greater`関数を比較関数として与えると降順にできる．また，独自に比較関数を自作して与えても良い．

```c++
#include <bits/stdc++.h>
using namespace std;

void print_vector(vector<int> &v) {
  cout << "[";
  for (int i = 0; i < v.size(); i++) cout << " " << v[i] << " ";
  cout << "]" << endl;
}

bool less_mod3(int lhs, int rhs) {
  if ((lhs - rhs) % 3 != 0) return lhs % 3 < rhs % 3;
  else return lhs < rhs;
}

int main() {
  vector<int> a = {1, 4, -1, 3, 9, 5, 7};
  sort(a.begin(), a.end());
  print_vector(a);

  sort(a.begin(), a.end(), greater<int>());
  print_vector(a);

  sort(a.begin(), a.end(), less_mod3);
  print_vector(a);
  return 0;
}
```

## 構造体のソート

`<` 演算子をオーバーロドするとよいかも．ただ `pair` とかの組み合わせで管理できるならそっちのほうが手間はかからない感．

```c++
#include <bits/stdc++.h>
using namespace std;

struct Student {
  int no, math, english;

  bool operator<(const Student &s) const {
    if (math != s.math) return math > s.math;
    if (english != s.english) return english > s.english;
    return no < s.no;
  }
}

int main() {
  int n; cin >> n;
  vector<Student> vec(n);
  for (int i = 0; i < n; i++) cin >> vec[i].no >> vec[i].math >> vec[i].english;
  sort(vec.begin(), vec.end());
  for (int i = 0; i < n; i++) cout << vec[i].no << endl;
  return 0;
}
```

## 演習

- [AIZU ONLINE JUDGE 0018 Sorting Five Numbers](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=0018&lang=jp)

```c++
#include <bits/stdc++.h>
using namespace std;

int main()
{
    vector<int> p(5);
    for (int i = 0; i < 5; i++)
        cin >> p[i];
    sort(p.begin(), p.end(), greater<int>());
    for (int i = 0; i < 5; i++)
    {
        if (i == 4)
        {
            cout << p[i] << endl;
        }
        else
        {
            cout << p[i] << " ";
        }
    }
    return 0;
}
```

- [AIZU ONLINE JUDGE 2198 Problem B: Moonlight Farm](http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=2198&lang=jp)

```c++
#include <bits/stdc++.h>
using namespace std;

struct Seed
{
    string l;
    int p, a, b, c, d, e, f, s, m;
    double efficiency;
    void calc()
    {
        double duration = a + b + c + (d + e) * m;
        double gain = f * s * m - p;
        efficiency = gain / duration;
    }

    bool operator<(const Seed &s) const
    {
        return efficiency == s.efficiency ? (l < s.l) : efficiency > s.efficiency;
    }
};

int main()
{
    int n;
    while (cin >> n)
    {
        if (n == 0)
            break;
        vector<Seed> seeds(n);
        Seed s;
        for (int i = 0; i < n; i++)
        {
            cin >> s.l >> s.p >> s.a >> s.b >> s.c >> s.d >> s.e >> s.f >> s.s >> s.m;
            s.calc();
            seeds.push_back(s);
        }
        sort(seeds.begin(), seeds.end());
        for (int i = 0; i < n; i++)
            cout << seeds[i].l << endl;
        cout << "#" << endl;
    }
    return 0;
}
```
