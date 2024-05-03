---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Latency vs Throughput vs Bandwidth"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-06-16T20:06:39+09:00
lastmod: 2021-06-16T20:06:39+09:00
featured: false
draft: false
image: featured.png

---

`Latency`と`Throughtput`と`Bandwidth`の違いがよく分からなかったので調べてみました．

## Latency

- Latency measures delay. Delay is simply the time taken for a data packet to reach its destination after being sent.
  - あるパケットAを地点Sから地点Tへ送ったときに何秒かかるか

- round-tripで測ることが多い
  - 「地点S -> 地点T -> 地点S」にかかる時間

- `Latency`が大きいとネットワークのパフォーマンスは悪い
  - `Latency`大 -> 一つのパケットの伝送に要する時間が大きい

## Throughput

- the amount of data able to be transmitted and received during a specific time period.
  - 一定の時間幅で送受信できるデータの量

- throughput provides a practical measurement of the actual delivery of packets.
  - 理論値ではなくて実測値

- よく使われる単位は`bits per second` = `bps`
  - もしくは`packets per second`

- `throughtput`が落ちてるとネットワーク内でパケロスが発生しているかもしれない

## Bandwidth

- the amount of data that can be transmitted and received during a specific period of time.
  - 一定の時間幅で送受信できるデータの量

- よく使われる単位は`bits per second` = `bps`
  - `gigabit per second` = `Gbps`
  - `megabit per second` = `Mbps`

- high bandwidth doesn’t necessarily guarantee optimal network performance.
  - `bandwidth`が大きいことが即座に`throughtput`が大きいことを意味するとは限らない．

- Bandwidth measures capacity, not speed.
  - 車で言うなら，「この車は時速500km出せます」は`bandwidth`

- ISPが帯域でネットワークの性能を推してくることがこの誤解を広めてしまっているという指摘．
- `bandwidth`が大きいネットワークを使えると，任意のタイミングで大きいデータを転送しようとすることができる，ということであって，その転送が瞬時に終わるということではない．

## Throughput vs Latency

- `Throughtput`と`Latency`はコインの表裏みたいなもの
- `Latency`が大きければ`Throughput`は小さい
- `Throughput`が小さければ`Latency`が大きいだろう

## Latency vs Bandwidth

- `Latency`も`Bandwidth`もネットワークの性能を測る指標
- `Latency`は土管の長さ
  - 土管が長ければデータが土管に入って抜けるまでに必要な時間が長くなる
- `Bandwidth`は土管の直径
  - 土管の直径が大きくなれば一度により多くのデータを送れる
- しばしば「`Bandwidth`が〇〇だから`Latency`が△△」
  - `Bandwidth`が大きいから`Latency`が小さい
  - `Bandwidth`が小さいから`Latency`が大きい

## Bandwidth vs Throughput

- `Bandwidth`は土管の直径
- `Throughtput`はその土管に流れている水の量
- bandwidth represents the theoretical measurement of the highest amount of data packets able to be transferred, and throughput represents the actual amount of packets successfully delivered.
- `Bandwidth`は理論値，`Throughtput`は実測値．

## refs

- https://www.dnsstuff.com/latency-throughput-bandwidth
