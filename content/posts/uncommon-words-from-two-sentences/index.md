---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Uncommon Words From Two Sentences"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-03T18:15:49+09:00
lastmod: 2022-02-03T18:15:49+09:00
featured: false
draft: false


---

## 問題

2文`s1`，`s2`が与えられる．片方の文に一度だけ登場する単語のリストを返す関数を実装せよ．

```
s1 = "this apple is sweet"
s2 = "this apple is sour"
-> ["sweet","sour"]
```

## 解法

片方に一度だけ登場する単語は全体でも一度だけしか登場しない．

```python
class Solution:
    def uncommonFromSentences(self, s1: str, s2: str) -> List[str]:
        s = s1 + " " + s2
        freq = Counter(s.split())
        ans = []
        for k, v in freq.items():
            if v == 1:
                ans.append(k)
        return ans
```

## 出典

- https://leetcode.com/problems/uncommon-words-from-two-sentences/