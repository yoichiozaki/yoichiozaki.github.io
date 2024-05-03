---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Functional Options"
subtitle: ""
summary: ""
authors: []
tags: [Golang, Functional, Functional Options, Configuration]
categories: []
date: 2020-04-02T20:43:26+09:00
lastmod: 2020-04-02T20:43:26+09:00
featured: false
draft: false
image: featured.jpeg

---

良さげな実装テクを発見したので忘れないようにメモ．

## functional optionsとは

何かを「設定」したいときにきれいに書けるAPIのお作法．何かを設定したいだけなら，色んな方法があるけど，このお作法に則ってると読みやすいし書きやすい．
読みやすくて書きやすいことは大事なので，知っておくと良い．

何かを設定する他の方法だと，例えば設定情報を表現する構造体を定義してそれをコンストラクタに渡すとか，設定のsetterを設けるとか．これらの方法だと，たくさん設定事項があるときに困ったりする．

何らかのオブジェクトを生成するとき，大抵の場合こんな感じで書く．

```
obj := New(arg0, arg1)
```

functional optionsのお作法に則って書くと

```
obj := New(arg0, arg1)
```

とも書けるし，オブジェクトの生成時に設定も一緒に仕込むなら

```
obj := New(arg0, arg1, option0, option1)
```

とも書ける．

functional optionsのお作法は，そのプログラミング言語がサポートする「任意個の引数を取る」記法を使う．この記法がサポートされてないとできないかも．英語だと，「任意個の引数を取る」という様を`variadic`と言うらしい．

具体的なコードでないと意味がよくわからないので具体的にしてみる．なんらかのサーバを想定するとわかりやすい．

```go
type Server struct {
    addr string
}

func NewServer(addr string) *Server {
    return &Server {
      addr: addr,
    }
}
```

これはまあ普通によくある書き方．では，タイムアウトの設定をしたサーバを生成するコンストラクタを書いてみよう．functional optionsのお作法に従って書くとこんな感じ．

```go
type Server struct {
    addr string
    timeout time.Duration
}

func Timeout(timeout time.Duration) func(*Server) {
    return func(s *Server) {
        s.timeout = timeout
    }
}

func NewServer(addr string, opts ...func(*Server)) *Server {
    server := &Server {
        addr: addr,
    }

    for _, opt := range opts {
        opts(server)
    }

    return server
}
```

こうやって書いてあると，このコードの利用者側はこんな感じのコードを書くことになる．

```go
// no options, use defaults
server := NewServer(":8080")

// configured to timeout after 10 seconds with address
server := NewServer(":8080", Timeout(10 * time.Second))

// configured to timeout after 10 seconds and use TLS for connection with address
server := NewServer("8080", Timeout(10 * time.Second), TLS(&TLSConfig{}))
```

なるほど，わかりやすい．これを例えばコンストラクタにたくさん引数を渡して設定するやり方でやるとこんな感じになる．

```go
server := NewServer(":8080")
server := NewServerWithTimeout(":8080", 10 * time.Second)
server := NewServerWithTimeoutAndTLS(":8080", 10 * time.Second, &TLSConfig{})
```

渡す設定によって引数が変わっちゃうのでそれに合わせたコンストラクタが必要になってしまう．これは大変．

じゃあそれらをまとめて`Config`構造体を作るぞってやると

```go
server := NewServer(":8080", Config{})
server := NewServer(":8080", Config{ Timeout: 10 * time.Second })
server := NewServer(":8080", Config{ Timeout: 10 * time.Second, TLS: &TLSConfig{} })
```

となる．まあこれでもいいんだけど，何も設定しないときに空の`Config{}`を渡さないといけないのはチョット不格好だし，何より設定事項が増えたときに読みづらくなりそう．

というわけで，**設定したいものを引数に取って，設定を「適用」していくような関数を用意する**とかっこよく書ける．

## さらに読みやすくする工夫

`func (s *Server)`に名前をつけてしまえばもっとわかりやすくなる．

```go
type Option func(s *Server)
```

こうすれば

```go
func Timeout(timeout time.Duration) Option { /*...*/ }

func NewServer(addr string, opts ...Option) *Server { /*...*/ }
```

