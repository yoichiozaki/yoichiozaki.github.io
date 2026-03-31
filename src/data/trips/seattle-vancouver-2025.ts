import type { StoryStop } from "@/components/StorytellingMap";

export const stopsJa: StoryStop[] = [
  {
    id: "narita",
    title: "🛫 成田空港 — 旅の始まり",
    description:
      "2月の冷たい空気の中、成田空港から太平洋を越える旅が始まった。約9時間のフライトでシアトルへ。窓の外に広がる太平洋を眺めながら、これから待ち受けるテック企業の聖地と大自然に胸を躍らせた。",
    coordinates: [35.7647, 140.3864],
    zoom: 5,
    images: ["/images/trips/seattle-vancouver-2025/narita-1.webp"],
  },
  {
    id: "pike-place",
    title: "🐟 Pike Place Market & スターバックス1号店",
    description:
      "シアトルに到着してまず向かったのは、Pike Place Market。1907年から続く歴史あるマーケットで、新鮮な魚介類が飛び交う名物の魚投げパフォーマンスに圧倒された。そしてお目当てのスターバックス1号店へ。行列に並んで、ここでしか買えないオリジナルグッズをゲット。",
    coordinates: [47.6097, -122.3425],
    zoom: 15,
    pathType: "flight",
    images: [
      "/images/trips/seattle-vancouver-2025/pike-place-1.webp",
      "/images/trips/seattle-vancouver-2025/pike-place-2.webp",
      "/images/trips/seattle-vancouver-2025/pike-place-3.webp",
      "/images/trips/seattle-vancouver-2025/pike-place-4.webp",
      "/images/trips/seattle-vancouver-2025/pike-place-5.webp",
    ],
  },
  {
    id: "space-needle",
    title: "🗼 Space Needle",
    description:
      "シアトルのシンボル、Space Needle。地上184メートルの展望デッキからは、ダウンタウンのスカイライン、ピュージェット湾、そして晴れた日にはレーニア山まで見渡せる360度の絶景が広がっていた。2月の澄んだ空気のおかげで視界は抜群だった。",
    coordinates: [47.6205, -122.3493],
    zoom: 15,
    images: [
      "/images/trips/seattle-vancouver-2025/space-needle-1.webp",
      "/images/trips/seattle-vancouver-2025/space-needle-2.webp",
    ],
  },
  {
    id: "uw",
    title: "🎓 ワシントン大学",
    description:
      "ゴシック様式の美しい建物が並ぶワシントン大学のキャンパスを散策。特に有名な図書館 Suzzallo Library の荘厳な内装に息をのんだ。まるでハリー・ポッターの世界に迷い込んだような感覚。",
    coordinates: [47.6553, -122.3035],
    zoom: 15,
    images: [
      "/images/trips/seattle-vancouver-2025/uw-1.webp",
      "/images/trips/seattle-vancouver-2025/uw-2.webp",
    ],
  },
  {
    id: "amazon-hq",
    title: "📦 Amazon本社 — The Spheres",
    description:
      "Amazon本社のあるSouth Lake Union地区へ。巨大なガラスのドーム「The Spheres」が目を引く。4万本の植物が植えられた温室のようなオフィスは、テック企業のスケールの大きさを実感させてくれた。周辺のDay 1ビルやAmazon Goの無人コンビニも体験。",
    coordinates: [47.6157, -122.3389],
    zoom: 15,
    images: [
      "/images/trips/seattle-vancouver-2025/amazon-hq-1.webp",
      "/images/trips/seattle-vancouver-2025/amazon-hq-2.webp",
    ],
  },
  {
    id: "microsoft",
    title: "💻 Microsoft本社 — Redmond",
    description:
      "シアトルから車で東へ約30分のRedmondにあるMicrosoft本社キャンパスへ。広大な敷地にオフィスビルが点在する様子は、まるでひとつの街のよう。ビジターセンターでMicrosoftの歴史とテクノロジーに触れ、テック企業で働くことへのモチベーションが上がった。",
    coordinates: [47.6396, -122.1286],
    zoom: 14,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/microsoft-1.webp"],
  },
  {
    id: "seattle-bar",
    title: "🍺 シアトルの夜",
    description:
      "シアトル最後の夜は、Capitol Hill地区のクラフトビールバーへ。ローカルの人々に混ざって太平洋岸北西部ならではのIPAを堪能。シアトルのクラフトビールシーンの層の厚さに驚かされた。",
    coordinates: [47.6253, -122.3222],
    zoom: 15,
    pathType: "drive",
    images: [
      "/images/trips/seattle-vancouver-2025/seattle-bar-1.webp",
      "/images/trips/seattle-vancouver-2025/seattle-bar-2.webp",
      "/images/trips/seattle-vancouver-2025/seattle-bar-3.webp",
    ],
  },
  {
    id: "border-crossing",
    title: "🚌 国境越え — シアトルからバンクーバーへ",
    description:
      "シアトルからバスに乗り、約4時間かけてカナダ国境を越えバンクーバーへ。車窓から見える景色が、都市から郊外、そして雄大な自然へと変わっていく様子が印象的だった。国境でのパスポートチェックを経て、ついにカナダに入国。",
    coordinates: [49.0024, -122.756],
    zoom: 9,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/border-crossing-1.webp"],
  },
  {
    id: "lynn-canyon",
    title: "🌲 Lynn Canyon Park",
    description:
      "バンクーバーに到着して最初に向かったのは、ノースバンクーバーのLynn Canyon Park。無料で渡れる吊り橋から見下ろす渓谷は迫力満点。冬のため観光客も少なく、静寂の中で大自然を独り占めした気分。トレイルを歩きながら、巨大な針葉樹の森林浴を楽しんだ。",
    coordinates: [49.339, -123.0189],
    zoom: 14,
    pathType: "drive",
    images: [
      "/images/trips/seattle-vancouver-2025/lynn-canyon-1.webp",
      "/images/trips/seattle-vancouver-2025/lynn-canyon-2.webp",
    ],
  },
  {
    id: "lions-gate",
    title: "🌉 Lions Gate Bridge",
    description:
      "Lynn Canyonの後は、バンクーバーのシンボル的存在であるライオンズ・ゲート・ブリッジへ。全長1,823mの吊り橋は、バラード・インレットとバンクーバー・ダウンタウンを結ぶ。橋の上からはバンクーバーのスカイラインと山々のパノラマが広がり、絶景だった。",
    coordinates: [49.31740493348699, -123.14023029015001],
    zoom: 14,
    images: ["/images/trips/seattle-vancouver-2025/lions-gate-1.webp"],
  },
  {
    id: "canada-place",
    title: "⚓ Canada Place",
    description:
      "バンクーバーのウォーターフロントに立つCanada Place。白い帆のような屋根が特徴的な建物で、クルーズ船のターミナルでもある。海沿いのプロムナードを歩きながら、対岸のノースバンクーバーの山々と港に停泊する船を眺めた。ここから見る夕焼けは格別だった。",
    coordinates: [49.2888, -123.1111],
    zoom: 15,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/canada-place-1.webp"],
  },
  {
    id: "gastown",
    title: "⏰ Gastown — 蒸気時計",
    description:
      "バンクーバー発祥の地、Gastown。レンガ造りの歴史的な街並みが美しい。名物の蒸気時計（Steam Clock）は15分ごとに蒸気で音を奏でる。夜のGastownはライトアップされて雰囲気抜群。おしゃれなレストランやバーも多く、バンクーバー最後の夜を楽しんだ。",
    coordinates: [49.2844, -123.1088],
    zoom: 16,
    images: [
      "/images/trips/seattle-vancouver-2025/gastown-1.webp",
      "/images/trips/seattle-vancouver-2025/gastown-2.webp",
    ],
  },
  {
    id: "narita-return",
    title: "🛬 帰国 — また来よう、太平洋岸北西部",
    description:
      "バンクーバーから約10時間のフライトで成田に帰国。テック企業の最前線とカナダの大自然、全く異なる二つの顔を持つ太平洋岸北西部の旅は最高の体験だった。次はもっとゆっくり、夏に来たい。",
    coordinates: [35.7647, 140.3864],
    zoom: 5,
    pathType: "flight",
    images: ["/images/trips/seattle-vancouver-2025/narita-return-1.webp"],
  },
];

