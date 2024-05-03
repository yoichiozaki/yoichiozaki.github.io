---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "2次元配列を回転したい"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-19T00:13:34+09:00
lastmod: 2021-03-19T00:13:34+09:00
featured: false
draft: false


---

## 二次元配列を回転したい

頭が混乱してしまうのでまとめる．

## 反時計回りに 90 度回転

- 回転後の行列を左上から右下へ埋めていくイメージ
- つまり回転前の行列の右上から左下へ拾っていく
- 僕の頭的には，回転後の行列の座標の軌跡を正として回転前の位置を参照する方が書きやすいみたい．

```python
def rotate_counterclockwise(table):
    ROW = len(table[0]) # 回転後の行数は回転前の列数
    COL = len(table)    # 回転後の列数は回転前の行数

    rotated = [[0 for _ in range(COL)] for _ in range(ROW)]

    for r in range(ROW):
        for c in range(COL):
            rotated[r][c] = table[c][ROW - r - 1]

    return rotated
```

## 時計回りに 90 度回転

- 回転後の行列を左上から右下へ埋めていくイメージ
- つまり回転前の行列の左下から右上へ拾っていく

```python
def rotate_clockwise(table):
    ROW = len(table[0]) # 回転後の行数は回転前の列数
    COL = len(table)    # 回転後の列数は回転前の行数

    rotated = [[0 for _ in range(COL)] for _ in range(ROW)]

    for r in range(ROW):
        for c in range(COL):
            rotated[r][c] = table[COL - c - 1][r]

    return rotated
```

## かっこいい書き方

- `zip`を使うと左 90 度回転はかっこよくかける
- `zip`で回転後の行列を行ごとに下から集めたものが取れるので，最後にそれを逆順にする
- ref: https://stackoverflow.com/questions/8421337/rotating-a-two-dimensional-array-in-python

```python
def rotate_counterclockwise(table):
    return [list(row) for row in zip(*table)][::-1]
```

- 豆知識：左 90 度回転 x 3 == 右 90 度回転
