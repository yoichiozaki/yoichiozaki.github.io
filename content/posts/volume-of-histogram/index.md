---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Volume of Histogram"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-28T18:07:16+09:00
lastmod: 2021-03-28T18:07:16+09:00
featured: false
draft: false
image: featured.png

---

## 問題

あるヒストグラムを考えよう．そのヒストグラムを容器に見立てて上から水を流し込む．このとき，ヒストグラム内に貯まる水の量はいくつか．

入力としてヒストグラムはリストの形で与えられる．

```sh
                        _
                       |x|             _
               _       |x|            |x|
              |x|      |x|       _    |x|
              |x|      |x|      |x|   |x|
              |x|      |x|      |x|   |x|    _
              |x|      |x|      |x|   |x|   |x|
        ------------------------------------------------
input = [0, 0, 4, 0, 0, 6, 0, 0, 3, 0, 5, 0, 1, 0, 0, 0]
```

## 時間計算量$O(n^2)$・空間計算量$O(1)$な答え

ある位置`i`で溜まる水の高さは，その位置から左右両側を見て，その位置より高い地点があるならそれらの低い方の高さになる．これを各位置について計算する．

```python
hist = [0, 0, 4, 0, 0, 6, 0, 0, 3, 0, 5, 0, 1, 0, 0, 0]

def volume_of_hist(hist):
    if len(hist) == 0:
        return 0

    volume = 0
    for i in range(len(hist)):
        max_by_left = max(hist[:i]) if 0 < i else 0
        max_by_right = max(hist[:i + 1]) if i < len(hist) - 1 else 0
        volume += max(0, min(max_by_left, max_by_right) - hist[i])
    return volume

print(volume_of_hist(hist)) # => 26
```

## 時間計算量$O(n)$・空間計算量$O(n)$な答え

ある位置`i`から見て左右の高さの最大値は，位置`i - 1`でのそれと位置`i`の高さのうちの高い方なので，左右から「その位置での直近の最大値」を計算し，各位置で小さい方を取れば水面の高さが取れる．`max_by_left`/`max_by_right`を真面目に求めるのではなくて直近との比較で時間効率良く求めるというのがこのやり方．

{{< figure src="algorithm.png" title="アルゴリズム概観" lightbox="true" >}}

```python
hist = [0, 0, 4, 0, 0, 6, 0, 0, 3, 0, 5, 0, 1, 0, 0, 0]

def volume_of_hist(hist):
    if len(hist) == 0:
        return 0

    max_by_left = [0] * len(hist)
    max_by_left[0] = hist[0]
    for i in range(1, len(hist)):
        max_by_left[i] = max(max_by_left[i - 1], hist[i])

    max_by_right = [0] * len(hist)
    max_by_right[-1] = hist[-1]
    for i in range(len(hist) - 2, -1, -1):
        max_by_right[i] = max(max_by_right[i + 1], hist[i])

    height = [0] * len(hist)
    for i in range(len(hist)):
        height[i] = min(max_by_left[i], max_by_right[i])

    volume = 0
    for i in range(len(hist)):
        volume += (height[i] - hist[i])
    return volume

print(volume_of_hist(hist)) # => 26
```

```sh
                _
               |x|             _
       _       |x|            |x|
      |x|      |x|       _    |x|
      |x|      |x|      |x|   |x|
      |x|      |x|      |x|   |x|    _
      |x|      |x|      |x|   |x|   |x|
------------------------------------------------
[0, 0, 4, 0, 0, 6, 0, 0, 3, 0, 5, 0, 1, 0, 0, 0] <- input
[0, 0, 4, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6] <- max_by_left
[6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 1, 1, 0, 0, 0] <- max_by_right
[0, 0, 4, 4, 4, 6, 5, 5, 5, 5, 5, 1, 1, 0, 0, 0] <- height = min(max_by_left[i], max_by_right[i])
[0, 0, 0, 4, 4, 0, 5, 5, 2, 5, 0, 1, 0, 0, 0, 0] <- volume = height - input
```

## 時間計算量$O(n)$・空間計算量$O(1)$な答え

左右から同時に高さを求めていくことで空間計算量を削減する．左右からポインタを交差するまで走らせ，走らせながら高さを確定させていく．

```python
hist = [0, 0, 4, 0, 0, 6, 0, 0, 3, 0, 5, 0, 1, 0, 0, 0]

def volume_of_hist(hist):
    if len(hist) == 0:
        return 0

    left = 0
    right = len(hist) - 1
    max_height = 0
    volume = 0
    while left < right:
        if hist[left] <= hist[right]:
            curr_height = hist[left]
            left += 1
        else:
            curr_height = hist[right]
            right -= 1
        volume += max(0, max_height - curr_height)
        max_height = max(max_height, curr_height)
    return volume

print(volume_of_hist(hist)) # => 26
```

## 類題

3 次元のヒストグラムが与えられたときの溜まる水の量を計算せよ．

```sh
[[1, 4, 3, 1, 3, 2],
 [3, 2, 1, 3, 2, 4],
 [2, 3, 3, 2, 3, 1]]
```

## 類題答え

外堀から埋めていく．

```python
hist_3d = [
    [1, 4, 3, 1, 3, 2],
    [3, 2, 1, 3, 2, 4],
    [2, 3, 3, 2, 3, 1]
]

import heapq

def volume_of_hist_3d(hist_3d):
    if len(hist_3d) == 0 or len(hist_3d[0]) == 0:
        return 0
    H = len(hist_3d)
    W = len(hist_3d[0])

    if H <= 2 or W <= 2:
        return 0 # 外堀が作れず全部流出してしまう

    has_visited = set()
    queue = []

    for h in range(H):
        queue.append((hist_3d[h][0], h, 0))
        queue.append((hist_3d[h][W - 1], h, W - 1))
        has_visited.add((h, 0))
        has_visited.add((h, W - 1))
    for w in range(W):
        queue.append((hist_3d[0][w], 0, w))
        queue.append((hist_3d[H - 1][w], H - 1, w))
        has_visited.add((0, w))
        has_visited.add((H - 1, w))

    heapq.heapify(queue)
    max_height = 0
    volume = 0

    while len(queue) != 0:
        curr_height, h, w = heapq.heappop(queue)
        volume += max(0, max_height - curr_height)
        max_height = max(max_height, curr_height)
        for (dh, dw) in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
            nh = h + dh
            nw = w + dw
            if 0 <= nh < H and 0 <= nw < W and (nh, nw) not in has_visited:
                heapq.heappush(queue, (hist_3d[nh][nw], nh, nw))
                has_visited.add((nh, nw))

    return volume

print(volume_of_hist_3d(hist_3d)) # => 4
```

## refs

- https://leetcode.com/problems/trapping-rain-water/
- https://leetcode.com/problems/trapping-rain-water-ii/
