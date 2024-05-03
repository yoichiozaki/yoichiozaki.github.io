---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Federated Social WebとActivityPub"
subtitle: ""
summary: "ActivityPubが目指すFederated Social Webについて考えてみました"
authors: []
tags: [ActivityPub, Federated Social Web, Distributed Social Network, Mastodon, Decentralization]
categories: []
date: 2019-10-28T17:49:25+09:00
lastmod: 2019-10-28T17:49:25+09:00
featured: false
draft: false
image: featured.jpeg

---
## Federated Social Webとは？
Federated Social Webとは，誤解を恐れず端的に言えば「分散Twitter」である．

「分散Twitter」とは何かを説明するには，Twitterと対比するのがわかりやすい．TwitterはTwitter社が提供しているマイクロブログサービスで，ユーザーはTwitter社が管理するサーバー上に展開されているTwitterというシステム内にアカウントを作成し，テキストメッセージや動画像を投稿（ツイート）したり拡散（リツイート）したりすることができる．アカウントごとにタイムラインというインタフェースが提供され，ユーザーはタイムラインを通じてコンテンツを閲覧することができる．Twitterはアカウントを「Followする」という機能も実装している．これは「他のアカウントの投稿を自分のタイムラインに表示する機能」でユーザーは好みのコンテンツを投稿してくれるアカウントをフォローすることで，より簡単に好みのコンテンツを発見・消費することができるようになる．

Twitterの抱える問題点は「Twitterというサービスが中央集権的である」という点である．「Twitterというサービスが中央集権的である」とは

- 「TwitterというシステムはTwitter社の管理するマシン上でのみ展開されているため，そのマシンが落ちるとTwitterというシステム全体が落ちてしまう（単一障害点）」
- 「ユーザーがTwitterに投稿した任意のコンテンツやデータは基本的にTwitter社の管理するマシンにしか残らない」
- 「ユーザーは投稿内容についてTwitter社の決めるルールに従わなければならない（コンテンツの価値判断についての自由がユーザーから剥奪される．少なくともTwitter社がコンテンツに対して検閲を行えばそれを回避する手段は存在しない）」
- 「Twitterというサービスを提供するTwitter社の決めるルールに，ユーザーの全員が従わなければならない」
- 「TwitterというサービスのしようがTwitter社の一存で決まるため，Twitterというシステムに乗っかろうとする外部の開発者は地位的にTwitter社の下につくことになる」
- 「Twitterの実装は公開されない（ので，ユーザーがなんらかの不具合に直面しても，ユーザー自身で修正することが根本的に不可能）」

ということ．

「Twitterというシステムの管理者がTwitter社しかいない」と「ユーザーはTwitter社の決めたルールの中でした活動できない」ということになる．これは殊「コンテンツ共有」という文脈において大きな問題になる可能性がある．というのも，「コンテンツに対する価値判断やそれを発表することは，基本的に人間に与えられた自由である」からだ．いわゆる「表現の自由」ってやつだ．細かなことを言えば，法律が保証する「表現の自由」の範囲は「公共の福祉を侵害したり他者の自由を侵害しない」ような表現の自由であるようだが．ここで大事なのは，表現の自由を制約するのは「公共の福祉や他社の自由を侵害するかしないか」という社会的な合意であって，Twitterといった一私企業の決めたルールではないということだ．現状のSNSはその点で問題を抱えている（と自由を求めるユーザーは主張している）．無論，Twitter社の決めたルールの範囲内で楽しむので十分というユーザーもいるだろうし，なんならそっちの方が多数派な気もするが．

そんな問題意識からFederated Social Webという概念が登場している．Federated Social Webが実現したいのは「中央集権ではない形で社会的な人間の在りようをインターネットの世界に実装すること」である．Federated Social Webでは，先に挙げた目的を「Cleint-ServerモデルとServer-Serverモデルの組み合わせ」で実現しようとしている．

{{< figure src="federated-social-web.jpeg" title="Fededated Social Web" lightbox="true" >}}

