---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Count and Say"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-31T22:11:52+09:00
lastmod: 2021-03-31T22:11:52+09:00
featured: false
draft: false
---

## 問題

```sh
1 - 1個の1 -> 11 - 2個の1 -> 21 - 1個の2と1個の1 -> 1211 -> ...
```

上のように続く数列の第$n$項を求めよ．

## 答え

```python
def count_and_say(n):
    if n == 1:
        return "1"
    def get_next_count_and_say(curr):
        ch = curr[0]
        cnt = 1
        ret = ""
        for i in range(1, len(curr)):
            if curr[i] != ch:
                ret += (str(cnt) + ch)
                ch = curr[i]
                cnt = 1
            else:
                cnt += 1
        ret += (str(cnt) + ch)
        return ret
    ret = "1"
    for i in range(2, n + 1):
        ret = get_next_count_and_say(ret)
    return ret
```

これは一種の符号化方式．
