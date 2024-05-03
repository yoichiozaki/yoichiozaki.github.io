---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "排他制御のあれこれと `sync` パッケージ"
subtitle: ""
summary: ""
authors: []
tags:
  [
    Go,
    Golang,
    sync,
    goroutine,
    同期処理,
    排他制御,
    Once,
    WaitGroup,
    Mutex,
    Cond,
    Atomic,
  ]
categories: []
date: 2020-04-13T22:31:16+09:00
lastmod: 2020-04-13T22:31:16+09:00
featured: false
draft: true


---

## 排他制御

## `sync` パッケージ

### `sync.Once`

一度だけ実行したい関数は，一度だけしか実行されていはいけない．

https://play.golang.org/p/tfQOakcWXHK
