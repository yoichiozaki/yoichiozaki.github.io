---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Permutation and Combination in Python"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-24T22:17:39+09:00
lastmod: 2021-03-24T22:17:39+09:00
featured: false
draft: false


---

## 順列・組み合わせを Python で求めたい

Python は偉いので，`itertools`という便利ライブラリを使えばうんと効率の良い実装が得られる．今回は敢えて`itertools`を使わずに書いてみる．要するに実装の練習．

## 取り出す要素数を固定にした順列・組み合わせの実装を考える

$n$個のものから$r$個取り出すことをいきなり考えると混乱するので，とりあえず$n$個のものから$3$個取り出すことを考える．

### 重複を許す順列

重複を許す順列は$r$回ネストした`for`に等しい．

```python
def repeated_permutation(lst):
    ret = []
    for i in range(len(lst)):
        for j in range(len(lst)):
            for k in range(len(lst)):
                ret.append([lst[i], lst[j], lst[k]])
    return ret
```

### 順列

一度取り出したものは次に取り出せない．

```python
def permutation(lst):
    def exclude(lst, idx):
        return lst[:idx] + lst[idx+1:]

    ret = []
    for i in range(len(lst)):
        for j in range(len(lst)-1):
            for k in range(len(lst)-2):
                ex_i = exclude(lst, i)
                ex_ij = exclude(ex_i, j)
                ret.append([lst[i], ex_i[j], ex_ij[k]])
    return ret
```

### 重複を許す組み合わせ

`000` -> `001` -> `002` -> ~~`010`~~ -> `011` -> ...

```python
def repeated_combination(lst):
    ret = []
    for i in range(len(lst)):
        for j in range(i, len(lst)):
            for k in range(j, len(lst)):
                ret.append([lst[i], lst[j], lst[k]])
    return ret
```

### 組み合わせ

一度取り出したものは次に取り出せない．

```python
def combination(lst):
    def exclude(lst, idx):
        return lst[:idx] + lst[idx+1:]

    ret = []
    for i in range(len(lst)):
        for j in range(i, len(lst)-1):
            for k in range(j, len(lst)-2):
                ex_i = exclude(lst, i)
                ex_ij = exclude(ex_i, j)
                ret.append([lst[i], ex_i[j], ex_ij[k]])
    return ret
```

こうとも言える．

```python
def combination(lst):
    ret = []
    for i in range(len(lst)):
        for j in range(i+1, len(lst)):
            for k in range(j+1, len(lst)):
                ret.append([lst[i], lst[j], lst[k]])
    return ret
```

## 取り出す要素数を$r$個にした順列・組み合わせの実装を考える

$r$回のネストを再帰関数で書く．

### 重複を許す順列

```python
def repeated_permutation(lst, r):
    if r <= 0:
        return []
    ret = []
    def _recurse(lst, r, sofar):
        if r == 0:
            ret.append(sofar)
            return
        for i in range(len(lst)):
            _recurse(lst, r-1, sofar + [lst[i]])
    _recurse(lst, r, [])
    return ret
```

### 順列

```python
def permutation(lst, r):
    if r <= 0:
        return []
    ret = []
    def _recurse(lst, r, sofar):
        if r == 0:
            ret.append(sofar)
            return
        for i in range(len(lst)):
            _recurse(lst[i:] + lst[i+1:], r-1, sofar + [lst[i]])
    _recurse(lst, r, [])
    return ret
```

### 重複を許す組み合わせ

```python
def repeated_combination(lst, r):
    if r <= 0:
        return []
    ret = []
    def _recurse(lst, r, sofar, start_idx):
        if r == 0:
            ret.append(sofar)
            return
        for i in range(start_idx, len(lst)):
            _recurse(lst, r-1, sofar + [lst[i]], i)
    _recurse(lst, r, [], 0)
    return ret
```

### 組み合わせ

```python
def combination(lst, r):
    if r <= 0:
        return 0
    ret = []
    def _recurse(lst, r, sofar, start_idx):
        if r == 0:
            ret.append(sofar)
            return
        for i in range(start_idx, len(lst)):
            _recurse(lst[:i] + lst[i+1:], r-1, sofar + [lst[i]], i)
    _recurse(lst, r, [], 0)
    return ret
```

```python
def combination(lst, r):
    if r <= 0:
        return 0
    ret = []
    def _recurse(lst, r, sofar, start_idx):
        if r == 0:
            ret.append(sofar)
            return
        for i in range(start_idx, len(lst)):
            _recurse(lst, r-1, sofar + [lst[i]], i+1)
    _recurse(lst, r, [], 0)
    return ret
```
