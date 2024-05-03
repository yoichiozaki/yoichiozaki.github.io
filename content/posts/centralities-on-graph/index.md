---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Centralities on Graph"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-05-18T22:13:18+09:00
lastmod: 2021-05-18T22:13:18+09:00
featured: false
draft: false
---

## 中心性とは

グラフ理論における頂点の中心性とは，その頂点のグラフのトポロジ観点での「重要度」．トポロジ観点とは，そのグラフの頂点や辺の意味とは無関係で，ただ純粋にグラフの形によってのみ依存するという意味．ソーシャルネットワーク上の影響力のある人物とか疫病のスーパースプレッダーを見つけたりするなどの応用ができる．これらの応用では「グラフ上のトポロジ的に重要な頂点は，意味においても特別である」という前提を置いていている．グラフの「中心」の定義は様々あり，それらに対応して「中心らしさ」の定義も様々ある．代表的な中心性指標を取り上げて記載する．

以下，グラフの図示には `networkx` / `matplotlib` などを使う．

```python
# import libraries
import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

# drawing function
def draw(G, pos, measures, measure_name):
    normalized_measures = dict()
    s = sum(measures.values())
    for key, value in measures.items():
        normalized_measures[key] = value / s
    nodes = nx.draw_networkx_nodes(G, pos,
                                   cmap=plt.cm.plasma,
                                   node_size=list(value * 4000 for value in normalized_measures.values()),
                                   node_color=list(normalized_measures.values()),
                                   nodelist=normalized_measures.keys())
    nodes.set_norm(mcolors.SymLogNorm(linthresh=0.01, linscale=1, base=10))
    labels = nx.draw_networkx_labels(G, pos)
    edges = nx.draw_networkx_edges(G, pos)

    plt.title(measure_name)
    plt.colorbar(nodes)
    plt.axis("off")
    plt.show()

# example graph
G = nx.karate_club_graph()
pos = nx.spring_layout(G, seed=42)

# example directed graph
# - this graph is same as one in https://en.wikipedia.org/wiki/PageRank
DiG = nx.DiGraph()
DiG.add_edges_from([(2, 3), (3, 2), (4, 1), (4, 2), (5, 2), (5, 4),
                    (5, 6), (6, 2), (6, 5), (7, 2), (7, 5), (8, 2),
                    (8, 5), (9, 2), (9, 5), (10, 5), (11, 5)])
dpos = {1: [0.1, 0.9], 2: [0.4, 0.8], 3: [0.8, 0.9], 4: [0.15, 0.55],
        5: [0.5,  0.5], 6: [0.8,  0.5], 7: [0.22, 0.3], 8: [0.30, 0.27],
        9: [0.38, 0.24], 10: [0.7,  0.3], 11: [0.75, 0.35]}
```

## Degree Centrality：次数中心性

頂点に生えている辺の本数が多ければ多いほどその頂点は重要であるという中心性．有向グラフに対しては入次数中心性と出次数中心性が計算できる．

```python
draw(G, pos, nx.degree_centrality(G), "Degree Centrality")
```

{{< figure src="./degree-centrality.png" title="" lightbox="false" >}}

## Eigenvector Centrality：固有ベクトル中心性

「重要な頂点と隣接している頂点ほど重要」であるとする中心性．頂点$i$の固有ベクトル中心性$x_i$は

$$
x_i = \sum_{j}A_{ij}x_j
$$

ただし$A$はグラフ$G$の隣接行列表現．これを全頂点についてまとめて書くと

$$
Ax = \lambda x
$$

の解$x$と書ける．ここで$\lambda$が$A$の固有値，$x$が固有ベクトル．固有ベクトル中心性は絶対値が最大な固有値に対応する第一固有ベクトルを中心性として扱う．固有ベクトルの$i$行目成分が頂点$i$の固有ベクトル中心性．

固有ベクトル中心性は次数中心性の拡張とも言える．次数中心性では隣接頂点をすべて平等に扱っているが，固有ベクトル中心性では，より重要な隣接頂点の寄与をより大きく採用する．

有向グラフに対する固有ベクトル中心性では，入次数が0な頂点は無視されることになるという問題がある．

