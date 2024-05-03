---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "FramworkとLibraryの違い"
subtitle: "似てるようで結構違う話"
summary: "ちゃんと説明できますか？"
authors: []
tags: [Framework, Library]
categories: []
date: 2019-10-25T22:45:15+09:00
lastmod: 2019-10-25T22:45:15+09:00
featured: false
draft: false
image: featured.png

---

## ありがちな会話

「Web Application Frameworkと言ったら，やっぱりRuby on Railsだよね！」

「Webのフロント開発ではjQueryってライブラリがあってだな...」

「最近だと，FacebookがJavascriptのフレームワークとしてReactを発表してるよね」

「ReactよりAngular JSの方がいいよ」

Web系の技術の話では，たくさんのFrameworkだのLibraryだのが提案されて使用されていると思います．僕なんかも初めて聞くものがあれば，すぐにググってその正体を知ろうとするのですが，どれもこれも「これは便利なWeb Frameworkです」ぐらいしか教えてくれません．Frameworkの正体って一体何なのでしょうか．気になったので調べてみました．

## Library v.s. Framework
### Library
Libraryは，コードの再利用を目的とした「便利な関数やクラスの（ただの）コレクション」のようなものです．Libraryに含まれる関数やクラスは，ある特定の処理を達成するロジックを含んでいて，開発者がそれらを利用することで開発を進めていくことになります．例えばグラフアルゴリズムのライブラリなら，Dijkstra法とかBellman-Ford法を実装した関数が含まれていて，開発者がその関数を利用することでアプリケーションを開発します．アプリケーションの開発者が書いているロジックにライブラリの関数が利用されるので，アプリケーションの制御は開発者側にあります．

Libraryを用いることで，他の人の仕事の恩恵に与りながら開発を進めることができます．これはとても嬉しいことです．開発の速度が上がります．

要するに「**Libraryのコードを開発者が利用する**」のがLibraryです．

### Framework
Frameworkは， (初期化から実際の処理，終了といった) アプリケーションの制御は *全てFramework側にあります* ．アプリケーションを開発者は，Frameworkが要求するロジックを部品としてFrameworkに提供することになるわけです．Frameworkはアプリケーションの骨格を定義しているともいるかもしれません．外枠だけ定義しているのです．このFrameworkの持つ性質は，ソフトウェア工学的には「制御の反転 IoC (Inversion of Control)」と呼ばれています．

Frameworkを用いることで，アプリケーション開発者は設計についてあれやこれや悩む必要がなくなります．Frameworkの要求に従っていれば，それなりの品質のシステムが勝手に出来上がることになるからです．また，Frameworkに則ってアプリケーションを開発していくと，コードに一貫性が生まれます．これはコードに可読性を与え，メンテナンスがしやすくなります．

一方で，Frameworkは「制約の集合」でもあります．アプリケーションの全体としての制御が開発者の自由にできないわけですから，Frameworkを導入するならばFrameworkの課すルールを理解する必要があります．ルールを理解するのには時間がかかるものですし，Frameworkのルールに窮屈さを感じることもあるかもしれません．小規模なその場限りの開発現場などでは，この制約がFrameworkのメリットを上回ることがあるので，Frameworkを導入しないこともあるでしょう．

要するに「**Frameworkが開発者のコードを利用する**」のがFrameworkです．

{{< figure src="library-framework-relationship.jpeg" title="LibraryとFrameworkとあなた" lightbox="true" >}}

## 参考
- [ソフトウエアのフレームワークとはなにか (日経XTECH)](https://tech.nikkeibp.co.jp/it/article/lecture/20070205/260697/)
- [フレームワークとライブラリの違い (Qiita)](https://qiita.com/azuki8/items/ad7710fdefaedc63e3f7)
- [The Difference Between a Framework and a Library (freeCodeCamp)](https://www.freecodecamp.org/news/the-difference-between-a-framework-and-a-library-bd133054023f/)
- [What is the difference between a framework and a library? (stackoverflow)](https://stackoverflow.com/questions/148747/what-is-the-difference-between-a-framework-and-a-library)
