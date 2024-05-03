---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Simple Calculator"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-27T20:40:58+09:00
lastmod: 2021-03-27T20:40:58+09:00
featured: false
draft: false


---

## 問題

文字列として与えられる数式を計算するプログラムを書け．

```python
print(compute("2*3+5/6*3+15")) # => 23.5
```

## 答え

```python
from enum import Enum, auto
class Op(Enum):
    ADD = auto()
    SUB = auto()
    MUL = auto()
    DIV = auto()
    NOP = auto()

def priority(op):
    if op == Op.ADD or op == Op.SUB:
        return 1
    elif op == Op.MUL or op == Op.DIV:
        return 2
    else: # op == Op.NOP
      return 1

def compute(s):
    num_stack = []
    op_stack = []

    def parse_num(s, i):
        buf = ""
        while i < len(s) and s[i].isdigit():
            buf += s[i]
            i += 1
        return int(buf)

    def parse_op(s, i):
        if i < len(s):
            op_str = s[i]
            if op_str == "+":
                return Op.ADD
            elif op_str == "-":
                return Op.SUB
            elif op_str == "*":
                return Op.MUL
            elif op_str == "/":
                return Op.DIV
        return Op.NOP

    def apply(next_op, num_stack, op_stack):
        while 2 <= len(num_stack) and 1 <= len(op_stack):
            if priority(next_op) <= priority(op_stack[-1]):
                right = num_stack.pop()
                op = op_stack.pop()
                left = num_stack.pop()

                if op == Op.ADD:
                    num_stack.append(left + right)
                elif op == Op.SUB:
                    num_stack.append(left - right)
                elif op == Op.MUL:
                    num_stack.append(left * right)
                elif op == Op.DIV:
                    num_stack.append(left / right)
                else: # op == Op.NOP
                    num_stack.append(right)
            else:
                break

    i = 0
    while i < len(s):
        num = parse_num(s, i)
        num_stack.append(num)
        i += len(str(num))
        if len(s) <= i:
            break

        next_op = parse_op(s, i)
        i += 1

        apply(next_op, num_stack, op_stack)
        op_stack.append(next_op)

    apply(Op.NOP, num_stack, op_stack)

    if len(num_stack) == 1 and len(op_stack) == 0:
        return num_stack.pop()
    else:
        return 0

s = "2*3+5/6*3+15"

print(compute(s)) # => 23.5
```
