import type { StoryStop } from "@/components/StorytellingMap";

export const stopsJa: StoryStop[] = [
  {
    id: "narita",
    title: "🛫 成田空港 — 旅の始まり",
    description:
      "2月の冷たい空気の中、成田空港から出発した。シアトルまでは約9時間のフライト。窓の外の太平洋を眺めながら、テック企業の本社が集まる街と、その先の自然を見るのを楽しみにしていた。",
    coordinates: [35.7647, 140.3864],
    zoom: 5,
    images: ["/images/trips/seattle-vancouver-2025/narita-1.webp"],
  },
  {
    id: "pike-place",
    title: "🐟 Pike Place Market & 最古のスターバックス",
    description:
      "シアトルに着いて最初に向かったのは Pike Place Market。1907年から続くマーケットで、名物の魚投げには圧倒された。そのあと、お目当ての Original Starbucks へ。現存する最古のスターバックスで、行列に並んで、この店でしか買えないオリジナルグッズを買った。",
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
      "シアトルのシンボル、Space Needle。高さ184メートルのタワーで、地上約160メートルの展望デッキからはダウンタウンのビル群とピュージェット湾を360度見渡せる。晴れていればレーニア山も見える。2月の澄んだ空気のおかげで、遠くまでよく見えた。",
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
      "ゴシック様式の建物が並ぶワシントン大学のキャンパスを散策した。図書館 Suzzallo Library の内装は特に見事で、ハリー・ポッターの映画に出てきそうな雰囲気だった。",
    coordinates: [47.6553, -122.3035],
    zoom: 15,
    images: [
      "/images/trips/seattle-vancouver-2025/uw-1.webp",
      "/images/trips/seattle-vancouver-2025/uw-2.webp",
    ],
  },
  {
    id: "amazon-hq",
    title: "📦 Amazon 本社 — The Spheres",
    description:
      "Amazon 本社のある South Lake Union 地区へ。まず目に入るのが、ガラスのドームが連なる「The Spheres」だ。約4万株の植物が植えられた温室のようなオフィスで、会社の規模の大きさを感じた。近くの Day 1 ビルも見て、無人コンビニの Amazon Go で買い物もしてみた。",
    coordinates: [47.6157, -122.3389],
    zoom: 15,
    images: [
      "/images/trips/seattle-vancouver-2025/amazon-hq-1.webp",
      "/images/trips/seattle-vancouver-2025/amazon-hq-2.webp",
    ],
  },
  {
    id: "microsoft",
    title: "💻 Microsoft 本社 — Redmond",
    description:
      "シアトルから車で東へ約30分、Redmond の Microsoft 本社キャンパスへ。広い敷地にオフィスビルが点在していて、ひとつの街のようだった。ビジターセンターで Microsoft の歴史と技術の展示を見て、テック企業で働くことへの意欲が高まった。",
    coordinates: [47.6396, -122.1286],
    zoom: 14,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/microsoft-1.webp"],
  },
  {
    id: "seattle-bar",
    title: "🍺 シアトルの夜",
    description:
      "シアトル最後の夜は、Capitol Hill 地区のクラフトビールバーへ。地元の人たちに混ざって、太平洋岸北西部の IPA を楽しんだ。シアトルのクラフトビールの種類の多さに驚いた。",
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
      "シアトルからバスに乗り、約4時間かけてカナダ国境を越えてバンクーバーへ。車窓の景色が都市から郊外、そして山や森へと変わっていくのが印象に残っている。国境でパスポートチェックを受けて、カナダに入国した。",
    coordinates: [49.0024, -122.756],
    zoom: 9,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/border-crossing-1.webp"],
  },
  {
    id: "lynn-canyon",
    title: "🌲 Lynn Canyon Park",
    description:
      "バンクーバーに着いて最初に向かったのは、ノースバンクーバーの Lynn Canyon Park。無料で渡れる吊り橋から見下ろす渓谷は迫力があった。冬で観光客が少なく、静かな森を独り占めしているような気分だった。トレイルを歩きながら、大きな針葉樹に囲まれて森林浴をした。",
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
      "Lynn Canyon の後は、バンクーバーのシンボルのひとつ、Lions Gate Bridge へ。全長1,823メートルの吊り橋で、バラード・インレットをまたいでノースショアとバンクーバーのダウンタウンを結んでいる。橋の上からは、バンクーバーのビル群と周りの山々が一望できた。",
    coordinates: [49.31740493348699, -123.14023029015001],
    zoom: 14,
    images: ["/images/trips/seattle-vancouver-2025/lions-gate-1.webp"],
  },
  {
    id: "canada-place",
    title: "⚓ Canada Place",
    description:
      "バンクーバーのウォーターフロントに立つ Canada Place。白い帆のような屋根が目印の建物で、クルーズ船のターミナルも兼ねている。海沿いのプロムナードを歩きながら、対岸のノースバンクーバーの山々と港に停泊する船を眺めた。ここで見た夕焼けがとてもきれいだった。",
    coordinates: [49.2888, -123.1111],
    zoom: 15,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/canada-place-1.webp"],
  },
  {
    id: "gastown",
    title: "⏰ Gastown — 蒸気時計",
    description:
      "バンクーバー発祥の地とされる Gastown。レンガ造りの古い建物が並ぶ。名物の蒸気時計（Steam Clock）は、15分ごとに蒸気で汽笛のメロディーを鳴らす。夜の Gastown はライトアップされていて雰囲気がよく、レストランやバーも多い。ここでバンクーバー最後の夜を過ごした。",
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
      "バンクーバーから約10時間のフライトで成田に帰国。テック企業の本社が集まるシアトルと、山と森がすぐそばにあるバンクーバー。同じ太平洋岸北西部でも雰囲気のまったく違う2つの街を回れて、本当に楽しい旅だった。次は夏に、もっとゆっくり来たい。",
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
      "Left Narita Airport in the cold February air. The flight to Seattle took about 9 hours. Watching the Pacific through the window, I was looking forward to the city full of tech company headquarters and the nature beyond it.",
    coordinates: [35.7647, 140.3864],
    zoom: 5,
    images: ["/images/trips/seattle-vancouver-2025/narita-1.webp"],
  },
  {
    id: "pike-place",
    title: "🐟 Pike Place Market & Original Starbucks",
    description:
      "First stop in Seattle: Pike Place Market, open since 1907. The famous fish throwing was overwhelming to watch. Then on to the Original Starbucks, the oldest Starbucks still operating, where I waited in line and bought merchandise sold only at that shop.",
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
      "The Space Needle, Seattle's landmark. The tower is 184 meters tall, and from the observation deck about 160 meters up you get a 360-degree view of the downtown towers and Puget Sound, plus Mount Rainier on clear days. The crisp February air meant I could see a long way.",
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
      "Walked around the University of Washington campus and its Gothic buildings. The interior of Suzzallo Library stood out; it looked like something out of a Harry Potter film.",
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
      "Headed to South Lake Union, where Amazon has its headquarters. The first thing you notice is The Spheres, a cluster of glass domes that make up a greenhouse-like office with about 40,000 plants. It gave me a sense of how big the company is. I also saw the Day 1 building nearby and shopped at an Amazon Go cashierless store.",
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
      "Drove about 30 minutes east of Seattle to Microsoft's headquarters campus in Redmond. Office buildings are spread across the large grounds, so it felt like a small town. The Visitor Center's exhibits on Microsoft's history and technology made me more motivated to work in tech.",
    coordinates: [47.6396, -122.1286],
    zoom: 14,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/microsoft-1.webp"],
  },
  {
    id: "seattle-bar",
    title: "🍺 Seattle Nights",
    description:
      "Spent my last night in Seattle at a craft beer bar in Capitol Hill, drinking Pacific Northwest IPAs among the locals. I was surprised by how many different craft beers Seattle has.",
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
      "Took a bus from Seattle, about 4 hours across the Canadian border to Vancouver. I remember the view outside changing from city to suburbs to mountains and forest. After passport control at the border, I was in Canada.",
    coordinates: [49.0024, -122.756],
    zoom: 9,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/border-crossing-1.webp"],
  },
  {
    id: "lynn-canyon",
    title: "🌲 Lynn Canyon Park",
    description:
      "First stop in Vancouver: Lynn Canyon Park in North Vancouver. Looking down at the canyon from the free suspension bridge was a rush. It was winter and there were few tourists, so I had the quiet forest almost to myself. I walked the trails among tall conifers.",
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
      "After Lynn Canyon, on to Lions Gate Bridge, one of Vancouver's landmarks. The 1,823-meter suspension bridge crosses Burrard Inlet, linking the North Shore with downtown Vancouver. From the bridge I could see the city's towers and the mountains around them.",
    coordinates: [49.31740493348699, -123.14023029015001],
    zoom: 14,
    images: ["/images/trips/seattle-vancouver-2025/lions-gate-1.webp"],
  },
  {
    id: "canada-place",
    title: "⚓ Canada Place",
    description:
      "Canada Place stands on Vancouver's waterfront. Its white, sail-like roof makes it easy to spot, and it doubles as a cruise ship terminal. I walked the seaside promenade looking across at the North Vancouver mountains and the ships in the harbor. The sunset from here was beautiful.",
    coordinates: [49.2888, -123.1111],
    zoom: 15,
    pathType: "drive",
    images: ["/images/trips/seattle-vancouver-2025/canada-place-1.webp"],
  },
  {
    id: "gastown",
    title: "⏰ Gastown — Steam Clock",
    description:
      "Gastown, often called the birthplace of Vancouver, with streets of old brick buildings. Its famous Steam Clock plays a tune on steam whistles every 15 minutes. At night the area is lit up and has a great atmosphere, with plenty of restaurants and bars. I spent my last evening in Vancouver here.",
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
      "A flight of about 10 hours from Vancouver back to Narita. Seattle, full of tech company headquarters, and Vancouver, with mountains and forest close by: two cities in the same Pacific Northwest with very different feels. It was a really fun trip. Next time I want to come in summer and stay longer.",
    coordinates: [35.7647, 140.3864],
    zoom: 5,
    pathType: "flight",
    images: ["/images/trips/seattle-vancouver-2025/narita-return-1.webp"],
  },
];