export const stopsEn: StoryStop[] = [
  {
    id: "narita",
    title: "🛫 Narita Airport — The Journey Begins",
    description:
      "In the cold February air, the journey across the Pacific began at Narita Airport. A roughly 9-hour flight to Seattle. Watching the vast Pacific Ocean through the window, my heart raced with anticipation for the tech mecca and wilderness that awaited.",
    coordinates: [35.7647, 140.3864],
    zoom: 5,
    images: ["/images/trips/seattle-vancouver-2025/narita-1.webp"],
  },
  {
    id: "pike-place",
    title: "🐟 Pike Place Market & Original Starbucks",
    description:
      "First stop in Seattle: Pike Place Market. This historic market, operating since 1907, overwhelmed me with its famous fish-throwing performances. Then on to the original Starbucks store — waited in line and grabbed exclusive merchandise you can only get here.",
    coordinates: [47.6097, -122.3425],
    zoom: 15,
    pathType: "flight",
    images: [
      "/images/trips/seattle-vancouver-2025/pike-place-1.webp",
      "/images/trips/seattle-vancouver-2025/pike-place-2.webp",
      "/images/trips/seattle-vancouver-2025/pike-place-3.webp",
      "/images/trips/seattle-vancouver-2025/pike-place-4.webp",
      "/images/trips/seattle-vancouver-2025/pike-place-5.webp",
    ],
  },
  {
    id: "space-needle",
    title: "🗼 Space Needle",
    description:
      "Seattle's iconic Space Needle. The observation deck at 184 meters offered a 360-degree panorama of the downtown skyline, Puget Sound, and on clear days, Mount Rainier. The crisp February air made for exceptional visibility.",
    coordinates: [47.6205, -122.3493],
    zoom: 15,
    images: [
      "/images/trips/seattle-vancouver-2025/space-needle-1.webp",
      "/images/trips/seattle-vancouver-2025/space-needle-2.webp",
    ],
  },
  {
    id: "uw",
    title: "🎓 University of Washington",
    description:
      "Strolled through the beautiful Gothic architecture of the University of Washington campus. The majestic interior of Suzzallo Library was absolutely breathtaking — like stepping into the world of Harry Potter.",
    coordinates: [47.6553, -122.3035],
    zoom: 15,
    images: [
      "/images/trips/seattle-vancouver-2025/uw-1.webp",
      "/images/trips/seattle-vancouver-2025/uw-2.webp",
    ],
  },
  {
    id: "amazon-hq",
    title: "📦 Amazon HQ — The Spheres",
    description:
      "Headed to the South Lake Union district, home of Amazon HQ. The massive glass domes of 'The Spheres' were stunning — a greenhouse-like office housing 40,000 plants that truly showcases the scale of tech companies. Also experienced the Day 1 building and an Amazon Go cashierless store.",
    coordinates: [47.6157, -122.3389],
    zoom: 15,
    images: [
      "/images/trips/seattle-vancouver-2025/amazon-hq-1.webp",
      "/images/trips/seattle-vancouver-2025/amazon-hq-2.webp",
    ],
  },
  {
    id: "microsoft",
    title: "💻 Microsoft HQ — Redmond",
    description:
      "About 30 minutes east of Seattle lies Microsoft's headquarters campus in Redmond. Office buildings scattered across the vast grounds made it feel like its own small city. The Visitor Center showcased Microsoft's history and technology, boosting my motivation for working in tech.",
    coordinates: [47.6396, -122.1286],
    zoom: 14,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/microsoft-1.webp"],
  },
  {
    id: "seattle-bar",
    title: "🍺 Seattle Nights",
    description:
      "Spent the last night in Seattle at a craft beer bar in the Capitol Hill district. Mingling with locals while enjoying Pacific Northwest IPAs. The depth of Seattle's craft beer scene was truly impressive.",
    coordinates: [47.6253, -122.3222],
    zoom: 15,
    pathType: "drive",
    images: [
      "/images/trips/seattle-vancouver-2025/seattle-bar-1.webp",
      "/images/trips/seattle-vancouver-2025/seattle-bar-2.webp",
      "/images/trips/seattle-vancouver-2025/seattle-bar-3.webp",
    ],
  },
  {
    id: "border-crossing",
    title: "🚌 Border Crossing — Seattle to Vancouver",
    description:
      "Boarded a bus from Seattle for the roughly 4-hour journey across the Canadian border to Vancouver. Watching the scenery transform from urban to suburban to majestic wilderness through the window was mesmerizing. After passport control, finally set foot in Canada.",
    coordinates: [49.0024, -122.756],
    zoom: 9,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/border-crossing-1.webp"],
  },
  {
    id: "lynn-canyon",
    title: "🌲 Lynn Canyon Park",
    description:
      "First destination in Vancouver: Lynn Canyon Park in North Vancouver. The free suspension bridge offered thrilling views of the canyon below. With fewer tourists in winter, it felt like having the wilderness all to ourselves. Hiked the trails surrounded by towering conifers.",
    coordinates: [49.339, -123.0189],
    zoom: 14,
    pathType: "drive",
    images: [
      "/images/trips/seattle-vancouver-2025/lynn-canyon-1.webp",
      "/images/trips/seattle-vancouver-2025/lynn-canyon-2.webp",
    ],
  },
  {
    id: "lions-gate",
    title: "🌉 Lions Gate Bridge",
    description:
      "After Lynn Canyon, headed to Lions Gate Bridge—an iconic symbol of Vancouver. The 1,823m suspension bridge connects the North Shore to downtown Vancouver. From the bridge, a stunning panorama of Vancouver's skyline and surrounding mountains unfolded.",
    coordinates: [49.31740493348699, -123.14023029015001],
    zoom: 14,
    images: ["/images/trips/seattle-vancouver-2025/lions-gate-1.webp"],
  },
  {
    id: "canada-place",
    title: "⚓ Canada Place",
    description:
      "Canada Place on Vancouver's waterfront, with its distinctive sail-like roof, also serves as a cruise ship terminal. Walking along the seaside promenade, gazing at the North Vancouver mountains and ships docked in the harbor. The sunset from here was spectacular.",
    coordinates: [49.2888, -123.1111],
    zoom: 15,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/canada-place-1.webp"],
  },
  {
    id: "gastown",
    title: "⏰ Gastown — Steam Clock",
    description:
      "Gastown, the birthplace of Vancouver. Beautiful historic brick buildings line the streets. The famous Steam Clock plays sounds powered by steam every 15 minutes. Gastown lit up at night was incredibly atmospheric. Enjoyed the last Vancouver evening at trendy restaurants and bars.",
    coordinates: [49.2844, -123.1088],
    zoom: 16,
    images: [
      "/images/trips/seattle-vancouver-2025/gastown-1.webp",
      "/images/trips/seattle-vancouver-2025/gastown-2.webp",
    ],
  },
  {
    id: "narita-return",
    title: "🛬 Homeward Bound — Until Next Time, Pacific Northwest",
    description:
      "A roughly 10-hour flight from Vancouver back to Narita. This journey through the cutting edge of tech and Canada's magnificent wilderness — two completely different faces of the Pacific Northwest — was an unforgettable experience. Next time, a longer stay in summer.",
    coordinates: [35.7647, 140.3864],
    zoom: 5,
    pathType: "flight",
    images: ["/images/trips/seattle-vancouver-2025/narita-return-1.webp"],
  },
];
