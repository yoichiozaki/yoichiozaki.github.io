---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "🚩flagパッケージでコマンドライン引数を扱う"
subtitle: ""
summary: "flagパッケージでコマンドライン引数を賢く扱おう！"
authors: []
tags: [Golang, Tips]
categories: []
date: 2019-10-25T19:04:31+09:00
lastmod: 2019-10-25T19:04:31+09:00
featured: false
draft: false


---
##  `flag`パッケージ
Golangでは，標準パッケージとしてコマンドライン引数を扱う[`flag`](https://golang.org/pkg/flag/)パッケージが付属しています．「痒い所に手が届く」とはこのことですね．

##  フラグの立っていないコマンドライン引数の取得
`Parse()`の後に`Args()`で`[]string`として取得できます．

```golang
package main

import (
	"flag"
	"fmt"
)

func main() {
	flag.Parse()
	args := flag.Args()
	fmt.Println(args)
}
```

```shell
$ go run with-no-flag0.go a b c
[a b c]
$ go run with-no-flag0.go 1 2 3
[1 2 3]
```

$n$番目の要素のみを取り出したい場合は`Arg(n)`で`string`として取得できます．$n$番目の要素が存在しない場合は`""`が返ってくるようです．

```golang
package main

import (
	"flag"
	"fmt"
)

func main() {
	flag.Parse()
	fmt.Println(flag.Arg(0), flag.Arg(1))
}
```

```shell
$ go run with-no-flag1.go hoge fuga
hoge fuga
$ go run with-no-flag1.go 1
1
```

## フラグの立っているコマンドライン引数の取得
`型名()`もしくは`型名Var()`で，フラグを定義したのち，`Parse()`でそれぞれの変数を取得できます．

フラグの定義は「フラグ名」「デフォルト値」「ヘルプメッセージ」で行います．

`型名()`の場合は，指定した型へのポインタが返ってきます．

```golang
package main

import (
	"flag"
	"fmt"
)

func main() {
	var (
		i = flag.Int("int", 0, "int flag")
		s = flag.String("str", "default", "string flag")
		b = flag.Bool("bool", false, "bool flag")
	)
	flag.Parse()
	fmt.Println(*i, *s, *b)
}
```

```shell
$ go run with-flag0.go -int 2 -str hello -bool true
2 hello true
$ go run with-flag0.go
0 default false
```

`型名Var()`の場合は，引数で渡した変数に代入されます．また，適切な値を渡さないと怒られます．ダメな理由も教えてくれるので怒られがいがあります．定義していないフラグも受け付けてくれません．

```golang
package main

import (
	"flag"
	"fmt"
	"time"
)

func main() {
	var (
		d time.Duration
		f float64
	)
	flag.DurationVar(&d, "dur", 1 * time.Second, "duration flag")
	flag.Float64Var(&f, "float", 0.1, "float flag")
	flag.Parse()
	fmt.Println(d, f)
}
```

```shell
$ go run with-flag1.go -dur 1h -float 2.3
1h0m0s 2.3
$ go run with-flag1.go -float str
invalid value "str" for flag -float: strconv.ParseFloat: parsing "str": invalid syntax
Usage of /var/folders/.../with-flag1:
  -dur duration
    	duration flag (default 1s)
  -float float
    	float flag (default 0.1)
exit status 2
```

## フラグの書き方
フラグの書き方は次の2通りが可能です．

- `-flag value`
- `-flag=value`

ただし，Bool値を取得する場合は`flag=value`を使った方がいいかもしれません．というのも， **フラグの型がBool値かつ引数が続かない場合，フラグが立っただけで`true`となる**からです．

つまり，フラグを立ててBool値を取得したい場合は`-bool=true`/`-bool=false`としなければならないということです．`-bool false`では`true`となってしまいます．また`-bool false`以降の引数が全てフラグ無しで渡された引数として評価されてしまいます．注意が必要ですね．


```golang
package main

import (
	"flag"
	"fmt"
)

func main() {
	var (
		i = flag.Int("int", 0, "int flag")
		s = flag.String("str", "default", "string flag")
		b = flag.Bool("bool", false, "bool flag")
	)
	flag.Parse()
	fmt.Println(*i, *s, *b)
}
```

```shell
$ go run with-flag0.go -bool false -int 123 -str abc # falseを含むそれ以降が全て非フラグで渡されたコマンドライン引数として扱われる
0 default true 
$ go run with-flag0.go -bool=true -int 123 -str abc
123 abc true
$ go run with-flag0.go -bool=false -int 123 -str abc
123 abc false
```

ちなみに`-h`でヘルプを表示してくれます．賢いですね．

```shell
$ go run with-flag0.go -h
Usage of /var/folders/.../with-flag0:
  -bool
    	bool flag
  -int int
    	int flag
  -str string
    	string flag (default "default")
exit status 2
```

## コマンドライン引数の個数を数える
`NArg()`で非フラグなものを，`NFlag()`でフラグなものをカウントできます．

```golang
package main

import (
	"flag"
	"fmt"
)

func main() {
	flag.Int("int", 0, "int flag")
	flag.String("str", "default", "string flag")
	flag.Bool("bool", false, "bool flag")
	flag.Parse()
	fmt.Println("non flag:", flag.NArg())
	fmt.Println("flag:", flag.NFlag())
}
```

```shell
$ go run flag-test.go -int 1 -str foo -bool=true a b
non flag: 2
flag: 3
$ go run flag-test.go -int 1 -str foo -bool true a b
non flag: 3
flag: 3
$ go run flag-test.go -bool true -int 1 -str foo a b
non flag: 7
flag: 1
$ go run flag-test.go a b c -bool=true -str foo
non flag: 6
flag: 0
$ go run flag-test.go -bool=true -str foo a b c
non flag: 3
flag: 2
$ go run flag-test.go a b c
non flag: 3
flag: 0
$ go run flag-test.go -bool=true -str foo
non flag: 0
flag: 2
```