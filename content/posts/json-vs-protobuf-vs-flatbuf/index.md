---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Data Serializationのさまざま"
subtitle: "XML v.s. JSON v.s. BSON v.s. Protocol Buffers v.s. Flat Buffers"
summary: "聞いたことのあるシリアライゼーション形式について調べてみました"
authors: []
tags: [XML, JSON, ProtoBuf, FlatBuf, Data Serializing]
categories: []
date: 2019-11-04T01:03:05+09:00
lastmod: 2019-11-04T01:03:05+09:00
featured: false
draft: false


---

![通信し合うサーバーたち](communication.gif)

## データのserialization/deserialization
イマドキのソフトウェアは，機能ごとにプログラムを整理整頓して，それらが情報をやりとりしながらサービスを提供します．システムを構成するコンポーネント間でメッセージングをしなければならず，その際にやりとりするデータについて「どういう表現であるのか」について共有しておかないといけません．人間の会話で言うならば「何語を喋るか」に近いのかな．

「どんな形式でデータを表現するか」についてはいくつかの形式が提案されていて，それぞれについて一長一短がある．代表的なのはXML，JSON，BSON，Protocol Buffers，FlatBuffers．他にもいろいろあります．

## XML
XMLとは「e**X**tended **M**arkdown **L**anguage」の略で，文章の電子化に源流があるデータ形式．前提に「文章のデジタル化」があるので，XMLの仕様にはデータの「型」が定義されていません．

```xml
<?xml version="1.0" encoding="UTF-8"?>
<breakfast_menu>
<food>
	<name>Belgian Waffles</name>
	<price>$5.95</price>
	<description>
		Two of our famous Belgian Waffles with plenty of real maple syrup
	</description>
	<calories>650</calories>
</food>
<food>
	<name>Strawberry Belgian Waffles</name>
	<price>$7.95</price>
	<description>
		Light Belgian waffles covered with strawberries and whipped cream
	</description>
	<calories>900</calories>
</food>
</breakfast_menu>
```

XMLは文章のデジタル化が前提にあるので，HTMLみたいな見た目になっています．

XMLの特徴として「XMLはself-describingである」と評されることが多くあります．これは「**データ自体の構造がデータそのものに表現されている**」ということです．つまり事前に通信の両端でやり取りするデータの方についての合意をとっていなくても（やり取りするデータを眺めれば）データの齟齬のない解釈が可能であるということです．JSONだとこれはできません．XMLはタグだけをみることで，そのデータの構造を即座に読み取ることができます．JSONでは，タグに相当するものをハッシュのキーとして表現すればできないわけではないが，それはデータの型を表現したわけではなくて，ハッシュを用いて似たようなデータ型を表現しただけです．

XMLで記述されたデータはそれ自身のメタな構造をも表現しているという点が分散システムにおけるデータのやり取りで非常に有用なので，古くからよく使われています．

## JSON
JSONとは「**J**ava**S**cript **O**bject **N**otation」の略．JSONをシステム間のデータの表現形式として用いると「JavaScriptでのデータのリテラルな表現をそのままシステム間のデータ表現形式」として用いることになって，webな世界だとJavaScriptのインタプリタでそのまま処理できるので扱いやすくてよく用いられがち．しかも，JSONは人間にとってもパッと見でデータの構造が把握しやすくて人気が出ました．それなりに古参なデータ形式ですが，現在もバリバリの現役です．視認性が良いのがやっぱり人気の理由なんですかね．デバッグしやすいし．

JSONは「プログラミング言語におけるデータのリテラル表現」が出所なので，仕様として「型」が含まれていて，扱いやすいです．「型」が仕様として存在しているので「空の値」を型ごとに区別することができます．

```json
{
	"null": null,
	"string": "",
	"array": [],
	"dict": {}
}
```

JSONは，こんなにシステム間で情報をやりとりする際のデータ形式として用いられるようになることを全然想定していなかったので，扱いづらさがあったりするらしい．僕は具体的に表現することができないが「古臭い」なんて言われることもあります．

「どういうフィールドを持ったJSONデータを扱うのか」について通信の両端点で合意しておく必要があるのはもちろんですが，JSONのデータ形式はスキーマを直接的に表現しているわけではない（つまりインタフェースをJSONが規定しているわけではない）という認識も大事だと思います．そのままのJSONはただのデータ形式に過ぎなくて，スキーマ言語としての「データ型を定義する」というメタな機能はないということです．

