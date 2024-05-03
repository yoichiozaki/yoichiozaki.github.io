---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "String Compression"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-31T22:36:30+09:00
lastmod: 2021-03-31T22:36:30+09:00
featured: false
draft: false


---

## 問題

与えられた文字列について次の規則に従って文字列を圧縮せよ

- もしある文字`x`が連続して 1 つしか存在しないなら`x`
- もしある文字`x`が連続して`y`つ以上存在するなら`xy`

## 答え

```python
class Solution:
    def compress(self, chars: List[str]) -> int:
        pos_anchor = 0
        pos_write = 0
        for pos_read, char in enumerate(chars):
            if pos_read == len(chars) - 1 or char != chars[pos_read + 1]:
                chars[pos_write] = char
                pos_write += 1
                if pos_anchor < pos_read:
                    for digit in str(pos_read - pos_anchor + 1):
                        chars[pos_write] = digit
                        pos_write += 1
                pos_anchor = pos_read + 1
        return pos_write
```

英語だと run length compressopm と呼ばれている？

反対にデコードする問題も考えられる．

https://leetcode.com/problems/decompress-run-length-encoded-list/

```python
class Solution:
    def decompressRLElist(self, nums: List[int]) -> List[int]:
        ret = []
        for i in range(len(nums) // 2):
            freq = nums[2 * i]
            num = nums[2 * i + 1]
            for _ in range(freq):
                ret += [num]
        return ret
```

## ref

https://leetcode.com/problems/string-compression/
