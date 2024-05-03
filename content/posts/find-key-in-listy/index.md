---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find Key in Listy"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T15:06:19+09:00
lastmod: 2021-03-27T15:06:19+09:00
featured: false
draft: false


---

## 問題

`List`みたいなデータ構造`Listy`を考える．`Listy`は次のように定義される．

```python
class Listy:
    def __init__(self, lst):
        lst.sort()
        self.lst = lst

    def at(self, idx):
        if idx < len(lst):
            return self.lst[idx]
        else:
            return -1
```

基本的に`Listy`は要素を昇順に格納している`List`のようなものである．ここで`Listy`にはその長さを返すメソッドが用意されていない．つまり`Listy`の長さを直接知ることはできない．一方で，`Listy.at(idx)`メソッドが用意されており，`idx`の位置に存在する要素を$O(1)$で返すことができる．もし`idx`が`Listy`の範囲を超えると`-1`を返す．

ある`Listy`と`key`を与えられたとき，`key`が`Listy`内に存在するかを判定し，存在するならその位置（0-オリジン）を返す関数を書け．

## 答え

「要素が昇順に並んでいる」ので二分探索を使いたいところ．`Listy`の全長を知ることができないので`[2^i, 2^(i + 1))`で探索範囲を広げながら二分探索する．

```python
listy = Listy([0, 4, 2, 5, 7, 3, 9 ,13, 15])

def search(listy, key):

    # listyの[left:right)から要素がkey以上となる最小の位置を二分探索
    def binary_search(listy, key, left, right):
        ng = left - 1
        ok = right
        def is_ok(mid):
            return key <= listy.at(mid)
        while 1 < abs(ok - ng):
            mid = (ok + ng) // 2
            if is_ok(mid):
                ok = mid
            else:
                ng = mid
        # okの位置にある要素がkeyと等しければ発見成功
        found = listy.at(ok) == key
        return found, ok

    right = 1
    while listy.at(right) != -1 and listy.at(right) < key:
        right *= 2
    left = right // 2
    return binary_search(listy, key, left, right)

print(search(listy, -1)) # => (False, 0)
print(search(listy, 0))  # => (True, 0)
print(search(listy, 2))  # => (True, 1)
print(search(listy, 3))  # => (True, 2)
print(search(listy, 13)) # => (True, 7)
print(search(listy, 15)) # => (True, 8)
print(search(listy, 16)) # => (False, 16)
```
