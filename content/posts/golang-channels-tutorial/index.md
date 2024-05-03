---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Golang channels tutorial"
subtitle: ""
summary: "Golangの根っこに組み込まれているconcurrencyを実現する重要な部品であるchannelについて解説します！"
authors: []
tags: [Goalg, Channel, Tutorial]
categories: []
date: 2019-10-31T22:32:28+09:00
lastmod: 2019-10-31T22:32:28+09:00
featured: false
draft: false
markup: mmark
image: featured.jpeg

---
## golangとconcurrentなプログラミング
「concurrentな処理をどのように実現するか」はざっくり分けて2アプローチがある．

1つは「shared-memory communication」．つまり処理を実行しているworker同士は，メモリを共有して，その共有しているメモリを用いてコミュニケーションを取るというもの．この場合，データ競合が発生しないようにロックを取ったりなどの排他処理を伴うことになって，大抵の場合実装が難しくなるとされている．

もう1つは「message-passing communication」．つまり処理を実行しているworker同士は，メッセージをやり取りし合うことでコミュニケーションを取るというもの．

それぞれのアプローチでいろんな実装が世の中にはすでに存在していて，例えばCでconcurrentなプログラムを書こうとするとshared-memory communicationな形で書くことになる．一方でErlangは言語としてconcurrentなプログラミングをサポートしていて，Actorモデルを実装してる．

golangは，設計の時点でconcurrentなプログラミングは

> Do not communicate by sharing memory; instead, share memory by communicating

