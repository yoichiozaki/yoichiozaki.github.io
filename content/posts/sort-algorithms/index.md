---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sort Algorithms"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-03-21T13:26:13+09:00
lastmod: 2021-03-21T13:26:13+09:00
featured: false
draft: false


---

基本的なソートアルゴリズムを復習

## Bubble Sort

隣り合う要素同士の比較を繰り返すことで，最大要素を順次確定させていく．

```python
def bubble_sort(lst):
    for idx in range(len(lst) - 1, 0, -1):
        for j in range(0, idx, 1):
            if lst[j+1] < lst[j]:
                lst[j], lst[j+1] = lst[j+1], lst[j]
    return lst
```

## Insertion Sort

トランプゲームで手札をソートするときをイメージする．左のカードから，そのカードが挿入されるべき位置を探し出してそこに挿れる．カードを移動しながら挿入位置を探す．

```python
def insertion_sort(lst):
    for i in range(0, len(lst), 1):
        key = lst[i]
        j = i - 1
        while -1 < j and key < lst[j]:
            lst[j+1] = lst[j]
            j -= 1
        lst[j+1] = key
    return lst
```

## Merge Sort

分割統治法．

```python
def merge_sort(lst):
    return _merge_sort(lst, 0, len(lst)-1)

def _merge_sort(lst, left, right):
    if left == right:
        return [lst[left]]

    middle = (left + right) // 2
    lhs = _merge_sort(lst, left, middle)
    rhs = _merge_sort(lst, middle+1, right)

    return __merge(lhs, rhs)

def __merge(a, b):
    ret = []
    i = 0
    j = 0
    while i < len(a) and j < len(b):
        if a[i] < b[j]:
            ret.append(a[i])
            i += 1
        else:
            ret.append(b[j])
            j += 1
    if i < len(a):
        ret += a[i:]
    else:
        ret += b[j:]
    return ret
```

## Heap Sort

ヒープを使って最大値を調べ続けることでソートする．

```python
def heap_sort(lst):
    for i in range(len(lst)-1, 0, -1):
        _heapify(lst, 0, i)
        lst[0], lst[i] = lst[i], lst[0]
    return lst

def _heapify(lst, left, right):
    parent = (left + right) // 2

    while parent != -1:
        left_child = 2 * parent + 1
        right_child = 2 * parent + 2

        if right < left_child: # no child
            pass
        elif right < right_child: # only left child
            if lst[parent] < lst[left_child]:
                lst[parent], lst[left_child] = lst[left_child], lst[parent]
        else: # both child
            largest = right_child if lst[left_child] < lst[right_child] else left_child
            if lst[parent] < lst[largest]:
                lst[parent], lst[largest], lst[largest], lst[parent]
        parent -= 1
```

## Quick Sort

分割統治法．

```python
def quick_sort(lst):
    # base case
    if len(lst) == 0:
        return []
    pivot = lst[0] # better strategy exists
    left = [] # less than pivot
    right = [] # more than pivot
    counter = 0 # number of elements that equal to pivot
    for ele in lst:
        if ele < pivot:
            left.append(ele)
        elif ele == pivot:
            counter += 1
        else: # pivot < ele
            right.append(ele)
    left = quick_sort(left)
    right = quick_sort(right)
    return left + [pivot] * counter + right
```
