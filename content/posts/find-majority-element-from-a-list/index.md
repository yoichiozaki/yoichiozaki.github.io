---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Find Majority Element From a List"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-28T01:18:26+09:00
lastmod: 2021-03-28T01:18:26+09:00
featured: false
draft: false


---

## 問題

配列$A$が与えられる．$A$の過半数を占める要素があればそれを見つけなさい．なければ`-1`を返しなさい．

## 答え

ナイーブなやり方：各要素の頻度を計算して過半数に達しているかを確認する．時間について$O(n^2)$，空間について$O(1)$

```python
def find_majority_element(lst):
    def check(lst, candidate):
        count = 0
        for ele in lst:
            if ele == candidate:
                count += 1
        return len(lst) // 2 < count
    for ele in lst:
        if check(lst, ele):
            return ele
    return -1
```

配列を一度舐めるだけで，過半数に達しているかもしれない要素は見つけることができる．これを使うと時間について$O(n)$，空間について$O(1)$で済む．

```python
def find_majority_element(lst):
    def get_candidate(lst):
        count = 0
        candidate = 0
        for ele in lst:
            if count == 0:
                # 旧candidateと同数の異なる要素が存在したので候補から落ち，
                # 今見ている要素が新candidateとなる．
                candidate = ele
            if ele ==  candidate:
                count += 1
            else:
              count -= 1
        return candidate
    def validate(lst, candidate):
        count = 0
        for ele in lst:
            if ele == candidate:
                count += 1
        return len(lst) // 2 < count

    candidate = get_candidate(lst)
    return candidate if validate(lst, candidate) else -1

print(find_majority_element([1, 1, 2, 2, 1])) # => 1
print(find_majority_element([1, 1, 2, 2]))    # => -1
```
