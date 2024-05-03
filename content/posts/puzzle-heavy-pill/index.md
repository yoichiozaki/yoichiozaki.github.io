---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Puzzle: Heavy Pill"
subtitle: ""
summary: ""
authors: []
tags: [puzzle]
categories: []
date: 2020-12-17T17:30:43+09:00
lastmod: 2020-12-17T17:30:43+09:00
featured: false
draft: false


---

## The heavy pill

ref: https://www.geeksforgeeks.org/puzzle-10-identical-bottles-pills/

目の前に 10 種類の錠剤の瓶が置かれている．それぞれの瓶には十分な量の錠剤が入っている．各瓶には番号が振られており，それぞれ`1`/`2`/`3`/`4`/`5`/`6`/`7`/`8`/`9`/`10`である．これらの錠剤のうち，ある一つの瓶に含まれている錠剤は重さが 1.1g で他の錠剤は 1g である．測りを 1 回だけ用いて「どの瓶に含まれる錠剤が重さ 1.1g の錠剤であるか」を求めたい．どのようにすればよいだろうか．

---

> $i = 1, 2, ..., 9, 10$に対して，瓶$i$から$i$粒の錠剤を取り出し測りに載せる．測りの指す合計重量$X$を読み取る．番号$(X-55)/0.1$の瓶が 1.1g の錠剤の瓶である．
