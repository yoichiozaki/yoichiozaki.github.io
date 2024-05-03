---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "$N$ Queens Problem"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-04-12T19:29:49+09:00
lastmod: 2021-04-12T19:29:49+09:00
featured: false
draft: false


---

## 問題

$N \times N$の盤面に$N$個のクイーンを互いに 1 手では襲撃できないように配置せよ．

## 答え

DFS で全探索．

```python
N = int(input())

queens = [0 for _ in range(N)]
board = [[0 for _ in range(N)] for _ in range(N)]

def update_board(board, row, col, x):
    for _col in range(N):
        board[row][_col] += x
    for _row in range(N):
        board[_row][col] += x

    # (+1, +1)
    _row = row
    _col = col
    while _row + 1 < N and _col + 1 < N:
        _row += 1
        _col += 1
        board[_row][_col] += x

    # (+1, -1)
    _row = row
    _col = col
    while _row + 1 < N and 0 <= _col - 1:
        _row += 1
        _col -= 1
        board[_row][_col] += x

    # (-1, +1)
    _row = row
    _col = col
    while 0 <= _row -1 and _col + 1 < N:
        _row -= 1
        _col += 1
        board[_row][_col] += x

    # (-1, -1)
    _row = row
    _col = col
    while 0 <= _row - 1 and 0 <= _col - 1:
        _row -= 1
        _col -= 1
        board[_row][_col] += x


def set_queens(queens, board, row):
    if row == N:
        # print board with Qs
        for col in queens:
            print("." * col + "Q" + "." * (N - col - 1))
        print()
        return

    for col in range(N):
        if board[row][col] == 0:
            queens[row] = col
            update_board(board, row, col, +1)
            set_queens(queens, board, row + 1)
            update_board(board, row, col, -1)

set_queens(queens, board, 0)
```

```sh
$ python3 main.py
Q.......
....Q...
.......Q
.....Q..
..Q.....
......Q.
.Q......
...Q....

Q.......
.....Q..
.......Q
..Q.....
......Q.
...Q....
.Q......
....Q...

Q.......
......Q.
...Q....
.....Q..
.......Q
.Q......
....Q...
..Q.....

...（続く）...
```