という思想で実装することとしている．golangのconcurrentなプログラミングの実装は「[Communicating Sequential Processes](http://en.wikipedia.org/wiki/Communicating_sequential_processes)」と「[$\pi$-caluculus](http://en.wikipedia.org/wiki/%CE%A0-calculus)」を参考にしている．

golangは「concurrentなプログラミングを簡潔にわかりやすく記述すること」を言語の設計レベルからサポートしているので，concurrentな処理がとても書きやすくなっている．じゃあgolangではどうやってconcurrentなプログラミングをサポートしているのかというと，concurrentなプログラミングのプリミティブとしてgoroutine，channelを提供している．

「golangはconcurrentな処理が書きやすいんだよね」という話をすると混乱しがちなのが， **「golangはconcurrentな処理を書くための道具を提供してくれるが，その実行がparallelであるかどうかはハードウェアに依存する」** という点．concurrentな処理は，parallelに実行することができるかもしれない（し大抵parallelに実行できるならそうしたほうがいい）が，それはハードウェアがparallelな実行をサポートしているか（例えばCPUが複数コア搭載しているか）によって決まってくる話であって，**「プログラムがconcurrentであること」と「プログラムの実行がparallelであること」は関連はしているけれども，全く別の話．**Rob Pike先生も

> Concurrency is about dealing with lots of things at once. Parallelism is about doing lots of things at once. Not the same, but related. **Concurrency is about structure, parallelism is about execution.** Concurrency provides a way to structure a solution to solve a problem that may (but not necessarily) be parallelizable.

って仰っている．

## Hello, goroutine!
https://play.golang.org/p/gHKEj4ai20c

「golangではconcurrentなプログラムを書きやすい」ということだったので，実際にconcurrentなプログラムを書いてみると上の例みたいになる．concurrentに処理を実行するworkerは，golangの世界では`gorutine`と呼ばれていて，`go`という魔法の言葉に続けてworkerで実行してほしい関数を呼び出せば，それでconcurrentな処理を書き下したことになる．なんて簡単なんだ...！

上の例を実行すると，`Hello! I'm main`って印字されて，もしかしたら`Hi! I'm goroutine!`も一緒に印字される __かもしれない__．「かもしれない」っていうのは，goroutineは「あるgoroutineの親は自分の子供の処理が終わるのを待たない」ことになっている．この場合だと`main`が親で`go fmt.Println("Hi! I'm goroutine!")`が子供の関係になっていて，`main`の`fmt.Println("Hello! I'm main")`の終了したら，その時点で子供の実行も終了させられてしまう．もし，子供のgoroutineが自己紹介し終わる前に親が自己紹介しきっちゃえば子供の自己紹介は印字されないし，親の自己紹介が終わる前に子供が自己紹介しきっちゃえば，親子両方の自己紹介が聞けることになる．

「なるほど．でも親が先に終わっちゃうと子供も強制終了って，それどうにかならないの？」って思った方は賢くて，どうにかするためにgoroutine間でおしゃべりできるchannelというデータ構造が実装してある．

## Nice to meet you, channel!
channelはgoroutineたちが同期しながらconcurrentな処理を実行していくためのmessage-passingのメカニズムを提供してくれる．channelは「そのchannelを通じてやり取りするデータの型・バッファサイズ・メッセージのやり取りの方向」で定義されて，組み込み関数の`make()`で簡単に作ることができる．

golangでは「channelはfirst-class value」として扱われる．つまりchannelは，他の値（例えばなんらかの構造体とか`int`型の変数とか関数とか）と同じレベルで扱われる．だから関数がchannelを返すなんてこともできるし，関数の引数にchannelを与えることもできるし，channelのchannelも定義できる．

channelの入出力の方向は`<-`という演算子で表現することになっている．`<- c`って書けばchannel `c`からデータを読み込むことになるし，`c <- 1`って書けばchannel `c`に`1`を書き込んだことになる．

ということで，channelを使った簡単ばプログラムを書いてみるとこんな感じになる．

https://play.golang.org/p/id0QnvLdbFn

channel `done` を使って「僕は自己紹介終わったよママ」って子供のgoroutineが親`main`に連絡することで，実行が同期されて両方の自己紹介が聞けるようになった．

channel `done`は「`bool`値を通す，バッファが0の，読み書きができるchannel」として定義されている．golangでは「バッファが0のchannelに対する読み書きは，情報の送受信両者がコミュニケーションの準備ができるようになるまでブロックされる」ことになっている．なので，この例だと，確実に子供goroutineの自己紹介を聞くことができることになる．「バッファが0のchannelに対する読み書きは，情報の送受信両者がコミュニケーションの準備ができるようになるまでブロックされる」という挙動から**バッファが0のchannelは「synchronous」と言える**．

下の例を実行すると，channel `message`に`1`を送り終わってから，`main`が1秒寝てしまうので，子供はchannel `message`に続く`2`，`3`を送れなくて，止められてしまう．この挙動はsynchronousということになる．

https://play.golang.org/p/3z4aodIMk7v

一方で，バッファのあるchannelに対する読み書きは「バッファが空でないなら読み込みはブロックされない」「バッファが一杯でないなら書き込みはブロックされない」という挙動になっている．なので，**バッファのあるchannelは「asynchronous」と言える**．

下の例を実行すると，channel `message`はバッファを持っているので子供は`1`，`2`，`3`，`4`と（`main`が眠りから覚める前に）立て続けに送ることができる．この挙動はまさしくasynchronousだ．

## Oh, poor deadlock...
「goroutineもchannelもわかったので」ということで下みたいなプログラムを書くと**deadlock**と言われてgolangのruntimeから叱られる．

https://play.golang.org/p/TbJsGMyAh8r

これはつまりどういうことかというと，golangのruntimeが「お前のプログラム実行したけど7行目でバッファのないchannelに`42`って送ってる（`c <- 42`）けど，それしたら受信者がいないし，受信者がいないと送信者も実行を進められないので，どうすることもできなくなっちゃったぞ」と怒っているのだ．

「バッファのないchannelはgoroutine間の挙動をsynchronousにするもの」なので「受信者となるgoroutineのいない，バッファ0のchannelに値を送るとdeadlockする」のだ．

今回の場合だと，受信者が存在しないことが問題なので，受信者となるgoroutineを作ればうまくいく．

https://play.golang.org/p/czvQy77d3jU

## Let's `range` channels and `close` them.
channelは`range`構文を使って1つずつ値を取り出すということも記述できる．でも，`range`を使ってchannelから値を次々取り出すときは**channelを明示的に`close()`しないといけない**．

https://play.golang.org/p/tTmMX8Ut5gg

チャンネルは組み込み関数の`close()`で「閉じる」ことができて，閉じられたchannelに対して書き込みを行おうとするとgolangのruntimeは`panic`して，閉じられたchannelに対して読み込みを行おうとするとそのchannelの扱う型のゼロ値が得られることになっている．

「閉じられたchannelに対する読み込み」の特徴は「goroutineに処理の終了を通知させる機構」として応用することができる．大抵，こういう処理終了通知を行う場合は空の構造体`struct{}`のchannelを使う．なんてったって空の構造体は0byteだからね．

https://play.golang.org/p/aAV4A-7UdZj

あと，閉じられたchannelに対する読み込みはブロックされないので，そのまま処理は進む．

## Multiple channels and `select`.
goroutineとchannelを使って実際になんらかの意味のあるプログラムを書こうとすると，たくさんのgoroutineとたくさんのchannelを扱うことになるのが普通である．大抵の場合「複数のchannelを同時に待ち受けたい」状況に出くわす．golangでは複数のchannelを同時に待ち受ける`select`構文を用意している．

https://play.golang.org/p/_CaWUfaJj2E

`select { case ...: ...}`という構文で，複数のchannelを同時に待ち受け，値が書き込まれたchannelだけに対応するという，イベント駆動みたいな処理も簡単に書くことができるようになっている．

## channel，お前最高かよ！
channelはマジで便利！でも使いこなすにはchannelの挙動をよく理解していないといけない．