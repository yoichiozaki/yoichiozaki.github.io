---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Search a 2D Matrix"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-08-30T15:23:33+09:00
lastmod: 2021-08-30T15:23:33+09:00
featured: false
draft: false


---

## Search a 2D Array
昇順に整列された配列`nums`から与えられた`target`を効率よく探すには二分探索が有効．`nums`の長さを$N$として，$O(log N)$で見つけられる．

```python
def binary_search(nums, target):
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return True
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return False
```

`bisect`というライブラリもある．

```python
import bisect

nums = [1, 2, 5, 5, 5, 6, 9, 11]

# target以上になる最小のインデックスを返す
bisect.bisect_left(nums, 5) # => 2

# targetより大きくなる最小のインデックスを返す
bisect.bisect(nums, 5) # => 5
```

めぐる式二分探索というバグらせない実装もある．

```python
# target以上になる最小のインデックスを返す
def binary_search(nums, target):
    ng = -1
    ok = len(nums)
    def is_ok(mid):
        return target <= nums[mid]

    while 1 < abs(ng - ok):
        mid = (ng + ok) // 2
        if is_ok(mid):
            ok = mid
        else:
            ng = mid
    return ok
```

## Search a 2D Matrix 1

ref: https://leetcode.com/problems/search-a-2d-matrix/

一列の整数配列と見なして二分探索できる．


```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        h = len(matrix)
        w = len(matrix[0])

        low = 0
        high = h * w - 1

        while low <= high:
            mid = (low + high) // 2
            num = matrix[mid // w][mid % w] # ここが大事
            if num == target:
                return True
            elif num < target:
                low = mid + 1
            else:
                high = mid - 1
        return False
```

## Search a 2D Matrix 2

ref: https://leetcode.com/problems/search-a-2d-matrix-ii/

### 解法1：各列（or 各列）に対して二分探索

各列（or 各列）に対して二分探索していく．どちらの方向に二分探索するかは与えられた二次元配列の縦横の大きさを比べて決めればいい．時間計算量は$O(\min(h \log w, w \log h))$

```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        H = len(matrix)
        W = len(matrix[0])

        for h in range(H):
            low = 0
            high = W - 1
            while low <= high:
                mid = (low + high) // 2
                if matrix[h][mid] == target:
                    return True
                elif matrix[h][mid] < target:
                    low = mid + 1
                else:
                    high = mid - 1
        return False
```

### 解法2：右上から左下に向かって探索範囲を絞る

`matrix[i][j]`の要素が`target`より小さいなら，`target`は`i+1`行目以下にあるはず．
`matrix[i][j]`の要素が`target`より大きいなら，`target`は`j-1`列目以左にあるはず．
時間計算量は，最悪の場合右上から左下まで下or左で到達するまでループが回るので$O(h + w)$

```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        H = len(matrix)
        W = len(matrix[0])

        # 右上
        h = 0
        w = W - 1

        while h < H and 0 <= w:
            if matrix[h][w] == target:
                return True
            elif matrix[h][w] < target:
                h += 1
            else:
                w -= 1

        return False
```

### 解法3：二分探索っぽく探索領域を狭めていく

`matrix[i][j]`の要素が`target`より小さいなら，領域`(0, 0), (i, j)`（`(i, j)`を右下端とする左上方向の長方形領域）は全部`target`より小さいので探索範囲から除外できる．
`matrix[i][j]`の要素が`target`より大きいなら，領域`(i, j), (h, w)`（`(i, j)`を左上端とする右下方向の長方形領域）は全部`target`より大きいので探索範囲から除外できる．

時間計算量の考察はやや複雑．漸化式で計算量を表現できてそれを解くことで得られる．結果だけ書くと$O(h \log (w/h))$（ただし$h \lt w$）

```python
class Solution:
    def searchMatrix(self, matrix: List[List[int]], target: int) -> bool:
        H = len(matrix)
        W = len(matrix[0])

        def search_submatrix(top_row, left_col, bottom_row, right_col):
            if top_row > bottom_row or left_col > right_col:
                return False

            mid_row = (top_row + bottom_row) // 2
            left = left_col
            right = right_col
            while left <= right:
                mid_col = (left + right) // 2
                if matrix[mid_row][mid_col] == target:
                    return True
                elif matrix[mid_row][mid_col] < target:
                    left = mid_col + 1
                else:
                    right = mid_col - 1

            upper_right = search_submatrix(
                top_row, left, mid_row - 1, right_col)
            lower_left = search_submatrix(
                mid_row + 1, left_col, bottom_row, right)

            return upper_right or lower_left

        return search_submatrix(0, 0, H - 1, W - 1)
```