---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "情報セキュリティの構成要素"
subtitle: "暗号技術学習メモ #0"
summary: "暗号技術学習メモ #0"
authors: []
tags: [Security, Memo]
categories: []
date: 2019-10-28T11:54:27+09:00
lastmod: 2019-10-28T11:54:27+09:00
featured: false
draft: false


---

## 情報セキュリティの構成要素
「情報セキュリティ」の言葉の指し示す意味範囲は[OECDの情報セキュリティガイドライン](oecd.org/internet/ieconomy/15582260.pdf)やISO/IEC TR13335[^1]として国際的に定義されている．

[^1]: 正確には企業のセキュリティリスクを査定する際のガイドラインを定めたものになっている．通称GMITS（Guidelines for the Management for IT Security）

ISO/IEC TR13335にて情報セキュリティとは下記6要素のことを指すとされている．

- 機密性 Confidentiality
- 完全性 Integrity
- 可用性 Availability
- 責任追跡性 Accountability
- 真正性 Authenticity
- 信頼性 Reliability

### 機密性 Confidentiality
- 意味
	- 意図した相手以外に情報が漏れないこと
- リスク
	- 盗聴や内部からの情報漏洩
- 対策
	- 暗号技術

### 完全性 Integrity
- 意味
	- 情報が正確であること
- リスク
	- 情報の改ざん，ノイズによるビット反転・ビットの欠落
- 対策
	- 誤り訂正符号，ハッシュ関数，メッセージ認証コード，デジタル署名

### 可用性 Availability
- 意味
	- ある情報にアクセスすることが許されている主体が，任意の時点で情報にアクセスすることができること
- リスク
	- システムへの過負荷，災害，意図しないロック
- 対策
	- システムの多重化，クラウド化，負荷分散

### 責任追跡性 Accountability
- 意味
	- ユーザやシステムの振る舞いについて説明が可能であること
- リスク
	- ログの改ざん，否認
- 対策
	- ロギング，デジタル署名（否認防止）

### 真正性 Authenticity
- 意味
	- 観測されるユーザやシステムの振る舞いが，その主体によるものであること（なりすましではない）
- リスク
	- なりすまし
- 対策
	- 認証，デジタル署名（なりすまし防止）

### 信頼性 Reliability
- 意味
	- システムが一貫して動作すること
- リスク
	- 盗聴や内部からの情報漏洩
- 対策
	- システムの多重化，負荷の監視