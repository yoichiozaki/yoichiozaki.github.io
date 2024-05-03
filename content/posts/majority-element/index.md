---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Majority Element"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2022-03-19T17:27:47+09:00
lastmod: 2022-03-19T17:27:47+09:00
featured: false
draft: false


---

## 問題

整数配列`nums`が与えられる．`nums`内の過半数を占める要素を求めよ．

例：
```
nums = [2, 2, 1, 1, 1, 2, 2] -> 2
```

## 解法

単純な問題だがいろんな解法がある．

まずは総当りで解決することを考える．各要素ごとに何個あるかを計算してそれが過半数あるかを確認してやればいい．各要素ごとに$O(n)$で個数をカウントするので全体としては$O(n^2)$の時間計算量がかかる．空間計算量は$O(1)$．`nums`の長さ次第では時間がかかってしまう．

```python
# Time: O(n^2)
# Space: O(1)
class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        for num in nums:
            cnt = sum(1 for ele in nums if ele == num)
            if len(nums) // 2 < cnt:
                return num
```

各要素がいくつあるかを辞書で持っておけば時間計算量$O(n)$で解決できる．ただ，空間計算量も$O(n)$になる．

```python
# Time: O(n)
# Space: O(n)
class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        cnts = collections.Counter(nums)
        return max(cnts.keys(), key=cnts.get)
```

少し趣を変えて考えてみると，「`nums`を整列すると過半数の要素が`nums`の真ん中に現れる」．なんだか不思議な気もするが，よくよく考えるとそれもそうだなという気持ちにならなくもない．`nums`中のどの要素（最小の要素なのか真ん中ぐらいの要素なのか最大の要素なのか）が過半数の要素であるかをそれぞれのパターンで想像すると，真ん中には必ずその過半数の要素が来る．

```python
# ex: len(nums) == 9
#-----------[*]-----------
[1, 1, 1, 1, 1, 2, 3, 3, 3] # 最小の要素が過半数
[1, 1, 2, 2, 2, 2, 2, 3, 3] # 真ん中の要素が過半数
[1, 2, 2, 2, 3, 3, 3, 3, 3] # 最大の要素が過半数
```

「過半数」なのだからその要素は「半分より多い」．ということは，その要素を（右端から｜真ん中らへんに｜左端から）並べれば，全体の真ん中の位置にはその要素が来る．

これを実装すると整列がボトルネックとなって時間計算量は$O(n \log n)$，空間計算量はソートアルゴリズム次第で$O(n)$とかになる．

```python
# Time: O(n log n)
# Space: O(1) or O(n) (depending on sorting algorithm)
class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        nums.sort()
        return nums[len(nums) // 2]
```

最後に，時間計算量$O(n)$，空間計算量$O(1)$で解決する方法がある！イメージとしては，「過半数ある要素」と「それ以外の要素」で「打ち消し合う」ようなことを考えると浮かんでくる．過半数ある要素はある1種の数字で，それ以外の要素は複数種の数字から成る．「過半数」とは半分より多く存在するということなので，`(過半数ある要素, それ以外の要素)`のペアを作ると，過半数ある要素が1つ以上余る．逆に余ったやつが過半数あるやつなのでこれを書く．

```
nums = [1, 1, 2, 2, 2, 2, 2, 3, 3]
過半数の要素たち      = [2, 2, 2, 2, 2]
過半数ではない要素たち = [1, 1, 3, 3]
```

具体的には，`nums`を頭からなめていくとき，新たに遭遇する数字は「過半数ある要素」の候補であるので，真新しい数字が出てきたら，そいつが候補足りうるのかを判定していく．（説明になっているのか微妙だ）

```python
# Time: O(n)
# Space: O(1)
class Solution:
    def majorityElement(self, nums: List[int]) -> int:
        candidate = None
        count = 0
        for num in nums:
            if count == 0:
                candidate = num
            if num == candidate:
                count += 1
            else:
                count -= 1
        return candidate
```

`if num == candidate: ... else: ...`がポイントなような気がする．これを書きたいのでその直前の`if count == 0: candidate = num`がいるなぁ，みたいな気持ちで書く？

## 出典

- https://leetcode.com/problems/majority-element/