---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Self-Sovereign Identity - 自己主権型アイデンティティー"
subtitle: "インターネット上の「パスポート」を作る試み"
summary: "Self-Sovereign Identityについてのメモです"
authors: []
tags: [Self Sovereign Identity, Distributed Identity, Blockchain, Identity]
categories: []
date: 2019-11-03T23:48:08+09:00
lastmod: 2019-11-03T23:48:08+09:00
featured: false
draft: false
image: featured.jpeg

---
## Identity is...

> The fact of being who or what a person or thing is.

## Self-Sovereign Identity - 自己主権型アイデンティティとは
Self-Sovereign Identityとは，一言で言えば「物理世界における身分証明書と同じレベルの正当性と携帯性と情報の制御可能性を備えたデジタルな身分証明書」です．Self-Sovereign Identityが実現すれば，公的に有効な身分証明書として機能するだけでなく，物理世界における「運転免許証」のように手軽に携帯できて，第二者に対して証明したい事柄に関連する必要十分な情報のみを開示する（例えば，年齢確認する際には誕生年だけ提示して住所は見せない）といった個人情報の制御も可能となります．

## 現状のDigital Identityの問題点・Self-Sovereign Identityが必要とされる背景
そもそもなぜSelf-Sovereign Identityなるものが必要なのでしょうか．それはインターネットという計算機のネットワークが「接続において，通信の両端点のアイデンティティーを全く考慮しない」という系だからです．

インターネットでは「誰が繋がっているのか」について全く関知しません．だからこそ自律分散な系として成立することができます．中央で接続を管理する者が存在する必要がないわけですね．

しかし，SNSの登場によってインターネット上でのアイデンティティーのようなものが確立されてきました．SNSのアカウント情報です．SNSは「物理世界における人間のネットワーク」を計算機上に実現したものであるから，SNSという系に登場するアカウントは物理世界の人間と非常に密に関連している情報だし，その側面を持ってアイデンティティー的なものと見ることもできなくもないです．しかしSNSアカウントは物理世界におけるアイデンティティー（パスポートや運転免許証）と等価なものとしては扱えません．

物理世界のアイデンティティーは「国家のような信頼できる第三者によって発行される証明書」として存在しています．パスポート，運転免許証はまさしくそれです．国家が「この人はこういう人で...」という保証をしてくれているのです．だから（少なくともその証明書を発行している第三者を信頼できる者という共通認識のある範囲内では）証明書を見せつけることで第二者に対して自分の身分を証明することが可能なのです．

パスポートや運転免許証はポケットに入れて持ち運ぶことができます．さらに第二者に対して開示する個人情報を，自分の手で制御することができます．相手に年齢確認を求められたなら，生年月日だけで十分（住所まで教える必要はない）ですから，運転免許証の該当部分だけ見せてあとは黒塗りとかでも主張の正当性は証明できるわけですね．この携帯性と情報開示に対する制御性が物理世界におけるアイデンティティーの持つ重要な性質です．

SNSアカウントは実はこの「携帯性」と「情報開示に対する制御性」を兼ね備えていません．FacebookアカウントでTwitterにはログインできないし，Facebookは僕の持っているFacebookアカウントの情報の完全なコピーを持っていますし，Facebookがそれを外部に公開してしまえば，僕にはそれを止める手段がありません．

Self-Sovereign Identityはデジタルなアイデンティティーにサービスを跨いだ携帯性とアイデンティティー情報に対する制御性をユーザーに取り戻すことを目指して考案された概念です．

### Self-Sovereign Identityに至るまでのデジタルアイデンティティーの変遷
デジタルアイデンティティーの類型はだいたい以下の4個です．どれも現役で用いられているアイデンティティーで，後半のものほど新し目な考え方で，グラデーションがついていると思うとわかりやすいです．

- Centralized Identity - 中央集権型アイデンティティー
- Federated Identity - 連合型アイデンティティー
- User-Centric Identity - ユーザー中心型アイデンティティー
- Self-Sovereign Identity - 自己主権型アイデンティティ

#### Centralized Identity - 中央集権型アイデンティティー
ここのサービスごとに，サービス運営者がIDを発行・管理するタイプのIDです．メールアドレスとパスワードでアカウントを作成するタイプのIDはこれです．IDの管理権限が発行主体にあるというのが特徴で，現在世の中で運営されているほとんどのインターネットサービスがこの方式を採用していますね．

サービスのビジネスモデルがユーザーの囲い込みによって成立しているという側面を考慮すると，発行とともに管理できる方が，サービス運営者としてはやりやすいし，実装も容易であるからだと思います．

このタイプのIDは，発行されたIDをそのサービスの外に持ち出すことが難しいことから，ユーザーのサービスに対するロックインや，サービスごとのアイデンティティーの分断，ユーザーによるIDの管理が不可能（サービス運営者が悪意を働いてもそれを止める手段をユーザーは持ち合わせていない）という問題点があります．

