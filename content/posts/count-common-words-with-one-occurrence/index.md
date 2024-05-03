---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Count Common Words With One Occurrence"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-03T18:06:32+09:00
lastmod: 2022-02-03T18:06:32+09:00
featured: false
draft: false
---

## 問題

文字列を格納する配列`words1`，`words2`が与えられる．どちらにも一度だけ登場する文字列の個数を求めよ．

```
words1 = ["leetcode"," is", "amazing", "as", "is"]
words2 = ["amazing", "leetcode", "is"]
-> 2 ("leetcode", "amazing")
```

## 解法

`words1`で一度しか登場しない文字列が確かに`words2`でも一度しか登場しないかを確認すればいい．

```python
class Solution:
    def countWords(self, words1: List[str], words2: List[str]) -> int:
        freq = Counter(words1)
        for word in words2:
            if freq[word] <= 1:
                freq[word] -= 1
        return sum(1 for v in freq.values() if v == 0)
```

## 出典

- https://leetcode.com/problems/count-common-words-with-one-occurrence/