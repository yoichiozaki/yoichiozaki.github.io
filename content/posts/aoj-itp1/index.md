---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "AOJ ITP1 in Python"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-29T15:34:00+09:00
lastmod: 2021-03-29T15:34:00+09:00
featured: false
draft: false
---

[AOJ-ITP1](https://judge.u-aizu.ac.jp/onlinejudge/finder.jsp?course=ITP1)を Python で解く．

## ITP1_1_A:

<details>
<summary>答え</summary>

```python
print("Hello World")
```

</details>

## ITP1_1_B:

<details>
<summary>答え</summary>

```python
x = int(input())
print(x ** 3)
```

</details>

## ITP1_1_C:

<details>
<summary>答え</summary>

```python
h, w = map(int, input().split())
print(h * w, 2 * (h + w))
```

</details>

## ITP1_1_D:

<details>
<summary>答え</summary>

```python
S = int(input())
print("{}:{}:{}".format(S // 3600, (S % 3600) // 60, S % 60))
```

</details>

## ITP1_2_A:

<details>
<summary>答え</summary>

```python
a, b = map(int, input().split())
if a < b:
    print("a < b")
elif a == b:
    print("a == b")
else:
    print("a > b")
```

</details>

## ITP1_2_B:

<details>
<summary>答え</summary>

```python
a, b, c = map(int, input().split())
if a < b < c:
    print("Yes")
else:
    print("No")
```

</details>

## ITP1_2_C:

<details>
<summary>答え</summary>

```python
lst = list(map(int, input().split()))
lst.sort()
print(*lst)
```

</details>

## ITP1_2_D:

<details>
<summary>答え</summary>

```python
W, H, x, y, r = map(int, input().split())
if r <= x <= W - r and r <= y <= H - r:
    print("Yes")
else:
    print("No")
```

</details>

## ITP1_3_A:

<details>
<summary>答え</summary>

```python
for _ in range(1000):
    print("Hello World")
```

</details>

## ITP1_3_B:

<details>
<summary>答え</summary>

```python
i = 1
while True:
    x = int(input())
    if x == 0:
        break
    print("Case {}: {}".format(i, x))
    i += 1
```

</details>

## ITP1_3_C:

<details>
<summary>答え</summary>

```python
while True:
    x, y = map(int, input().split())
    if x == 0 and y == 0:
        break
    if y < x:
        x, y = y, x
    print(x, y)
```

</details>

## ITP1_3_D:

<details>
<summary>答え</summary>

```python
a, b, c = map(int, input().split())
cnt = 0
for i in range(a, b + 1):
    if c % i == 0:
        cnt += 1
print(cnt)
```

</details>

## ITP1_4_A:

<details>
<summary>答え</summary>

```python
a, b = map(int, input().split())
print(a // b, a % b, "{:.6f}".format(a / b))
```

</details>

## ITP1_4_B:

<details>
<summary>答え</summary>

```python
from math import pi
r = int(input())
print("{:.6f} {:.6f}".format(2 * pi * r, pi * r ** 2))
```

</details>

## ITP1_4_C:

<details>
<summary>答え</summary>

```python
while True:
    s = input().split()
    lhs = int(s[0])
    op = s[1]
    rhs = int(s[2])
    if op == "?":
        break
    if op == "+":
        print(lhs + rhs)
    elif op == "-":
        print(lhs - rhs)
    elif op == "*":
        print(lhs * rhs)
    elif op == "/":
        print(lhs // rhs)
```

</details>

## ITP1_4_D:

<details>
<summary>答え</summary>

```python
_ = int(input())
lst = list(map(int, input().split()))
print(min(lst), max(lst), sum(lst))
```

</details>

## ITP1_5_A:

<details>
<summary>答え</summary>

```python
while True:
    h, w = map(int, input().split())
    if h == 0 and w == 0:
        break
    for _ in range(h):
        print("#" * w)
    print()
```

</details>

## ITP1_5_B:

<details>
<summary>答え</summary>

```python
while True:
    h, w = map(int, input().split())
    if h == 0 and w == 0:
        break
    print("#" * w)
    for _ in range(h - 2):
        print("#" + "." * (w - 2) + "#")
    print("#" * w)
    print()
```

</details>

## ITP1_5_C:

<details>
<summary>答え</summary>

```python
while True:
    H, W = map(int, input().split())
    if H == 0 and W == 0:
        break
    for h in range(H):
        for w in range(W):
            if (h + w) % 2 == 0:
                print("#", end="")
            else:
                print(".", end="")
        print()
    print()
```

</details>

## ITP1_5_D:

<details>
<summary>答え</summary>

```python
N = int(input())
for i in range(1, N + 1):
    if i % 3 == 0 or "3" in str(i):
        print(" {}".format(i), end="")
print()
```

</details>

## ITP1_6_A:

<details>
<summary>答え</summary>

```python
_ = int(input())
lst = list(map(int, input().split()))
lst.reverse()
print(*lst)
```

</details>

## ITP1_6_B:

<details>
<summary>答え</summary>

```python
N = int(input())
suits = ["S", "H", "C", "D"]
cards = []
for _ in range(N):
    s, n = input().split()
    if s == "S":
        cards.append(int(n))
    elif s == "H":
        cards.append(13 + int(n))
    elif s == "C":
        cards.append(26 + int(n))
    else:
        cards.append(39 + int(n))

for i in range(1, 53):
    if i not in cards:
        print(suits[(i - 1) // 13], (i - 1) % 13 + 1)
```

`ele in lst`は`n = len(lst)`として$O(n)$らしい．

</details>

## ITP1_6_C:

<details>
<summary>答え</summary>

```python
N = int(input())
room = [[[0] * 10 for _ in range(3)] for _ in range(4)]

for _ in range(N):
    b, f, r, v = map(int, input().split())
    room[b - 1][f - 1][r - 1] += v

for i in range(4):
    for j in range(3):
        for k in range(10):
            print(" {}".format(room[i][j][k]), end="")
        print()
    if i != 3:
        print("####################")
```

</details>

## ITP1_6_D:

<details>
<summary>答え</summary>

```python
N, M = map(int, input().split())
A = [list(map(int, input().split())) for _ in range(N)]
B = [int(input()) for _ in range(M)]

for i in range(N):
    ans = 0
    for j in range(M):
        ans += A[i][j] * B[j]
    print(ans)
```

</details>

## ITP1_7_A:

<details>
<summary>答え</summary>

```python
while True:
    m, f, r = map(int, input().split())
    if m == -1 and f == -1 and r == -1:
        break
    score = m + f
    if m == -1 or f == -1:
        print("F")
    elif 80 <= score:
        print("A")
    elif 65 <= score:
        print("B")
    elif 50 <= score:
        print("C")
    elif 30 <= score:
        if 50 <= r:
            print("C")
        else:
            print("D")
    else:
        print("F")
```

</details>

## ITP1_7_B:

<details>
<summary>答え</summary>

```python
while True:
    N, X = map(int, input().split())
    if N == 0 and X == 0:
        break
    cnt = 0
    for i in range(1, N - 1):
        for j in range(i + 1, N):
            if j < X - i - j <= N:
                cnt += 1
    print(cnt)
```

</details>

## ITP1_7_C:

<details>
<summary>答え</summary>

```python
H, W = map(int, input().split())
sheet = [list(map(int, input().split())) for _ in range(H)]
for h in range(H):
    sheet[h].append(sum(sheet[h]))
sheet.append([0 for _ in range(W + 1)])
for w in range(W + 1):
    for h in range(H):
        sheet[-1][w] += sheet[h][w]
for r in sheet:
    print(*r)
```

</details>

## ITP1_7_D:

<details>
<summary>答え</summary>

```python
N, M, L = map(int, input().split())
A = [list(map(int, input().split())) for _ in range(N)]
B = [list(map(int, input().split())) for _ in range(M)]

C = [[0 for _ in range(L)] for _ in range(N)]
for i in range(N):
    for j in range(L):
        c = 0
        for k in range(M):
            c += A[i][k] * B[k][j]
        C[i][j] = c
for r in C:
    print(*r)
```

</details>

## ITP1_8_A:

<details>
<summary>答え</summary>

```python
string = input()
print(string.swapcase())
```

</details>

## ITP1_8_B:

<details>
<summary>答え</summary>

```python
while True:
    x = int(input())
    if x == 0:
        break
    ans = 0
    while x:
        ans += x % 10
        x //= 10
    print(ans)
```

</details>

## ITP1_8_C:

<details>
<summary>答え</summary>

```python
import sys
string = sys.stdin.read().lower()
cnt = [0] * 26
alphabets = [chr(ord('a') + i) for i in range(26)]
for x in string:
    if x in alphabets:
        cnt[alphabets.index(x)] += 1
for i in range(26):
    print("{} : {}".format(alphabets[i], cnt[i]))
```

</details>

## ITP1_8_D:

<details>
<summary>答え</summary>

```python
s = input()
p = input()
s = s + s
if s.find(p) != -1:
    print("Yes")
else:
    print("No")
```

</details>

## ITP1_9_A:

<details>
<summary>答え</summary>

```python
import sys
word = input()
text = sys.stdin.read()
print(text.lower().split().count(word))
```

</details>

## ITP1_9_B:

<details>
<summary>答え</summary>

```python
while True:
    cards = input()
    if cards == "-":
        break
    m = int(input())
    for i in range(m):
        interval = int(input())
        head = cards[:interval]
        tail = cards[interval:]
        cards = tail + head
    print(cards)
```

</details>

## ITP1_9_C:

<details>
<summary>答え</summary>

```python
N = int(input())
taro = 0
hanako = 0
for i in range(N):
    card_taro, card_hanako = input().split()
    if card_taro == card_hanako:
        taro += 1
        hanako += 1
    elif card_taro < card_hanako:
        hanako += 3
    else:
        taro += 3
print(taro, hanako)
```

</details>

## ITP1_9_D:

<details>
<summary>答え</summary>

```python
text = input()
N = int(input())
for _ in range(N):
    command = input().split()
    if command[0] == "replace":
        a = int(command[1])
        b = int(command[2])
        s = command[3]
        text = text[:a] + s + text[b + 1:]
    elif command[0] == "reverse":
        a = int(command[1])
        b = int(command[2])
        text = text[:a] + "".join(reversed(text[a:b + 1])) + text[b + 1:]
    else:
        a = int(command[1])
        b = int(command[2])
        print(text[a:b + 1])
```

</details>

## ITP1_10_A:

<details>
<summary>答え</summary>

```python
x1, y1, x2, y2 = map(float, input().split())
print(((x1 - x2) **2 + (y1 - y2) ** 2) ** 0.5)
```

</details>

## ITP1_10_B:

<details>
<summary>答え</summary>

```python
import math
a, b, C=map(float, input().split())
theta = math.radians(C)
h = b * math.sin(theta)
S = (a * h) / 2
c = math.sqrt(a ** 2 + b ** 2 - 2 * a * b * math.cos(theta))
L = a + b + c
print(S, L, h, sep="\n")
```

</details>

## ITP1_10_C:

<details>
<summary>答え</summary>

```python
while True:
    N = int(input())
    if N == 0:
        break
    score = list(map(int, input().split()))
    mean = sum(score) / N
    variant = 0
    for i in range(N):
        variant += (score[i] - mean) ** 2
    print((variant / N) ** 0.5)
```

</details>

## ITP1_10_D:

<details>
<summary>答え</summary>

```python
def dist(xs, ys, p):
    ret = 0
    for (x, y) in zip(xs, ys):
        ret += abs(x - y) ** p
    return ret ** (1 / p)

N = int(input())
xs = list(map(int, input().split()))
ys = list(map(int, input().split()))
for p in range(1, 4):
    print(dist(xs, ys, p))
print(max(abs(x - y) for (x, y) in zip(xs, ys)))
```

</details>

## ITP1_11_A:

<details>
<summary>答え</summary>

```python
class Dice:
    def __init__(self, nums):
        self.s1 = nums[0]
        self.s2 = nums[1]
        self.s3 = nums[2]
        self.s4 = nums[3]
        self.s5 = nums[4]
        self.s6 = nums[5]
    def rotate(self, dir):
        if dir == "N":
            self.s1, self.s2, self.s5, self.s6 = self.s2, self.s6, self.s1, self.s5
        elif dir == "S":
            self.s1, self.s2, self.s5, self.s6 = self.s5, self.s1, self.s6, self.s2
        elif dir == "E":
            self.s1, self.s3, self.s4, self.s6 = self.s4, self.s1, self.s6, self.s3
        else: # dir == "W":
            self.s1, self.s3, self.s4, self.s6 = self.s3, self.s6, self.s1, self.s4

nums = list(map(int, input().split()))
ops = input()
d = Dice(nums)
for op in ops:
    d.rotate(op)
print(d.s1)
```

</details>

## ITP1_11_B:

<details>
<summary>答え</summary>

```python
class Dice:
    def __init__(self, nums):
        self.nums = nums
    def rotate(self, dir):
        if dir == "N":
            self.nums[0], self.nums[1], self.nums[4], self.nums[5] = self.nums[1], self.nums[5], self.nums[0], self.nums[4]
        elif dir == "S":
            self.nums[0], self.nums[1], self.nums[4], self.nums[5] = self.nums[4], self.nums[0], self.nums[5], self.nums[1]
        elif dir == "E":
            self.nums[0], self.nums[2], self.nums[3], self.nums[5] = self.nums[3], self.nums[0], self.nums[5], self.nums[2]
        else: # dir == "W":
            self.nums[0], self.nums[2], self.nums[3], self.nums[5] = self.nums[2], self.nums[5], self.nums[0], self.nums[3]
    def query(self, top, front):
        saved = nums
        ret = -1
        for dir in "NNNNWNNNWNNNENNNENNNWNNN":
            self.rotate(dir)
            if self.nums[0] == top and self.nums[1] == front:
                ret = self.nums[2]
                break
        self.nums = saved
        return ret

nums = list(map(int, input().split()))
N = int(input())
d = Dice(nums)
for _ in range(N):
    top, front = map(int, input().split())
    print(d.query(top, front))
```

</details>

## ITP1_11_C:

<details>
<summary>答え</summary>

```python
class Dice:
    def __init__(self, nums):
        self.nums = nums
    def rotate(self, dir):
        if dir == "N":
            self.nums[0], self.nums[1], self.nums[4], self.nums[5] = self.nums[1], self.nums[5], self.nums[0], self.nums[4]
        elif dir == "S":
            self.nums[0], self.nums[1], self.nums[4], self.nums[5] = self.nums[4], self.nums[0], self.nums[5], self.nums[1]
        elif dir == "E":
            self.nums[0], self.nums[2], self.nums[3], self.nums[5] = self.nums[3], self.nums[0], self.nums[5], self.nums[2]
        else: # dir == "W":
            self.nums[0], self.nums[2], self.nums[3], self.nums[5] = self.nums[2], self.nums[5], self.nums[0], self.nums[3]
    def query(self, top, front):
        saved = nums
        ret = -1
        for dir in "NNNNWNNNWNNNENNNENNNWNNN":
            self.rotate(dir)
            if self.nums[0] == top and self.nums[1] == front:
                ret = self.nums[2]
                break
        self.nums = saved
        return ret
    def is_equal(self, other):
        for dir in "NNNNWNNNWNNNENNNENNNWNNN":
            self.rotate(dir)
            flag = True
            for k in range(6):
                if self.nums[k] != other.nums[k]:
                    flag = False
                    break
            if flag:
                return True
        return False


nums = list(map(int, input().split()))
d1 = Dice(nums)
nums = list(map(int, input().split()))
d2 = Dice(nums)
if d1.is_equal(d2):
    print("Yes")
else:
    print("No")
```

</details>

## ITP1_11_D:

<details>
<summary>答え</summary>

```python
class Dice:
    def __init__(self, nums):
        self.nums = nums
    def rotate(self, dir):
        if dir == "N":
            self.nums[0], self.nums[1], self.nums[4], self.nums[5] = self.nums[1], self.nums[5], self.nums[0], self.nums[4]
        elif dir == "S":
            self.nums[0], self.nums[1], self.nums[4], self.nums[5] = self.nums[4], self.nums[0], self.nums[5], self.nums[1]
        elif dir == "E":
            self.nums[0], self.nums[2], self.nums[3], self.nums[5] = self.nums[3], self.nums[0], self.nums[5], self.nums[2]
        else: # dir == "W":
            self.nums[0], self.nums[2], self.nums[3], self.nums[5] = self.nums[2], self.nums[5], self.nums[0], self.nums[3]
    def query(self, top, front):
        saved = nums
        ret = -1
        for dir in "NNNNWNNNWNNNENNNENNNWNNN":
            self.rotate(dir)
            if self.nums[0] == top and self.nums[1] == front:
                ret = self.nums[2]
                break
        self.nums = saved
        return ret
    def is_equal(self, other):
        for dir in "NNNNWNNNWNNNENNNENNNWNNN":
            self.rotate(dir)
            flag = True
            for k in range(6):
                if self.nums[k] != other.nums[k]:
                    flag = False
                    break
            if flag:
                return True
        return False

N = int(input())
dices = []
for _ in range(N):
    nums = list(map(int, input().split()))
    dices.append(Dice(nums))

flag = True
for i in range(N - 1):
    for j in range(i + 1, N):
        if dices[i].is_equal(dices[j]):
            flag = False
            break
if flag:
    print("Yes")
else:
    print("No")
```

</details>
