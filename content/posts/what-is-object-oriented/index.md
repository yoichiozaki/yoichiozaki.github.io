---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "「オブジェクト指向」について考える"
subtitle: "-orientedとは"
summary: ""
authors: []
tags: [Terminology, Object-Oriented Programming, OOP]
categories: []
date: 2020-03-08T13:47:19+09:00
lastmod: 2020-03-08T13:47:19+09:00
featured: false
draft: false


---

## "-oriented"ってどういう意味なんだろう？

プログラミングをお勉強しているので，いろんなカタカナ用語に遭遇する．カタカナ用語ってその言葉の指す意味が字面に現れてこなくて，「それってどういう意味？」となりがちだ．

最近気になったのは「XXX-oriented」という言葉だ．Object-orientedとかservice-orientedとかで目にする．日本語に訳されるときは「XXX指向」って訳されている．が，日本語に訳されたところで意味は判然としない．「オブジェクト指向 とは」でググるとめちゃめちゃたくさんのブログ記事が出てくる．だいたい「オブジェクト指向ってよくわかんねぇよな！俺が解説してやる！」っていう趣旨の記事で，世界一わかりやすいと謳っている．

僕もそれらの類の記事はいくつか呼んだことがあるし，オブジェクト指向なプログラミングを文法からサポートするいろんな言語でプログラミングをしたことがあるので，オブジェクト指向とはなんなのか，みたいなところの「手触り感」はなんとなく分かっているけど，もうちょっとメタな視点から「XXX-oriented」の意味を考えてみたくなった．

「XXX-oriented」の中でも一番有名なのかも知れないのが「Object-oriented」だと思うので，そこから考えてみる．オブジェクト指向でプログラムすると，記述したい事柄を「データとデータに対する操作を一括にまとめたオブジェクト」なるものをたくさん定義して，それらの相互作用でプログラムを記述していくことになる．オブジェクト指向ではプログラムにおける主役は「オブジェクト」であり，プログラマはそれらオブジェクト同士の動きを，あたかも演劇における脚本を書いているかのように操って1つのプログラムに仕立て上げる．僕が思うに，オブジェクト指向で大事なのは「プログラムにおける主役がオブジェクトである」という点がオブジェクト指向の本当のところなのだと思う．「Object-oriented」が「オブジェクトが主役」の意味なら「XXX-oriented」は「XXXが主役」ってことなのだろうか？

「oriented」を適当に英語辞典で引いてみると，「特定の方向に向く，位置を定める」という意味の「orient」の過去分詞が転じた形容詞と書いてあった．ということは，字面で言えば「オブジェクトの方を向いた」って意味なのか？「オブジェクト指向」という漢字はそういう雰囲気が確かに感じられる．

Object-orientedって言うときはおそらく「オブジェクトを主役とする（という方向を向いた）思想に基づく技術」って意味なんだろうなぁ．となるとObject-oriented programmingっていうのは「オブジェクトを主役とする（という方向を向いた）思想に基づいて確立されたプログラミング手法」的な意味合いになりそうだし，僕の肌感ともあってくる．

なるほど，Service-Oriented Architectureもそう考えると，「サービス」が主役として振る舞うアーキテクチャってことなんだろうな...じゃあ最近話題のマイクロサービスアーキテクチャと何が違うんだろう...同じような名前だけど...暇なときにでも調べてみるか．

> 「XXX-oriented」とは「XXXという方向性に基づく（技術）」ぐらいの意味