---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Path Parameter, Query Parameter, Request Body"
subtitle: ""
summary: ""
authors: []
tags: [API, REST]
categories: []
date: 2021-07-26T15:21:02+09:00
lastmod: 2021-07-26T15:21:02+09:00
featured: false
draft: false


---

Path Parameter，Query Parameter，Request Bodyの使い分け．

## Path Parameter

- あるリソースを識別するのに必要な情報

- 例：`GET posts/1`：1本目のブログ投稿
- 例：`GET users/1`：1人目のユーザ

## Query Parameter

- あるリソースに対する操作を通じてデータを取得するのに必要な情報
  - 「リソースに対する操作」とは例えばソートするとか検索するとか範囲を絞るとか
  - 検索・フィルタの条件

- 例：`GET groups/2?sort=true&limit=20`
  - グループをソートして上位20件を取得

- 例：`https://www.google.com/search?q=google`
  - 検索クエリ

## Request Body

- あるリソースに対する追加・更新に必要な情報
  - 追加・更新する内容自体

## フローチャート

```
if パラメタが「一意にリソースを特定する識別子」:
    PathParameter
elif パラメタが「リソースのソート・フィルタリング・検索などの条件」:
    QueryParameter
elif パラメタが「リソースに対する追加・更新の情報」:
    RequestBody
```

認証情報とかメタデータだとどうするみたいな話もあるが今はとりあえず割愛．

## Refs

- https://tools.ietf.org/html/rfc7231
- https://qiita.com/sakuraya/items/6f1030279a747bcce648
- https://qiita.com/Shokorep/items/b7697a146cbb1c3e9f0b