JSONなどでも「JSONでJSONのスキーマを書いてしまおう」という[JSON Schema](https://json-schema.org/)なるものが存在しているそうですが，やっぱりだいぶ書きにくそうです．

```json
{
	"productId": 1,
	"productName": "An ice sculpture",
	"price": 12.50,
	"tags": [ "cold", "ice" ],
	"dimensions": {
		"length": 7.0,
		"width": 12.0,
		"height": 9.5
	},
 	"warehouseLocation": {
		"latitude": -78.75,
		"longitude": 20.4
	}
}
```

というスキーマをJSONで書くと

```json
{
	"$schema": "http://json-schema.org/draft-07/schema#",
	"$id": "http://example.com/product.schema.json",
	"title": "Product",
	"description": "A product from Acme's catalog",
	"type": "object",
	"properties": {
		"productId": {
			"description": "The unique identifier for a product",
			"type": "integer"
		},
		"productName": {
			"description": "Name of the product",
			"type": "string"
		},
		"price": {
			"description": "The price of the product",
			"type": "number",
			"exclusiveMinimum": 0
		},
		"tags": {
			"description": "Tags for the product",
			"type": "array",
			"items": {
				"type": "string"
			},
			"minItems": 1,
			"uniqueItems": true
		},
		"dimensions": {
			"type": "object",
			"properties": {
				"length": {
					"type": "number"
				},
				"width": {
		    		"type": "number"
				},
				"height": {
					"type": "number"
				}
			},
			"required": [ "length", "width", "height" ]
		},
		"warehouseLocation": {
			"description": "Coordinates of the warehouse where the product is located.",
			"$ref": "https://example.com/geographical-location.schema.json"
		}
	},
	"required": [ "productId", "productName", "price" ]
}
```

:thinking_face: ﾁｮｯﾄﾐﾆｸｲ...


## BSON
JSONはテキストベース（つまりシリアライズ・デシリアライズの際に扱われるデータの単位がbitじゃなくてbyte）でしたが，それを改めたBSON = **B**inary J**SON**というのも存在します．つまりBSONではデータがバイナリベース（つまりシリアライズ・デシリアライズの際に扱われるデータの大きさの単位がbit）になっています．BSONは後述するProtocol Buffersとよく似ていて，度々比較されています．公式によると，

> **Lightweight**
> 
> - Keep­ing spa­tial over­head to a min­im­um is im­port­ant for any data rep­res­ent­a­tion format, es­pe­cially when used over the net­work.
> 
> **Traversable**
> 
> - BSON is de­signed to be tra­versed eas­ily. This is a vi­tal prop­erty in its role as the primary data rep­res­ent­a­tion for Mon­goDB.
> 
> **Efficient**
> 
> - En­cod­ing data to BSON and de­cod­ing from BSON can be per­formed very quickly in most lan­guages due to the use of C data types.

という特徴があります．

BSONは，Protocol Buffersと比較して

> more "schema-less"

であるとされています．つまり，サービス間のインタフェースの仕様そのものとやりとりするデータ形式の関係性が（Protocol Buffersと比較して）疎で，より柔軟性があるということです．一方で，BSONはProtocol Buffersと比べてメッセージのフィールド名のエンコードに関してやや冗長であるとされています．

MongoDBがBSONをデータの表現方式として採用しているのが興味深いですね．多くの主要言語でBSONのエンコード・デコードをサポートするライブラリが実装されていて手軽に使えそうな印象です．ただ，バイナリベースということもあって，BSONをそのまま眺めても人間には意味がわからないので，デバッグはちょっと大変なのかもしれませんね．

例えば`{"hello": "world"}`をBSONでエンコードすると以下のようになります．

```
  \x16\x00\x00\x00                   // total document size
  \x02                               // 0x02 = type String
  hello\x00                          // field name
  \x06\x00\x00\x00world\x00          // field value
  \x00                               // 0x00 = type EOO ('end of object')

```

## Protocol Buffers
Protocol BuffersはGoogleが社内のシステム間で情報をやりとりする際に用いていたデータ形式で2008年にオープンソース化されました．Googleが出している公式のドキュメントによれば

> Protocol buffers are a flexible, efficient, automated mechanism for serializing structured data – think XML, but smaller, faster, and simpler.

ということらしいです．Protocol Buffersはシステム間で情報をやりとりする際に用いるデータ形式の一種なんですが，それは嘘じゃないんですけど，Protocol Buffersの指す意味範囲はそれだけにとどまらず，サービス間のインタフェースを定義するスキーマ言語としての顔もあるのが特徴です．もっというと，このスキーマ言語が優秀であるというのがProtocol Buffersの人気を大きく支えている理由なのだと思います．「Protocol Buffersがスキーマ言語である」というのはどういうことかというと，Protocol Buffersでは「システムのインタフェース（つまり，どんな型のデータをやりとりするのか）を定義する独自言語」であるということです．

```protobuf
syntax = "proto3";
package example.protobuf;

message SimpleMessage {
	message HeaderItem {
		string name = 1;
		string value = 2;
	}
	enum Type {
		START = 0;
		BLOB = 1;
		END = 2;
	}

	uint64 id = 1;
	Type message_type = 2;
	repeated HeaderItem headers = 3;
	bytes blob = 4; 
}
```
Protocol Buffersは，サービス間でやりとりするデータの型を表現する独自言語とともに，その独自言語で記述されたインタフェースを特定の言語にコンパイルするツールまでもが同梱されています．

スキーマ言語が存在すると，非常に便利です．モダンなソフトウェアシステムでは，いろんなところにデータが保存されているかもしれないし，バックエンドで動いているサーバーもいくつかあるかもしれないし，もはやそれが普通になってきています．となると，システムの中のありとあらゆる場所でデータのシリアライズ・デシリアライズをしなければならないし，通信している両者でデータの解釈に矛盾が発生しないように整える必要があります．スキーマ言語があると，この「整える作業」がとてもやりやすくなります．自然言語と違って，スキーマ言語では解釈に差異が発生しないからです．「管理者が一人」みたいなシステムでは，スキーマ言語なんてたいそうなものを持ち出してくる必要はないと思うんですけど，webみたいな自律分散的な系だと，ますますスキーマ言語としてのProtocol Buffersの良さが際立ってくるわけです．

Protocol Buffersのスキーマ言語としての良さは，その簡潔さではないでしょうか．プログラムを書く人間にとっては，特に難しいことを考えずに意図が汲み取れる程度の決まりごとしかないし，スキーマ言語としてプログラミング言語から独立している点も，ツールの作りやすさとかに影響していて，Protocol Buffersが人気な理由なんだと思います．

Protocol Buffersでは，`.proto`ファイルとしてサービスインタフェースを記述します．

```protobuf
message Person {
	required string name = 1;
	required int32 id = 2;
	optional string email = 3;

	enum PhoneType {
		MOBILE = 0;
		HOME = 1;
		WORK = 2;
	}

	message PhoneNumber {
		required string number = 1;
		optional PhoneType type = 2 [default = HOME];
	}

	repeated PhoneNumber phone = 4;
}
```

明確なサービスインタフェースをコンパイラによって適切に所望の言語のプログラムに変換してくれるので，開発を進めやすくなります．

Protocol Buffersではサービスのインタフェースの変更に対して後方互換性を維持した形でメッセージのやり取りをできるように「未知なフィールドに遭遇したら無視する」ということになっています．こうすれば，サービスのインタフェースが更新されたとしても，既存のプログラムは動くことには動くことになります．

Protocol Buffersの公式のドキュメントでは，XMLと比較して

> Protocol buffers
> 
> - are simpler
> - are 3 to 10 times smaller
> - are 20 to 100 times faster
> - are less ambiguous
> - generate data access classes that are easier to use programmatically

と主張しています．確かにXMLはいちいちタグで括らなきゃいけないしProtocol Buffersは効率が良さそうです．

Protocol Buffersのデフォルトのシリアライズはバイナリベースです．人間が眺めて構造が取れるような見た目にはなっていません．しかしProtocol Buffersはシリアライズのフォーマットとして様々な形式（例えばJSONなど）も扱えるように周辺ツールが充実しているので，「スキーマ言語としてのProtocol Buffersでサービスのインフェースを記述して，実際にやり取りするデータはJSON」ということも可能になっています．

## Flat Buffers
これもGoogleによってオープンソース化されたデータのシリアライズ・デシリアライズ方式．公式によれば，

> - Access to serialized data without parsing/unpacking
> - Memory efficiency and speed
> - Flexible
> - Tiny code footprint
> - Strongly typed
> - Convenient to use
> - Cross platform code with no dependencies

という特徴があります．面白いのが「Access to serialized data without parsing/unpacking」ってところですね．FlatBuffersでは階層構造を持つデータを，パースすることなく直接扱うことができるらしいです．

Protocol Buffersの進化系として自らを位置づけていて，Flat Buffersではデータをパースする必要がないのでProtocol Buffersと比較してコード量が桁違いで削減できて，さらにFlat BuffersではProtocol Buffersより強力に型をサポートしているところが進化ポイントですね．white paperのmotivationの章には

> In particular, FlatBuffers focus is on mobile hardware (where memory size and memory bandwidth is even more constrained than on desktop hardware), and applications that have the highest performance needs: games.

とあり，シリアライズの効率について高水準なものが求められる状況で用いられることが想定されているそうです．

Facebookで用いられているらしいですが，Protocol Buffersの人気に押されて，あまり流行っている感じはしないんですがどうなんでしょうか．

## Ref
### XML
- hoge
- hoge

### JSON
- [What is JSON - W3Schools](https://www.w3schools.com/whatis/whatis_json.asp)
- [JSON Introduction - W3Schools](https://www.w3schools.com/js/js_json_intro.asp)
- [JSON Schema](https://json-schema.org/)

### BSON
- [BSON](http://bsonspec.org/)

### Protocol Buffers
- [Protocol Buffers](https://developers.google.com/protocol-buffers)

### Flat Buffers
- [Flat Buffers](https://google.github.io/flatbuffers/)