Federated Social Webでは「既存のTwitterのような仕組みを提供するserverが不特定多数の管理者（これは組織でも個人でもいい）によって提供され，彼らが提供するシステムにユーザーが乗っかる」というモデルである．

「Federated」を英英辞典で引くと

> (of a country or organization) set up as a single centralized unit within which each state or division keeps some internal autonomy.

とある．つまり，Social Networkingに必要な機能を提供するserverが，（単一の管理者によって定められたルールによって動くのではなくて）複数の管理者が自由に定めたルールに基づいて統治・管理されるということだ．ユーザーは自分の納得するルールで運用されているserverにぶら下がれば，そのユーザーにとって十分な自由を享受できるし，いやになれば異なるルールで動いている他のserverに移ることだって可能だ．さらに言えば「オレオレルール」で運用されるオレオレSNSを構築することだって許されている．

## ActivityPubとは
ActivityPubはFederated Social Webを実現する際の通信プロトコルだ．ActivityPubは「あるserverとそれにぶら下がっているclient間の通信プロトコル」と「連合を組むserver間の通信プロトコル」の2つのプロトコルを内包している．

「あるserverとそれにぶら下がっているclient間の通信プロトコル」は，通常のSNSにおいて必要な投稿だとか他の人の行動のお知らせとかを受け取るために必要な通信を規定しているもの．

「連合を組むserver間の通信プロトコル」は，不特定多数の管理者が運営するserver間で情報を共有するための通信を規定するもの．これがあることで，「Federated」なSocial Webが初めて実現できる．

ActivityPubでは，ユーザーは「他のユーザーからのお知らせを受け取る`inbox`と自分のシステム上での行動を他の人に通知する`outbox`を持つActor」としてモデル化される．`inbox`/`outbox`の実体はwebの世界で言うところのURLに過ぎず，さらに言えばclientがserverに`GET`/`POST`する際のapi endpointでしかない．あctivityPubではどんな形式のデータをやりとりするかも規定している．より具体的に言えば「SNSをWeb上で実現する際のJSONメッセージフォーマット」を規定するActivityStreamsの上にActivityPubは規定されている．

要するに，client-server間の通信とclient-client間の通信のそれぞれについて，ActivityStreamsが定義するデータを用いたSNS上におけるActorの行動に対するCRUDを定義しているのがActivityPubである．

## 疑問
不特定多数の管理者がそれぞれのルールでSNSを提供するときに，それらSNS同士がやり取りをするための統一的なデータ形式・APIを規定しているのがActivityPubということになるが，各SNSが独自機能を実装して独自データフォーマットを追加したときはどのように対応するのだろう．

ActivityPubは最低限実装されるべきAPIとして整備されるにしても，独自データフォーマットについては共有する方法とかは規定していない．ActivityPubには「JSON-LDを用いてActivityStreamsは拡張可能である」としている．やり取りされるJSONメッセージに未知のフィールドが存在していたら，無視するか適当に解釈するかしかないので，どうするのだろう．ただ，SNSというある程度要求されるAPIがサービスから予測がつくしそれ以上の独自性がなさそうという感覚からすればActivityStreamsで十分なのかもしれない．この点はActivityStreamsを読んでみないとわからないと思うので気が向いたらやろうかな．

## Mastodon
MastodonはActivityPubを実装しているウェブアプリケーションの1つ．ちょっと前にちょっと流行った．Mastodonの面白いところは，Social Webにおけるグローバルなuser identityをメールアドレスみたいな形式で表現できるようにしたこと．Web上でのIdentityはサービスと強固に結びついていて，現在でもGoogle，Facebook，GitHub認証のサービスがたくさんある．「私はAliceです」と，ただそれだけで主張することができるURLがWeb上には存在していなくて，「FacebookのAliceさん」とか「GoogleのAliceさん」という風にしか自分のことを表現できていない状態にある．Federated Social Webの実装例であるMastodonでは，`<user_id>@<federation_id>`みたいな形でユーザーのグローバルなIdentityを与えることにしていて，これは賢いなと思う．