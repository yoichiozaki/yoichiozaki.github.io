---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Zero Matrix"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T01:07:49+09:00
lastmod: 2021-03-19T01:07:49+09:00
featured: false
draft: false
---

## 問題

二次元配列`X`が与えられる．ここで`X[i][j] == 0`ならば`i`行目全体と`j`列目全体を`0`にしたい．

```sh
1 2 3    1 2 0
4 5 0 -> 0 0 0
7 8 9    7 8 0
```

何も考えずに左上から右下に向かって走査しながら`0`を見つけ次第その行と列を`0`にするってやっていくと，行列全体が`0`になってかなしい気持ちになる．

## 落ち着いて真面目にやる

走査と`0`埋めを別個にやれば全部`0`にはならない．

```python
def set_zeros(table):
    ROW = len(table)
    COL = len(table[0])
    row_with_zero = [False for _ in range(ROW)]
    col_with_zero = [False for _ in range(COL)]

    for r in range(ROW):
        for c in range(COL):
            if table[r][c] == 0:
                row_with_zero[r] = True
                col_with_zero[c] = True

    for r in range(ROW):
        if row_with_zero[r]:
            for c in range(COL):
                table[r][c] = 0

    for c in range(COL):
        if col_with_zero[c]:
            for r in range(ROW):
                table[r][c] = 0

    return table
```
