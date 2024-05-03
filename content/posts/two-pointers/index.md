---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Two Pointers"
subtitle: ""
summary: ""
authors: []
tags: [Two Pointers, 競プロ, 競技プログラミング]
categories: []
date: 2020-05-10T22:09:24+09:00
lastmod: 2020-05-10T22:09:24+09:00
featured: false
draft: false


---

## 2 つのポインタを使う

_ソート済み_ の整数配列から，和が $X$ となるような 2 要素を選ぶ問題を解く．

ナイーブなやり方は全探索で $O(n^2)$ かかる．

```c++
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n; cin >> n;
  int x; cin >> x;
  vector<int> a(n);
  for (int i = 0; i < n; i++) cin >> a[i];
  sort(a.begin(), a.end());

  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) {
      if (a[i] + a[j] == x) {
        cout << a[i] << " + " << a[j] << endl;
      }
      if (x < a[i] + a[j]) break;
    }
  }
  cout << "non" << endl;
  return 0;
}
```

2 つのポインタで左右から探しに行くと $O(n)$

```c++
#include <bits/stdc++.h>
using namespace std;

int main() {
  int n; cin >> n;
  int x; cin >> x;
  vector<int> a(n);
  for (int i = 0; i < n; i++) cin >> a[i];
  sort(a.begin(), a.end());

  int i = 0, j = n-1;
  while (i < j) {
    if (a[i] + a[j] == x) {
      cout << a[i] << " + " << a[j] << endl;
    } else if (a[i] + a[j] < x) i++;
    else j--s;
  }
  return 0;
}
```
