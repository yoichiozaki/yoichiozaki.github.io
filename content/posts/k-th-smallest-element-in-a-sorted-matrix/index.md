---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "$K$th Smallest Element in a Sorted Matrix"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-08-24T12:36:57+09:00
lastmod: 2021-08-24T12:36:57+09:00
featured: false
draft: false


---

## 問題

$N \times N$の二次元配列`matrix`が与えられる．`matrix`の各行・各列は昇順に整列されている．`matrix`内の$k$番目に小さい値を取得せよ．

## min heapを使う

「$k$番目に小さい値」系だとheapが使えることが多い印象．ソートされている行列を舐めながら候補となる値を次々にheapに突っ込んで，先頭から$k$個取っていけばいい．heapに突っ込むのと先頭を取るのを同時にやるのでやや混乱するかも知れない．

```python
class Solution:
    def kthSmallest(self, matrix: List[List[int]], k: int) -> int:
        import heapq
        n = len(matrix)
        heap = []
        for col in range(n):
            heapq.heappush(heap, (matrix[0][col], 0, col))
        for _ in range(k - 1):
            (_, row, col) = heapq.heappop(heap)
            if row == n - 1:
                continue
            heapq.heappush(heap, (matrix[row+1][col], row+1, col))
        return heap[0][0]
```

## 二分探索

「昇順」から二分探索が使えそう．

```python
class Solution:
    def kthSmallest(self, matrix: List[List[int]], k: int) -> int:
        low = matrix[0][0]
        high = matrix[-1][-1] + 1
        while low < high:
            mid = (low + high) // 2
            cnt = 0
            j = len(matrix) - 1
            for i in range(len(matrix)):
                while 0 <= j and mid < matrix[i][j]:
                    j -= 1
                cnt += (j + 1)
            if cnt < k:
                low = mid + 1
            else:
                high = mid
        return low
```

「$k$番目に小さい値$x$を求めよ」を「初めて$x$以下の数字が$k$個以上あるような$x$を求めよ」と言い換えてめぐる式二分探索に落とし込む．

```python
class Solution:
    def kthSmallest(self, matrix: List[List[int]], k: int) -> int:
        ng = matrix[0][0] - 1
        ok = matrix[-1][-1] + 1

        # 無駄の多い is_ok()
        # def is_ok(mid):
        #     cnt = 0
        #     for i in range(len(matrix)):
        #         for j in range(len(matrix[0])):
        #             if matrix[i][j] <= mid:
        #                 cnt += 1
        #             else:
        #                 break
        #     return k <= cnt

        # 改良版
        def is_ok(mid):
            cnt = 0
            j = len(matrix) - 1
            for i in range(len(matrix)):
                while 0 <= j and mid < matrix[i][j]:
                    j -= 1
                cnt += (j + 1)
            return k <= cnt

        while 1 < abs(ok - ng):
            mid = (ok + ng) // 2
            if is_ok(mid):
                ok = mid
            else:
                ng = mid
        return ok

```

## ref

- https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/