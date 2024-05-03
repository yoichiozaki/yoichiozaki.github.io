---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Permutation in String"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-09-05T20:12:51+09:00
lastmod: 2021-09-05T20:12:51+09:00
featured: false
draft: false


---

## 問題

2つの文字列`s1`，`s2`が与えられる．`s1`の順列が`s2`の部分文字列として含まれるか判定せよ．

## 解法1

- Blute-force
- `s1`の順列を全部調べ上げる
- 時間計算量：$O(l_1 !)$
  - ただし$l_1$は`s1`の長さ

```python
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        flag = False

        def permutation(s, sofar):
            nonlocal flag
            if len(s) == 0:
                if sofar in s2:
                    flag = True
                return
            for i in range(len(s)):
                permutation(s[:i] + s[i+1:], sofar + s[i])

        permutation(s1, "")
        return flag
```

## 解法2

- 「`s1`の順列が`s2`の部分文字列として含まれるか判定せよ．」なので，実際に`s2`に含まれる順列がどの順列なのかは不要
- 要するに「`s1`と同じ文字種・同じ個数で構成される」`s2`の部分文字列があるかを調べれば良い
- `s1`をソートしたのと`s2`の部分列をソートしたのが一致すれば十分
- 時間計算量：$O(l_1 \log l_1 + (l_2 - l_1) l_1 \log l_1)$
  - $l_1 \log l_1$：`s1`のソート
  - $(l_2 - l_1) l_1 \log l_1$：長さ`len(s1)`の部分列が`len(s2) - len(s1)`個存在してそれぞれソートされる

```python
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        s1 = "".join(sorted(s1))
        for i in range(len(s2) - len(s1) + 1):
            if s1 == "".join(sorted(s2[i:i+len(s1)])):
                return True
        return False
```

## 解法3

- 解法2と同じ発想で別のやり方
- 「`s1`と同じ文字種が同じ個数存在するか」を辞書の比較で実現
- 時間計算量：$O(l_1 + (l_2 - l_1) l_1 )$
  - $l_1$：`s1`に含まれる文字種がそれぞれ何個存在するかの辞書を作る
  - $(l_2 - l_1) l_1$：`len(s2) - len(s1)`個の部分文字列のそれぞれについて辞書を比較

```python
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        if len(s1) > len(s2):
            return False

        # 辞書作る
        cnt1 = Counter(s1)
        for i in range(len(s2) - len(s1) + 1):
            # 辞書作る
            cnt2 = Counter()
            for j in range(len(s1)):
                if s2[i + j] in cnt2:
                    cnt2[s2[i + j]] += 1
                else:
                    cnt2[s2[i + j]] = 1

            # 辞書同士の比較
            if cnt1 == cnt2:
                return True
        return False
```

## 解法4

- 解法3を辞書じゃなくて`key`を位置で代用した配列でやる

```python
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        if len(s1) > len(s2):
            return False

        cnt1 = [0 for _ in range(26)]
        for ch in s1:
            cnt1[ord(ch) - ord('a')] += 1

        for i in range(len(s2) - len(s1) + 1):
            cnt2 = [0 for _ in range(26)]
            for ch in s2[i:i+len(s1)]:
                cnt2[ord(ch) - ord('a')] += 1

            flag = True
            for i in range(26):
                if cnt1[i] != cnt2[i]:
                    flag = False
                    break
            if flag:
                return True
        return False
```

## 解法5

- 解法4を改良する
- `len(s2) - len(s1)`個ある部分文字列のそれぞれに対して，ゼロから辞書を毎回作るのは無駄では？
  - 一文字部分文字列がズレるときの辞書は，部分文字列から消える文字が何で，部分文字列に新しく加わる文字が何かを追えば差分を更新するだけで作れる
- 時間計算量：$O(l_1 + (l_2 - l_1) * 26)$

```python
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        if len(s1) > len(s2):
            return False

        cnt1 = [0 for _ in range(26)]
        cnt2 = [0 for _ in range(26)]
        for i in range(len(s1)):
            ch = s1[i]
            cnt1[ord(ch) - ord('a')] += 1
            ch = s2[i]
            cnt2[ord(ch) - ord('a')] += 1

        def match(cnt1, cnt2):
            for i in range(26):
                if cnt1[i] != cnt2[i]:
                    return False
            return True

        for i in range(len(s2) - len(s1)):
            if match(cnt1, cnt2):
                return True

            left = s2[i]
            right = s2[i + len(s1)]
            cnt2[ord(left) - ord('a')] -= 1
            cnt2[ord(right) - ord('a')] += 1

        return match(cnt1, cnt2)
```

## 解法5

- 解法4を改良する
- `match(cnt1, cnt2)`をいい感じにしたい
- 個数が一致する文字種の数が一致するかを部分文字列の差分から計算できれば，辞書のすべての要素について個数をチェックするループが消せそう
  - 定数倍計算量が削減できそう

```python
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        if len(s1) > len(s2):
            return False

        cnt1 = [0 for _ in range(26)]
        cnt2 = [0 for _ in range(26)]
        for i in range(len(s1)):
            ch = s1[i]
            cnt1[ord(ch) - ord('a')] += 1
            ch = s2[i]
            cnt2[ord(ch) - ord('a')] += 1

        matched = 0 # 個数が一致する文字種の数
        for i in range(26):
            if cnt1[i] == cnt2[i]:
                matched += 1

        for i in range(len(s2) - len(s1)):
            left = ord(s2[i]) - ord('a')
            right = ord(s2[i + len(s1)]) - ord('a')

            if matched == 26:
                return True

            cnt2[left] -= 1 # 次のiで左端の文字は部分文字列から消える
            if cnt2[left] == cnt1[left]:
                matched += 1 # 左端の文字が部分文字列から消えた結果，個数が一致した文字種が増えた
            elif cnt2[left] + 1 == cnt1[left]:
                matched -= 1 # 左端の文字が部分文字列から消えた結果，個数が一致した文字種が減った

            cnt2[right] += 1 # 次のiで右端の文字は部分文字列に追加される
            if cnt2[right] == cnt1[right]:
                matched += 1 # 右端の文字が部分文字列に追加された結果，個数が一致した文字種が増えた
            elif cnt2[right] - 1 == cnt1[right]:
                matched -= 1 # 右端の文字が部分文字列に追加された結果，個数が一致した文字種が減った

        return matched == 26
```

## ref

https://leetcode.com/problems/permutation-in-string/