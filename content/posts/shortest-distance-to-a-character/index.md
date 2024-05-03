---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Shortest Distance to a Character"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-03T18:30:24+09:00
lastmod: 2022-02-03T18:30:24+09:00
featured: false
draft: false


---

## 問題

文字列`s`と文字`c`が与えられる．次のような整数配列`answer`を返せ

- `len(answer) == len(s)`
- `answer[i]`は位置`i`から最も近い`c`までの距離（インデックスの差の絶対値）

```
s = "loveleetcode", c = "e"
-> [3, 2, 1, 0, 1, 0, 0, 1, 2, 2, 1, 0]
```

## 解法

各`i`について，左右を見て近い`c`を探せば良いのだが，これをそのまま書くのではなく，

- 各`i`の左側をまず見る
- 次に各`i`の右側を見る

と書くとよい．

```
   "l    o   v    e l e e t c o d e" (c = "e")
->) inf inf inf   0 1 0 0 1 2 3 4 0
     3   2   1    0 1 0 0 4 3 2 1 0 (<-
------------------------------------------------
-> [ 3   2   1    0 1 0 0 1 2 2 1 0] (min)
```

```python
class Solution:
    def shortestToChar(self, s: str, c: str) -> List[int]:
        N = len(s)
        ans = []

        prev = float("-inf")
        for i in range(0, N, 1):
            if s[i] == c:
                prev = i
            ans.append(i - prev)

        prev = float("+inf")
        for i in range(N-1, -1, -1):
            if s[i] == c:
                prev = i
            ans[i] = min(ans[i], prev - i)

        return ans
```

## 出典

- https://leetcode.com/problems/shortest-distance-to-a-character/