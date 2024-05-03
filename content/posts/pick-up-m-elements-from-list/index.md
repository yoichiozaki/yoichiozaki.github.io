---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Pick Up M Elements From List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-28T00:30:18+09:00
lastmod: 2021-03-28T00:30:18+09:00
featured: false
draft: false


---

## 問題

長さ$N$の配列からランダムに$M$個要素を取り出した配列を求めよ．

## 答え

標準ライブラリを使う．

```python
import random

def pick_m_random_elements(lst, m):
    random.shuffle(lst)
    return lst[:m]
```

Fisher-Yates アルゴリズムと似た感じでやることもできる．

```python
import random

def pick_m_random_elements(lst, m):
    ret = lst[:m]
    for i in range(m, len(lst), 1):
        j = random.randint(0, i)
        if j < m:
            ret[j] = lst[i]
    return ret
```
