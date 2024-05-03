---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "GolangでNLP100本ノック2015"
subtitle: "全部やる"
summary: ""
authors: []
tags: [Golang, NLP, Natural Language Processing]
categories: []
date: 2019-11-16T17:46:04+09:00
lastmod: 2019-11-16T17:46:04+09:00
featured: false
draft: true


---

## 第1章 準備運動
### 00. 文字列の逆順
文字列"stressed"の文字を逆に（末尾から先頭に向かって）並べた文字列を得よ．

https://play.golang.org/p/OiM7wqn50kb

### 01. 「パタトクカシーー」
「パタトクカシーー」という文字列の1,3,5,7文字目を取り出して連結した文字列を得よ．

https://play.golang.org/p/d9kXepz2Grr"

### 02. 「パトカー」＋「タクシー」＝「パタトクカシーー」
「パトカー」＋「タクシー」の文字を先頭から交互に連結して文字列「パタトクカシーー」を得よ．

https://play.golang.org/p/aB-iS-yOU-B

### 03. 円周率
"Now I need a drink, alcoholic of course, after the heavy lectures involving quantum mechanics."という文を単語に分解し，各単語の（アルファベットの）文字数を先頭から出現順に並べたリストを作成せよ．

https://play.golang.org/p/19SEfNT85rc

### 04. 元素記号
"Hi He Lied Because Boron Could Not Oxidize Fluorine. New Nations Might Also Sign Peace Security Clause. Arthur King Can."という文を単語に分解し，1, 5, 6, 7, 8, 9, 15, 16, 19番目の単語は先頭の1文字，それ以外の単語は先頭に2文字を取り出し，取り出した文字列から単語の位置（先頭から何番目の単語か）への連想配列（辞書型もしくはマップ型）を作成せよ．

https://play.golang.org/p/2qz00kzbb3a

### 05. n-gram
与えられたシーケンス（文字列やリストなど）からn-gramを作る関数を作成せよ．この関数を用い，"I am an NLPer"という文から単語bi-gram，文字bi-gramを得よ．

https://play.golang.org/p/pjjXy7HrVvj

### 06. 集合
"paraparaparadise"と"paragraph"に含まれる文字bi-gramの集合を，それぞれ, XとYとして求め，XとYの和集合，積集合，差集合を求めよ．さらに，'se'というbi-gramがXおよびYに含まれるかどうかを調べよ．

https://play.golang.org/p/D1VPvEbbv28

### 07. テンプレートによる文生成
引数x, y, zを受け取り「x時のyはz」という文字列を返す関数を実装せよ．さらに，x=12, y="気温", z=22.4として，実行結果を確認せよ．

https://play.golang.org/p/Xgld7B2DagR

### 08. 暗号文
与えられた文字列の各文字を，以下の仕様で変換する関数cipherを実装せよ．

```
英小文字ならば(219 - 文字コード)の文字に置換
その他の文字はそのまま出力
この関数を用い，英語のメッセージを暗号化・復号化せよ．
```

https://play.golang.org/p/HHhSUM_d03P

### 09. Typoglycemia
スペースで区切られた単語列に対して，各単語の先頭と末尾の文字は残し，それ以外の文字の順序をランダムに並び替えるプログラムを作成せよ．ただし，長さが４以下の単語は並び替えないこととする．適当な英語の文（例えば"I couldn't believe that I could actually understand what I was reading : the phenomenal power of the human mind ."）を与え，その実行結果を確認せよ．

https://play.golang.org/p/eh7KwGiUgyu

https://cipepser.hatenablog.com/entry/2017/02/11/082804
## 第2章 UNIXコマンドの基礎
## 第3章 正規表現
## 第4章 形態素解析
## 第5章 係り受け解析
## 第6章 英語テキストの処理
## 第7章 データベース
## 第8章 機械学習
## 第9章 ベクトル空間法Ⅰ
## 第10章 ベクトル空間法Ⅱ
