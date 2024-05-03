---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "if (n & (n-1)) == 0"
subtitle: ""
summary: "`n`が2のべき乗であるか"
authors: []
tags: [ビット, bit manipulation, atcoder, 競技プログラミング, 競プロ]
categories: []
date: 2020-12-16T16:01:29+09:00
lastmod: 2020-12-16T16:01:29+09:00
featured: false
draft: false
---

## 忘れないようにメモ

- `0xF` = `0b1111`：`0x一文字`は 4bits
- `0xFF` = `0b1111 1111`：`0x二文字`は 8bits（1byte）

## `if (n & (n-1)) == 0`

```shell
if        n = xxxxx 1000
then  n - 1 = xxxxx 0111
------------------------
n & (n - 1) = ????? 0000
```

なので，`if (n & (n-1)) == 0`が true なら`?????`が`00000`であり，つまり`xxxxx`が`00000`であるから，

```
n = 00000 1000
```

ということになる．

`if (n & (n-1)) == 0`は「`n`が 2 のべき乗であるか」を確認している．
