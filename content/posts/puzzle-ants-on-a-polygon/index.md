---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Puzzle: Ants on a Polygon"
subtitle: ""
summary: ""
authors: []
tags: [Puzzle]
categories: []
date: 2020-12-17T17:46:30+09:00
lastmod: 2020-12-17T17:46:30+09:00
featured: false
draft: false


---

## Ants on a Polygon

ref: https://www.geeksforgeeks.org/puzzle-21-3-ants-and-triangle/

$n$角形の拡張点に 🐜 がいる．私の掛け声で 🐜 は一斉にどちらかの辺を選んで歩き出す．🐜 が辺上で衝突する確率を求めよ．

---

> $n$匹の 🐜 が全部同じ方向を選べば衝突はしない．すべての 🐜 が時計回りの枝を選ぶ確率は
>
> $$
> \frac{1}{2^n}
> $$
>
> 同じように，すべての 🐜 が反時計回りの枝を選ぶ確率は
>
> $$
> \frac{1}{2^n}
> $$
>
> すべての 🐜 が同じ方向を選ぶ確率は
>
> $$
> 2 \times \frac{1}{2^n} = \frac{1}{2^{n-1}}
> $$
>
> よって衝突する確率は
>
> $$
> 1 - \frac{1}{2^{n-1}}
> $$