#### Federated Identity - 連合型アイデンティティー
複数のサービス間でIDについて合意を取ることで，連合内ではIDの持ち運びが可能となるようなIDのことです．Single Sign-Onと呼ばれることもあります．1つのIDで複数サービスにログインできるサービス間での相互運用性Interoperabilityを実現します．

連合型アイデンティティーは中央集権型のそれよりもユーザーの利便性は向上する一方で，連合型アイデンティティーであっても，IDそのものの管理は連合を組んでいるサービス提供者側にあります．

実は連合型アイデンティティーに対する取り組みは，これまで一部で実際に行われてきた歴史があります．1999年にはMicrosoftが[Passport](https://news.microsoft.com/2000/05/17/passport-to-convenience-microsofts-single-sign-in-and-wallet-services-for-online-shopping/)という連合型アイデンティティーサービスに取り組もうとしていました．

これは，その当時に増加してきていたEコマース事業に対してその利便性を高めることを狙ってMicrosoftが取り組んでいたもので，Windows XPへのPassportでのサインインが可能だったりと結構新し目なことに取り組もうとしたのだと思います．Eコマースサイトに手元のパソコンのアカウントでログインできるということですから，覚えなきゃいけない情報が減るので助かりますね．

一方で，Microsoftが一社でIDを管理するという色合いが強かったのも事実で，それを嫌ってか，広く利用されるには至らなかったようです．

実はMicrosoftのPassportに対抗してSun Microsystemsを中心とした企業連合によってLiberty Allianceという同じく連合型アイデンティティーの実現を目指した団体があったようなんですが，これも道半ばで頓挫してしまいました．

#### User-Centric Identity - ユーザー中心型アイデンティティー
「ユーザーは自身のIDを自らの手で制御すべきだ」という考えに基づいて考案されたのがユーザー中心型アイデンティティーです．ユーザー中心型アイデンティティーでは「ユーザーの同意Consent」と「相互運用性Interoperability」に特に重きがおかれました．ユーザー中心型アイデンティティーはThe Identity Commonsという団体がリードしていたプロジェクトで，The Identity CommonsはInternet Identity Workshopを設立し，ユーザー中心型アイデンティティーの仕様策定を推進してきました．Internet Identity WorkshopはOpenID，OpenID Connect，OAuthといった現在多くSingle Sign-Onで利用されている仕様を誕生させています．

一方でユーザー中心型アイデンティティーでも，IDの管理はIDの発行元によって行われ，もし発行元がIDの削除をしてしまえばそのIDは存在しなくなってしまうわけで，完全なユーザー中心（管理までユーザーの手で行う）というわけではないようです．

#### Self-Sovereign Identity - 自己主権型アイデンティティ
「物理世界におけるアイデンティティーの持つ携帯性と情報に対する制御性をデジタルなアイデンティティーに持ち込もう」というのが自己主権型アイデンティティーです．アイデンティティーに管理を自分の手で行おうとするのが自己主権に指す意味です．

## Self-Sovereign Identityの仕組み
- 信頼できる第三者がユーザーの身分を証明する証明書を発行し，その証明書に電子署名を施す．この際に信頼できる第三者に対する識別子と署名情報を情報を耐改竄性のある公共アクセスが可能なストレージに保存する
- ユーザーは信頼できる第三者によって電子署名の施された証明書に対して自分の電子署名を施して，手元に保管する．この際，ユーザーに対する識別子と署名情報を耐改竄性のある公共アクセスが可能なストレージに保存する
- 身分証明を要求する検証者はユーザーから提示された証明書（もしくはその一部）に対して，その証明書が正当であることを公共アクセス可能なストレージに保存されている情報をもとに判断する

この「耐改竄性のある公共アクセスが可能なストレージ」がブロックチェーンを用いることで実現できるかもしれないということで，Self-Sovereign Identityの実現可能性が見えてきているのです．

## Ref
- https://medium.com/@AlexPreukschat/self-sovereign-identity-a-guide-to-privacy-for-your-digital-identity-5b9e95677778
- https://www.windley.com/archives/2018/09/multi-source_and_self-sovereign_identity.shtml
- https://www.w3.org/TR/2019/WD-did-core-20191107/
- https://www.jnsa.org/seminar/2018/0126/data/2-3.pdf
- https://www.icr.co.jp/newsletter/wtr346-20180126-ogawa.html
- https://www.dappsway.com/entry/what-is-ssi
- https://www.windley.com/archives/2017/10/fixing_the_five_problems_of_internet_identity.shtml
- https://www.ibm.com/blogs/blockchain/category/trusted-identity/self-sovereign-identity/
- http://www.lifewithalacrity.com/2016/04/the-path-to-self-soverereign-identity.html