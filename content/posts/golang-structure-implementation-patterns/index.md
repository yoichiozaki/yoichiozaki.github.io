---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Golangでよく見かける構造体実装パターン"
subtitle: ""
summary: ""
authors: []
tags: [Golang, Implementation Pattern]
categories: []
date: 2019-11-14T14:57:55+09:00
lastmod: 2019-11-14T14:57:55+09:00
featured: false
draft: false


---
## Golangでよく見かける構造体実装パターン
よく見かけるパターンをまとめてみた．

### コンストラクタとしての`NewXXXX()`
構造体の初期化と生成に使うパターン

https://play.golang.org/p/7PCxyYTCwek

- :+1: 構造体の生成と初期化の内部実装を利用者に見せない
- :+1: 構造体そのものの構造を利用者に見せない

### エクスポートして外部パッケージからのアクセス許可を利用したシングルトン
「構造体名の先頭を大文字にすることで外部パッケージからのアクセスを許可する」というGolangの特徴を生かしてシングルトンを生成できる．

```golang
package singleton

// 構造体自体を外部に公開しない
type singleton struct {
}

// 構造体のインスタンスを保持する変数も外部に公開しない
var instance *singleton

// シングルトンなインスタンスを取得する関数のみを外部に公開
func GetInstance() *singleton {
	if instance == nil {
	     instance = &singleton{}
	}
	return instance
}
```

### `interface`でポリモーフィズム
Golangには「型の継承」がない．一方で，`interface`を用いることでポリモーフィズムを実現できる．`interface`によって振る舞いを定義することで，「同じような振る舞いをするもの」をまとめて扱えるようになる．

https://play.golang.org/p/p-yY5gEOdaG

### 構造体の埋め込みによるポリモーフィズム
ある構造体に対して，特定の振る舞いを実装している構造体を埋め込むことで，その構造体も「埋め込まれた構造体と同様な振る舞いをするもの」として扱うことができる．ただ，これをやると構造体の初期化時に構造体の内部を意識する必要があるため，初期化のための`NewXXXX()`を用意してあげると良い．

https://play.golang.org/p/MsxaudYhObv

### 埋め込まれた構造体が上位の構造体の関数を使う
オブジェクト指向では「子クラスが親クラスのメソッドを用いること」ができるが，Golangでもできないことはない．

https://play.golang.org/p/cQ4uSQ7_TLl

### 構造体による処理の移譲
構造体のメンバーとして，特定の処理に対して責任を持つ構造体を持つことで，処理の移譲を実現できる．

https://play.golang.org/p/KPX9i1sY1CK

### 関数による処理の移譲
Golangでは関数は第1級市民なので値として扱うことができる．処理を定義した関数をやりとりすることで処理を移譲させることができる．

https://play.golang.org/p/MN93S3LVX9l