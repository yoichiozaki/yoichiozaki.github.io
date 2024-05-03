---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "暗号の基礎技術"
subtitle: "暗号技術学習メモ #1"
summary: "暗号技術学習メモ #1"
authors: []
tags: [Cryptography, Memo]
categories: []
date: 2019-10-28T12:40:48+09:00
lastmod: 2019-10-28T12:40:48+09:00
featured: false
draft: false
---

## 暗号の基礎技術
暗号技術の中でも基礎となるもの．

- 暗号
- 鍵配送
- ハッシュ関数
- メッセージ認証コード
- デジタル署名
- 擬似乱数生成器

### 暗号
暗号とは，「正当な送信者と受信者以外に内容を秘匿する技術」のこと．送信者は平文に対して，なんらかの操作を施すことで，暗号文を生成する．この過程を暗号化という．一方で，受信者は暗号文に対してなんらかの操作を施すことで平文を得る．この過程を復号という．

### 鍵配送
鍵配送とは，暗号化や復号に用いる鍵を安全に配送・共有するための技術や方式のこと．鍵は「第三者に知られないように」配送する必要があります．

### ハッシュ関数
ハッシュ関数とは，任意長のビット列を入力として固定長のビット列を出力する関数のこと．同一の入力に対して同一の出力をする一方で，異なる入力に対して異なる出力となり，異なる入力に対して同一の出力にならないという性質が求められる．

### メッセージ認証コード
メッセージ認証コードとは，「伝送路上を通ってきたデータが改ざんされていないこと」「データが期待した通信相手から送信されていること」を検証するための技術のこと．

### デジタル署名
デジタル署名とは，契約書における物理的なサインのデジタル版で，ユーザー認証とデータ認証を同時に実現する技術のこと．メッセージの改ざんを防ぎ，メッセージに対する署名は署名した本人でしか生成できないことから，後から署名者が署名した契約について否認することを防止することができる．

### 擬似乱数生成器
真の乱数ではないにしても，暗号論的に安全とみなせる乱数列を生成するための技術のこと．