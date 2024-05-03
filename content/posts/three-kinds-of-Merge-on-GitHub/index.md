---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "GitHub上でのmerge"
subtitle: ""
summary: "GitHub上で実行できる3種類のmergeについて「どのようなものなのか？」をまとめました．"
authors: []
tags: [GitHub, Git, Tips]
categories: []
date: 2019-10-29T19:50:58+09:00
lastmod: 2019-10-29T19:50:58+09:00
featured: false
draft: false
image: featured.jpeg

---
## GitHub上でのmerge
GitHub上で行えるmergeには3種類あります．

- Create a merge commit
- Squash and merge
- Rebase and merge

これらは，「merge commitの有無」「merge commitのauthorが誰になるのか」などの点で微妙に異なります．

| Command           | merge commitの有無 | merge commitのauthor | merge元のbranchのcommit log |
| ------------------| ------------------------------ | ------------------------------ | ------------------------------ |
| Create a merge commit | 有 | merge先  | 残る |
| Squash and merge | 有 | merge元 | 残らない |
| Rebase and merge | 無 |  | 残る |

### Create a merge commit
「Create a merge commit」では，`git merge --no-ff`でmergeすることになります．つまり，merge先に新たなcommitが作成され，そのcommitがmerge元のcommitを取り込みます．このとき作成されるmerge commitのauthorはmerge先のauthorとして記録されます．

この方法は

- 「何をmergeしたのか」がmerge commitという形で記録として残る
- merge元のbranchがそのまま残るので変更箇所を追いやすい
- merge後に，merge元のbranchを削除したとしても，このbranchのcommit logがmerge先に残る

という特徴があります．わかりやすい一方で，「merge commitのauthorがmerge元ではない」のが（個人的に）「その人の頑張りを讃えたいのになぁ」とか思っちゃったりしてちょっと申し訳ない気がするとかしないとか．

{{< figure src="create-merge-commit.gif" title="Create a merge commit" lightbox="true" >}}

### Squash and merge
「Squash and merge」では，`git merge --squash`でmergeすることになります．つまり，merge元のcommitを一つのcommitにまとめた上で，merge先にmerge commitとして先頭に追加されます．このときのmerge commitのauthorはmerge元のauthorとなります．

この方法は

- 「何をmergeしたのか」がmerge commitという形で記録として残る
- 複数のcommitをまとめて一つにできるのでmerge先のcommit logがわかりやすい

という特徴があります．一方で，一度commitをまとめてしまうと，「どの変更が誰によってどのcommitで行われたのか」という情報が失われてしまうことになります．他の人の複数のcommitを一つのcommitに押し込むことになるので，個人的には若干怖さがあります．

{{< figure src="squash-and-merge.gif" title="Squash and merge" lightbox="true" >}}

### Rebase and merge
「Rebase and merge」では，まずmerge元のブランチにあるcommit列に対して`git rebase`して，commit列が一列になったところでfast-forwardの形でmergeが実行されます．

この方法は

- mergeした結果，merge先のcommit logが一直線で見やすい
- merge commitが作成されない

という特徴があります．

{{< figure src="rebase-and-merge.gif" title="Rebase and merge" lightbox="true" >}}

### Reference
- [About merge methods on GitHub](https://help.github.com/en/github/administering-a-repository/about-merge-methods-on-github)