```python
draw(G, pos, nx.eigenvector_centrality(G), "Eigenvector Centrality")
```

{{< figure src="./eigenvector-centrality.png" title="" lightbox="false" >}}

- [Phillip Bonacich. “Power and Centrality: A Family of Measures.” American Journal of Sociology 92(5):1170–1182, 1986](http://www.leonidzhukov.net/hse/2014/socialnetworks/papers/Bonacich-Centrality.pdf)
- [Mark E. J. Newman. Networks: An Introduction. Oxford University Press, USA, 2010, pp. 169](https://www.amazon.co.jp/dp/0199206651)


## Katz Centrality：カッツ中心性

入次数0の頂点の扱いを工夫した固有ベクトル中心性．初期値として全ての頂点の中心性として小さい値$\beta$を与える．

$$
x_i = \alpha \sum_{j}A_{ij}x_{j} + \beta
$$

これを全頂点についてまとめて記述すると

$$
x = \alpha Ax + \beta 1
$$

の解$x$が全頂点の中心性になっている．パラメタ$\alpha$で隣接頂点の重要度をどの程度自分の重要度に考慮するかを調整する．

```python
draw(G, pos, nx.katz_centrality(G, alpha=0.1, beta=1.0), "Katz Centrality")
```

{{< figure src="./katz-centrality.png" title="" lightbox="false" >}}

```python
draw(DiG, dpos, nx.katz_centrality(DiG, alpha=0.1, beta=1.0), "Katz Centrality (Directed Graph)")
```

{{< figure src="./katz-centrality-directed.png" title="" lightbox="false" >}}

- [Leo Katz: A New Status Index Derived from Sociometric Index. Psychometrika 18(1):39–43, 1953](http://phya.snu.ac.kr/~dkim/PRL87278701.pdf)

## PageRank

Katz中心性を拡張したもの．

$$
x_i = \alpha \sum_{j}A_{ij}\frac{x_j}{k_{j}^{out}} + \beta
$$

全頂点についてまとめてかくと

$$
x = \alpha AD^{-1}x + \beta 1
$$

ただし，$D$は対角行列で$D_{ii} = max(k_{i}^{out}, 1)$

低出次数の頂点はより大きく隣接する頂点の重要度に寄与する．

グラフ上をRandom Walkするときの定常状態における各頂点での滞在確率に等しくなる．

```python
draw(G, pos, nx.pagerank(G), "PageRank")
```

{{< figure src="./pagerank.png" title="" lightbox="false" >}}

```python
draw(DiG, dpos, nx.pagerank(DiG), "PageRank (Directed Graph)")
```

{{< figure src="./pagerank-directed.png" title="" lightbox="false" >}}

- [Page, Lawrence; Brin, Sergey; Motwani, Rajeev and Winograd, Terry, The PageRank citation ranking: Bringing order to the Web. 1999](http://dbpubs.stanford.edu:8090/pub/showDoc.Fulltext?lang=en&doc=1999-66&format=pdf)

## HITS

「重要度にも二種類あるよね」という発想から生まれた中心性．グラフの「中心」にはいないけど重要な頂点だってあるじゃないか，ならばそいつらも捉えたいというのがHITS．例えば，サーベイ論文は「重要な論文」へのリンクを大量に含んでいるという意味で重要だけれど，サーベイ論文自体に新規性があるわけではないので，そこから新しい派生研究が出てくる訳ではないという意味で重要ではない．

HITSでは重要な頂点の分類を与える．

- `Authorities`：`Hubs`からたくさん引用される頂点
- `Hubs`：`Authorities`をたくさん引用する頂点

`Authorities`がエポックメイキングな論文で，`Hubs`がサーベイ論文という感じ．

再帰的な定義になっている．頂点$i$の`Authority Centrality`を$x_i$，`Hub Centrality`を$y_i$とすると

$$
x_i = \alpha \sum_{j}A_{ij}y_j
$$

$$
y_i = \beta \sum_{j}A_{ji}x_j
$$

全頂点についてまとめて書くと

$$
x = \alpha A y
$$

$$
y = \beta A^{T} x
$$

```python
hub, authority = nx.hits(DiG)
draw(DiG, dpos, hub, 'HITS Hubs (Directed Graph)')
draw(DiG, dpos, authority, 'HITS Authorities (Directed Graph)')
```

{{< figure src="./hub.png" title="" lightbox="false" >}}

{{< figure src="./authority.png" title="" lightbox="false" >}}


- [Jon Kleinberg, Authoritative sources in a hyperlinked environment Journal of the ACM 46 (5): 604-32, 1999. doi:10.1145/324133.324140](http://www.cs.cornell.edu/home/kleinber/auth.pdf)
- [A. Langville and C. Meyer, “A survey of eigenvector methods of web information retrieval.”](http://citeseer.ist.psu.edu/713792.html)

## Closeness Centrality：近接中心性

頂点$i$から他の全頂点への最短経路長の平均の逆数で中心性としたもの．中心な頂点ほど周りの頂点に近い．「なんとなくみんなにリーチしやすい人」はその集団の中心にいそう．

$$
x_i = \frac{1}{l_i} = \frac{n}{\sum_{j}d_{ij}}
$$

ただし，$l_i = \frac{\sum_{j}d_{ij}}{n}$で，$d_{ij}$は頂点$i$と頂点$j$の最短経路長．

```python
draw(G, pos, nx.closeness_centrality(G), "Closeness Centrality")
```

{{< figure src="./closeness-centrality.png" title="" lightbox="false" >}}

- [Linton C. Freeman: Centrality in networks: I. Conceptual clarification. Social Networks 1:215-239, 1979.](http://leonidzhukov.ru/hse/2013/socialnetworks/papers/freeman79-centrality.pdf)

## Current Flow Closeness (a.k.a Information Centrality)：情報中心性

近接中心性の派生．グラフ上を伝って伝播していく情報に注目した中心性．頂点$i$と頂点$j$を繋ぐ経路上を流れる情報が，経路長の逆数に比例して分散するとしたときの各頂点で得られる情報量の調和平均．伝言ゲームで「より正確なことを聞ける人」は中心にいそう．

```python
draw(G, pos, nx.current_flow_closeness_centrality(G), "Current Flow Closeness Centrality a.k.a Information Centrality")
```

{{< figure src="./information-centrality.png" title="" lightbox="false" >}}

- [Ulrik Brandes and Daniel Fleischer, Centrality Measures Based on Current Flow. Proc. 22nd Symp. Theoretical Aspects of Computer Science (STACS ‘05). LNCS 3404, pp. 533-544. Springer-Verlag, 2005.](http://algo.uni-konstanz.de/publications/bf-cmbcf-05.pdf)
- [Karen Stephenson and Marvin Zelen: Rethinking centrality: Methods and examples. Social Networks 11(1):1-37, 1989.](https://doi.org/10.1016/0378-8733(89)90016-6)
  - 情報中心性として提案

## Betweenness Centrality：媒介中心性

任意の頂点対$(s, t)$の最短経路のうち，頂点$i$を通過する最短経路はどのくらいあるか，を中心性として採用したもの．ここからあそこまで行くのにあの頂点をとらないといけないというとき，その頂点はネットワーク上での伝達を考えたときの要衝であると言えそう．ソーシャルネットワークであれば，異なる集団を繋ぐキーパーソンだと媒介中心性は大きい．

$$
x_i = \sum_{s, t \in V} \frac{\sigma (s, t | i)}{\sigma (s, t)}
$$

ただし，$\sigma(s, t)$は頂点$s$と$t$の最短経路数，$\sigma(s, t | i)$はそれらのうち頂点$i$を経由する経路数．

大規模なグラフに対してBrandesが提案するアルゴリズムで厳密な媒介中心性は$O(nm)$で計算できるが，頂点数が100万を超えてくるグラフには難しい．近年では近似値を高速に求めるというところが盛んに研究されている．

```python
draw(G, pos, nx.betweenness_centrality(G), "Betweenness Centrality")
```

{{< figure src="./betweenncess-centrality.png" title="" lightbox="false" >}}


- [Ulrik Brandes: A Faster Algorithm for Betweenness Centrality. Journal of Mathematical Sociology 25(2):163-177, 2001.](http://www.inf.uni-konstanz.de/algo/publications/b-fabc-01.pdf)
- [Ulrik Brandes: On Variants of Shortest-Path Betweenness Centrality and their Generic Computation. Social Networks 30(2):136-145, 2008.](http://www.inf.uni-konstanz.de/algo/publications/b-vspbc-08.pdf)
- [Linton C. Freeman: A set of measures of centrality based on betweenness. Sociometry 40: 35–41, 1977](http://moreno.ss.uci.edu/23.pdf)


## Current Flow Betweenness (a.k.a Random Walk Betweenness Centrality)

媒介中心性では，情報が最短経路上を伝播することを仮定しているが，それを緩めて，頂点間最短経路のみならず，すべての経路上を伝播するとして，その中でも経路長が短いものの寄与をより重視する中心性として提案された．媒介中心性の拡張．歴史的にはCurrent Flow Betweennessが直感に反する場合があることをNewmanが示して，代替案としてRandom Walk Betweenness Centralityを提案した．

頂点$i$のRandom Walk Betweennessは，頂点$p$から出発して頂点$q$で終了するRandom Walkがその途中で頂点$i$を通過する回数を全ての頂点対$(p, q)$で平均したものとして定義される．情報がRandom Walkするとき，何回も訪問する頂点はきっと重要．

```python
draw(G, pos, nx.current_flow_betweenness_centrality(G), "Current Flow Betweenness Centrality a.k.a Random Walk Centrality")
```

{{< figure src="./random-walk-centrality.png" title="" lightbox="false" >}}

- [Centrality Measures Based on Current Flow. Ulrik Brandes and Daniel Fleischer, Proc. 22nd Symp. Theoretical Aspects of Computer Science (STACS ‘05). LNCS 3404, pp. 533-544. Springer-Verlag, 2005.](http://algo.uni-konstanz.de/publications/bf-cmbcf-05.pdf)
- [A measure of betweenness centrality based on random walks, M. E. J. Newman, Social Networks 27, 39-54 (2005).](https://arxiv.org/pdf/cond-mat/0309045.pdf)

## Communicability Betweenness

Betweenness CentralityとRandom Walk Betweenness Centralityの中間にあるような中心性．頂点$i$のCommunicability Betweennessは，頂点$p$から出発して頂点$q$で終了するRandom Walkがその途中で頂点$i$を通過する回数を全ての頂点対$(p, q)$とその経路長で加重平均したもの．

```python
draw(G, pos, nx.communicability_betweenness_centrality(G), "Communicability Betweenness Centrality")
```
{{< figure src="./communicability-centrality.png" title="" lightbox="false" >}}

- [Ernesto Estrada, Desmond J. Higham, Naomichi Hatano, “Communicability Betweenness in Complex Networks” Physica A 388 (2009) 764-774.](https://arxiv.org/abs/0905.4102)

## Power Centrality：ボナチッチ中心性・パワー中心性

重要な頂点と繋がっている頂点は重要では **ない** とする中心性．[このブログ](https://tjo.hatenablog.com/entry/2015/12/09/190000)によると『[ネットワーク分析](https://www.amazon.co.jp/dp/4320019288)』という本に

> 例えば、商取引のネットワークを考えてみよう。頂点は企業や個人など取引の主体であり、辺（ここではとりあえず無向辺とする）は取引関係を表す。ここで次数の高い頂点は、数多くの取引先を持つ主体である。取引先を他より多くもつ主体は、取引において有利な立場に立ち得る。なぜなら、自分は他にも取引相手の選択肢があるということを、交渉において相手への圧力として使えるからである（「安くしてくれないなら他から買う」など）。つまり、関係ある相手の力が強いほど、自分の力は弱くなるということである。

と例えられているとのこと．

本質的には固有ベクトル中心性と同じ計算で求まる．

## Group Betweenness Centrality

媒介中心性を頂点集合に対して計算するように拡張したもの．頂点集合$C$のグループ中心性$BC_{C}$は

$$
BC_{C} = \sum_{s, t \in V - C; s < t} \frac{\sigma (s, t | C)}{\sigma (s, t)}
$$

- [M G Everett and S P Borgatti: The Centrality of Groups and Classes. Journal of Mathematical Sociology. 23(3): 181-201. 1999.](http://www.analytictech.com/borgatti/group_centrality.htm)
- [Ulrik Brandes: On Variants of Shortest-Path Betweenness Centrality and their Generic Computation. Social Networks 30(2):136-145, 2008.](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.72.9610&rep=rep1&type=pdf)
- [Sourav Medya et. al.: Group Centrality Maximization via Network Design. SIAM International Conference on Data Mining, SDM 2018, 126–134.](https://sites.cs.ucsb.edu/~arlei/pubs/sdm18.pdf)

## Subgraph Centrality

`networkx`には

> Subgraph centrality of a node n is the sum of weighted closed walks of all lengths starting and ending at node n. The weights decrease with path length. Each closed walk is associated with a connected subgraph.

と定義されているがよくわからん．水面に水滴を垂らしたら同心円状に波及していくイメージ？

頂点$u$のsubgraph centrality$SC_u$は

$$
SC_u = \sum_{j = 1}^n (v_{j}^u)^2 e^{\lambda_{j}}
$$

ただし$v_j$はグラフ$G$の固有ベクトル，$\lambda_j$はそれに対応する固有値．

```python
draw(G, pos, nx.subgraph_centrality(G), "Subgraph Centrality")
```
{{< figure src="./subgraph.png" title="" lightbox="false" >}}

- [Ernesto Estrada, Juan A. Rodriguez-Velazquez, “Subgraph centrality in complex networks”, Physical Review E 71, 056103 (2005).](https://arxiv.org/abs/cond-mat/0504730)

## Harmonic Centrality：調和中心性

頂点$u$の調和中心性$x_u$はその他の頂点への最短経路長の逆数の和で定義される．

$$
x_u = \sum_{v \neq u} \frac{1}{d(v, u)}
$$

ただし$d(v, u)$は頂点$v$と頂点$u$の最短経路長．

距離に注目した中心性指標．PageRankとHarmonic Centralityは似たような結果になる一方で，Harmonic Centralityの方が計算時間が短くて済む．PageRankとHarmonic Centralityは上位の頂点が一致するが下位の頂点ではずれる．

```python
draw(G, pos, nx.harmonic_centrality(G), "Harmonic Centrality")
```

{{< figure src="./harmonic.png" title="" lightbox="false" >}}

- [Boldi, Paolo, and Sebastiano Vigna. “Axioms for centrality.” Internet Mathematics 10.3-4 (2014): 222-262.](https://arxiv.org/abs/1308.2140)

## Second Order Centrality

グラフ$G$上で頂点$u$からRandom Walkを実行したときに，始点頂点$u$を再び通過するまでの歩長の標準偏差（平均からのブレ）をSecond Order Centralityという．

Second Order Centralityが小さいほど，重要な頂点であるといえる．

`networkx`での実装ではRandom Walkを実際に実行するのではなく，代数的に解く実装になっている．計算量は$O(n^3)$と大きく，規模の大きいグラフに対しては近似が必要になりそう．

```python
draw(G, pos, nx.second_order_centrality(G), "Second Order Centrality")
```

{{< figure src="./second-order.png" title="" lightbox="false" >}}

- [Anne-Marie Kermarrec, Erwan Le Merrer, Bruno Sericola, Gilles Trédan “Second order centrality: Distributed assessment of nodes criticity in complex networks”, Elsevier Computer Communications 34(5):619-628, 2011.](https://homepages.laas.fr/gtredan/pdf/SOC_COMCOM2010.pdf)

## その他

中心性という概念の歴史の話がこちらにまとまっていました．
- [中心性：始まりから最近まで（Preferred Networks R&D Blog）](https://tech.preferred.jp/ja/blog/%E4%B8%AD%E5%BF%83%E6%80%A7%EF%BC%9A%E5%A7%8B%E3%81%BE%E3%82%8A%E3%81%8B%E3%82%89%E6%9C%80%E8%BF%91%E3%81%BE%E3%81%A7/)