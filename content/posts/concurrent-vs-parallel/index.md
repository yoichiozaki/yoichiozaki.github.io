---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Concurrent v.s. Parallel"
subtitle: "並行と並列"
summary: "似てるようで違うのでちゃんと区別したい"
authors: []
tags: [Concurrent, Parallel, Terminology]
categories: []
date: 2019-10-31T16:26:54+09:00
lastmod: 2019-10-31T16:26:54+09:00
featured: false
draft: false
image: featured.jpeg
---
## 日本語にすると...
調べてみると，**「Concurrentは並行」「Parallelは並列」**と訳されるのが一般的らしいですが，日本語にしたところで違いが判然としないので，自分なりの解釈を書いてはっきりさせておきます．

## っと，その前に広辞苑によれば...

> 【並行】並びゆくこと．また，並び行なわれること．「両案を並行して審議する」

> 【並列】並び連なること．直列の対義語

ダメだった．

## じゃあ，英英辞典（Oxford Dictionary）で引くと...

> concurrent
> 
> Existing, happening, or done at the same time.
> ‘there are three concurrent art fairs around the city’

> parallel
> 
> [Computing] Involving the simultaneous performance of operations.
> ‘highly parallel multiprocessor systems’

これでもダメだった．

## 僕の理解
### Concurrent
並行とは「複数のタスクが，論理的に，同時に処理されているように見えること」

具体的には，CPUが1コアの時代に，「一つのパソコンでブラウジングしながらメールが読める理由」を説明するのが「CPUがタスクをConcurrentに処理しているから」で，これが僕の「並行」の理解．

細切れにたくさんの仕事をちょっとずつ進めて，全体として複数のタスクが同時に処理されているように見えるってだけで，実際に複数のタスクが同時に処理されているわけではない．

**「一人でいろんな仕事を同時に進めている様」**が並行．

### Parallel
並列とは「複数のタスクが，物理的に，同時に処理されていること」

具体的にはマルチコアのプロセッサが，搭載している複数のプロセッサをちゃんと使い切って演算をしている様は，並列という言葉で形容できる．

**「複数人が同時に，それぞれの仕事を進めている様」**が並列．

ちなみに，「並列であれば常に並行である」という主張もあるらしい．「複数人が同時に，それぞれの仕事を進めている様」は側から見ると「いろんな仕事を同時に進めている」ように見えるから，確かにそうかもしれない．

### Rob Pike先生によれば...

> Concurrency is about dealing with lots of things at once.

> Parallelism is about doing lots of things at once.

> Not the same, but related.

> Concurrency is about structure, parallelism is about execution.

> Concurrency provides a way to structure a solution to solve a problem that may (but not necessarily) be parallelizable.


なるほど

### 結局なんだってばよ...

* Concurrency is a way of structuring your program to make it easy to understand and scalable 

* and Parallelism is simply the execution of multiple goroutine in parallel

## ref
- [Concurrency is not Parallelism](https://talks.golang.org/2012/waza.slide#1)