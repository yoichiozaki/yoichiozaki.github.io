---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Max Subarray Problem by Kadane Algorithm"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-24T23:19:25+09:00
lastmod: 2021-03-24T23:19:25+09:00
featured: false
draft: false


---

## Maximum Subarray Problem：最大部分配列問題

整数配列`arr`を与えられる．`arr`の連続する部分配列の和のうち最大となるものの値を求めよ．

## 解法

いくつかやり方はある．

### $O(n^3)$な力技

部分配列の候補となる添字の組み合わせ全部に対して，その部分配列の和を実際に計算して最大値を出す．

```python
lst = [-5, -1, 6, 4, 9, -6, -7]
# ans = 19
# [2, 5] # index

def solve(lst):
    ans = - 10 ** 9
    idx = (-1, -1)
    for i in range(len(lst)):
        for j in range(i+1, len(lst)+1):
            s = 0
            for k in range(i, j):
                s += lst[k]
            if ans < s:
                idx = (i, j)
                ans = s
    return ans, idx

print(solve(lst))
```

### $O(n^2)$な力技

累積和を計算しておけば`lst[i:j]`の和を$O(1)$で計算できるので全体として$O(n^2)$にできる．

```python
lst = [-5, -1, 6, 4, 9, -6, -7]
# ans = 19
# [2, 5] # index

def solve(lst):
    accum = [0]
    for num in lst:
        accum.append(accum[-1] + num)
    print(accum)
    ans = - 10 ** 9
    idx = (-1, -1)
    for i in range(len(lst)):
        for j in range(i+1, len(lst)+1):
            s = accum[j] - accum[i]
            if ans < s:
                idx = (i, j)
                ans = s
    return ans, idx

print(solve(lst))
```

### $O(n)$な賢いやり方

数列$a$の部分和を

$$
sum(i, j) = a_i + a_{i+1} + ... + a_{j-1} + a_j
$$

とする．ここで最後の要素が$a_j$であるような部分配列の和の最大値を$s_j$とすると，$s_j$は

$$
s_j = max_{i < j} sum(i, j)
$$

最終的に求めたい値は

$$
max_{j} s_j
$$

ここで，$s_{j+1}$は，

$$
s_{j+1} = max(s_j + a_{j+1}, a_{j+1})
$$

$a_{j+1}$と比べる理由は，「$a_{j+1}$のみからなる列」も「最後の要素が$a_{j+1}$で終わる部分列」であり，その要素の和は$a_{j+1}$だから．

```python
lst = [-5, -1, 6, 4, 9, -6, -7]
# ans = 19
# [2, 5] # index

def solve(lst):
    # dp[i]: 最後の要素がlst[i]であるような部分列の和の最大値
    dp = [lst[0]]
    for i in range(len(lst)-1):
        dp.append(max(dp[i] + lst[i+1], lst[i+1]))
    return max(dp)

print(solve(lst))
```

`dp[i+1]`を求めるのに`dp[i]`しか使わないので配列も使わない実装も可能．

```python
lst = [-5, -1, 6, 4, 9, -6, -7]
# ans = 19
# [2, 5] # index

def solve(lst):
    ans = lst[0]
    for i in range(len(lst)-1):
        ans = max(ans, max(ans + lst[i+1], lst[i+1]))
    return ans

print(solve(lst))
```
