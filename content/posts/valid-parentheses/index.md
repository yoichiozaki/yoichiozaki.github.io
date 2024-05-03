---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Valid Parentheses"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T11:51:05+09:00
lastmod: 2021-03-27T11:51:05+09:00
featured: false
draft: false


---

## 問題

$n$個の`()`を，全ての開きカッコと閉じカッコの対応が正しいように並べたときの全通りを求めよ．

## 答え

```python
def valid_parentheses(n):
    ret = []
    def rec(left, right, sofar):
        if left == 0 and right == 0:
            ret.append(sofar)
            return
        if 0 < left:
            rec(left - 1, right, sofar + "(")
        if left < right:
          rec(left, right - 1, sofar + ")")
    rec(n, n, "")
    return ret

print(valid_parentheses(3))
# => ['((()))', '(()())', '(())()', '()(())', '()()()']
```
