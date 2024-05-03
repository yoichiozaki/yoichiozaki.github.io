---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Count Vowel Substrings of a String"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-02-03T20:01:18+09:00
lastmod: 2022-02-03T20:01:18+09:00
featured: false
draft: false
---

## 問題

文字列`word`が与えられる．母音（`a`，`e`，`i`，`o`，`u`）飲みからなる連続した部分文字列の個数を数え上げよ．

```
word = "aeiouu" -> ans = 2 ("aeiou", "aeiouu")
```

## 解法

しゃくとり法．数え上げ対象の部分列は連続した部分列になるので，両端を管理しながら数える．

```python
class Solution:
    def countVowelSubstrings(self, word: str) -> int:
        freq = {'a': 0, 'e': 0, 'i': 0, 'o': 0, 'u': 0}

        left = 0
        head = 0
        vowel_kind = 0
        ans = 0
        N = len(word)

        for right in range(N):
            if word[right] in freq:
                v = word[right]
                if freq[v] == 0:
                    vowel_kind += 1
                freq[v] += 1
                while vowel_kind == 5:
                    h = word[head]
                    freq[h] -= 1
                    if freq[h] == 0:
                        vowel_kind -= 1
                    head += 1
                ans += (head - left)
            else:
                freq = {'a': 0, 'e': 0, 'i': 0, 'o': 0, 'u': 0}
                left = right + 1
                head = right + 1
                vowel_kind = 0

        return ans
```

`right`を右に勧めながら，

- 子音にぶつかったらリセット
- 母音にぶつかったら
  - 観測した母音を頻度表に追加
  - 5種の母音を観測済みなら数え上げ開始
    - 「観測済み母音種が5」を満たさなくなるまで`head`を右に動かす（動かせるだけ数え上げ対象の部分列が存在することに）
    - `head`を動かせなくなったところで部分列の数を数えて記録

## 出典

- https://leetcode.com/problems/count-vowel-substrings-of-a-string/