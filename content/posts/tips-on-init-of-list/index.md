---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Tips on initialization of List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-04-16T00:12:12+09:00
lastmod: 2021-04-16T00:12:12+09:00
featured: false
draft: false


---

## TL;DR

リストの初期化は内包表記で書くべし．`*`使って予期しないことが起きることを回避しよう．

## リストの初期化

リストを適切な値で初期化したい場面はよくある．

例えば，こんな感じ．

```python
# 要素数3のリストを0で初期化
arr = []
for _ in range(3):
    arr.append(0)

# 3x3のリストを0で初期化
mat = []
for _ in range(3):
    row = []
    for _ in range(3):
        row.append(0)
    mat.append(row)
```

これは下の書ける．この書き方はリスト内包表記と言われる．

```python
# 要素数3のリストを0で初期化
arr = [0 for _ in range(3)]

# 3x3のリストを0で初期化
mat = [[0 for _ in range(3)] for _ in range(3)]
```

また，こうも書ける．

```python
# 要素数3のリストを0で初期化
arr = [0] * 3

# 3x3のリストを0で初期化
mat = [[0] * 3] * 3
```

が，掛け算を使った書き方には罠がある．

```python
arr = [[0] * 3] * 3
print(arr) # => [0, 0, 0]
arr[0] = 1
print(arr) # => [1, 0, 0]: 期待通りの動作

class Hoge:
    def __init__(self):
        self.val = 0
arr2 = [Hoge()] * 3
print([id(hoge) for hoge in arr2]) # => [4349443472, 4349443472, 4349443472]
arr2[0].val = 99
print([hoge.val for hoge in arr2]) # => [99, 99, 99]

mat = [[0] * 3] * 3
print(mat) # => [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
mat[0][0] = 1
print(mat) # => [[1, 0, 0], [1, 0, 0], [1, 0, 0]]: ？？？

print([id(row) for row in mat]) # => [4349542144, 4349542144, 4349542144]: 全部同じ番地を指してる
```

`*`を使って初期化すると参照で初期化するっぽい．リスト内包表記ではその都度インスタンスを作っているっぽい．

要するに内包表記で書けば事故は起きないということ．