となって，より「あ，オプション取るんだな」ってのがわかる．うれしい:smile:

こうなると複数オプションもいい感じにまとめることができそう．

```go
defaultOptions := []Option{Timeout(5 * time.Second)}

server1 := NewServer(":8080", append(defaultOptions, MaxConnections(10))...)

server2 := NewServer(":8080", append(defaultOptions, RateLimit(10, time.Minute))...)

server3 := NewServer(":8080", append(defaultOptions, Timeout(10 * time.Second))...)
```

`[]Option`をもっと賢くしたいので，

```go
func Options(opts ...Option) Option {
    return func(s *Server) {
        for _, opt := range opts {
            opt(s)
        }
    }
}
```

を用意すれば，

```go
defaultOptions := Options(Timeout(5 * time.Second))

server1 := NewServer(":8080", defaultOptions, MaxConnections(10))

server2 := NewServer(":8080", defaultOptions, RateLimit(10, time.Minute))

server3 := NewServer(":8080", defaultOptions, Timeout(10 * time.Second))
```

とできて，イイ感じ！

## `With`/`Set`

`Logger`とかも設定したいものとしてはよくある．

```go
type Logger interface {
  Info(msg string)
  Error(msg string)
}
```

とかを用意しておいて，

```go
func WithLogger(logger Logger) Option {
    return func(s *Server) {
        s.logger = logger
    }
}

NewServer(":8080", WithLogger(logger))
```

とすると，なるほどわかりやすい．

更に他の例だと，

```go
type Server struct {
    // ...

    whitelistIPs []string
}

func WithWhitelistedIP(ip string) Option {
    return func(s *Server) {
        s.whitelistIPs = append(s.whitelistIPs, ip)
    }
}

func SetWhitelistedIP(ip string) Option {
    return func(s *Server) {
        s.whitelistIPs = []string{ip}
    }
}

NewServer(
    ":8080",
    WithWhitelistedIP("10.0.0.0/8"),
    WithWhitelistedIP("172.16.0.0/12"),
    SetWhitelistedIP("192.168.0.0/16"), // overwrites any previous values
)
```

`With`は「追加」で，`Set`は「上書き」という雰囲気．

`Option`型の関数を返す関数を用意することで，特定の設定のプリセットみたいなものを定義できてこれまた便利．

## `Config`構造体との掛け合わせ

`Config`構造体を用意して，`Config`構造体を引数に取る`Option`型の関数としてもいい．たくさんある設定を`Config`という一つの場所に閉じ込められるので，設定事項がめちゃめちゃある場合には便利．

```go
type Config struct {
    Timeout time.Duration
}

type Option func(c *Config)

type Server struct {
    // ...

    config Config
}
```

```go
config := Config{
    Timeout: 10 * time.Second
    // ...
    // lots of other options
}

NewServer(":8080", WithConfig(config), WithTimeout(20 * time.Second))
```

## `Option`を関数型ではなくてinterfaceとしてさらに柔軟に設定を受け入れる

`Option`をinterfaceにしてしまえば，もっといろんな設定を受け入れられるようになる．

```go
// Option configures a Server.
type Option interface {
    // apply is unexported,
    // so only the current package can implement this interface.
    apply(s *Server)
}

// Timeout configures a maximum length of idle connection in Server.
type Timeout time.Duration

func (t Timeout) apply(s *Server) {
    s.timeout = time.Duration(t)
}

// Options turns a list of Option instances into an Option.
type Options []Option

func (o Options) apply(s *Server) {
    for _, opt := range o {
        o.apply(s)
    }
}

type Config struct {
    Timeout time.Duration
}

func (c Config) apply(s *Server) {
    s.config = c
}
```

## Futher readings

- <https://sagikazarmark.hu/blog/functional-options-on-steroids/>

- <https://dave.cheney.net/2014/10/17/functional-options-for-friendly-apis>

- <https://commandcenter.blogspot.com/2014/01/self-referential-functions-and-design.html>

- <https://www.sohamkamani.com/blog/golang/options-pattern/>

- <https://www.calhoun.io/using-functional-options-instead-of-method-chaining-in-go/>
