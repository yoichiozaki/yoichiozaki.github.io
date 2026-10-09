import { useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

const docs = [
  { id: "D1", text: "cat sat mat", terms: ["cat", "sat", "mat"] },
  { id: "D2", text: "cat dog", terms: ["cat", "dog"] },
  { id: "D3", text: "dog sat log", terms: ["dog", "sat", "log"] },
] as const;

const postings = [
  { term: "cat", list: ["D1", "D2"], tone: colors.coral },
  { term: "dog", list: ["D2", "D3"], tone: colors.amber },
  { term: "sat", list: ["D1", "D3"], tone: colors.teal },
  { term: "mat", list: ["D1"], tone: colors.muted },
  { term: "log", list: ["D3"], tone: colors.muted },
] as const;

const idf = Math.log10(3 / 2);
const idfText = idf.toFixed(3);
const d1Score = (idf * 2).toFixed(3);

function Label({ children, size = 24, muted = false }: { children: string; size?: number; muted?: boolean }) {
  return (
    <div style={{ fontFamily: fonts.sans, fontSize: size, fontWeight: 650, color: muted ? colors.muted : colors.ink, lineHeight: 1.25 }}>
      {children}
    </div>
  );
}

function Mono({ children, size = 26, color = colors.ink }: { children: string; size?: number; color?: string }) {
  return <span style={{ fontFamily: fonts.mono, fontSize: size, fontWeight: 700, color }}>{children}</span>;
}

function Term({ text, active = false, done = false }: { text: string; active?: boolean; done?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 74,
        height: 48,
        padding: "0 18px",
        borderRadius: 13,
        background: active ? colors.coralSoft : done ? colors.tealSoft : "#fff",
        border: `3px solid ${active ? colors.coral : done ? colors.teal : colors.hairlineStrong}`,
        fontFamily: fonts.mono,
        fontSize: 24,
        fontWeight: 700,
        color: active ? colors.coralDeep : done ? colors.tealDeep : colors.bodyStrong,
      }}
    >
      {text}
    </span>
  );
}

function BigTerm({ text, active = false, done = false }: { text: string; active?: boolean; done?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 118,
        height: 74,
        padding: "0 26px",
        borderRadius: 18,
        background: active ? colors.coralSoft : done ? colors.tealSoft : "#fff",
        border: `4px solid ${active ? colors.coral : done ? colors.teal : colors.hairlineStrong}`,
        fontFamily: fonts.mono,
        fontSize: 34,
        fontWeight: 800,
        color: active ? colors.coralDeep : done ? colors.tealDeep : colors.bodyStrong,
      }}
    >
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* 0. intro                                                                 */
/* ------------------------------------------------------------------------ */

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const p = progress(frame, 26, 40);
  const box = pop(frame, 16, fps);
  const rows = postings.slice(0, 3);
  return (
    <TitleCard
      title={{ ja: "検索エンジンの\n仕組み", en: "How Search\nEngines Work" }}
      subtitle={{
        ja: "転置インデックスから、ブーリアン検索、TF-IDF、BM25まで",
        en: "From inverted indexes to Boolean search, TF-IDF, and BM25",
      }}
      art={
        <>
          <Abs x={1180} y={235} w={560} h={78} style={{ transform: `scale(${0.88 + 0.12 * box})`, opacity: Math.min(1, box) }}>
            <Card tone="white" accent={colors.coral} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 28px", gap: 18 }}>
              <div style={{ width: 26, height: 26, border: `5px solid ${colors.coral}`, borderRadius: 99 }} />
              <Mono size={30}>{frame % 70 < 35 ? "cat sat" : "search"}</Mono>
            </Card>
          </Abs>
          <Svg>
            <Arrow x1={1460} y1={334} x2={1460} y2={420} p={progress(frame, 34, 18)} color={colors.coral} width={5} />
            <Arrow x1={1460} y1={650} x2={1265} y2={755} p={progress(frame, 72, 18)} color={colors.teal} width={5} bend={60} />
            <Arrow x1={1460} y1={650} x2={1460} y2={755} p={progress(frame, 78, 18)} color={colors.teal} width={5} />
            <Arrow x1={1460} y1={650} x2={1655} y2={755} p={progress(frame, 84, 18)} color={colors.teal} width={5} bend={-60} />
          </Svg>
          <Abs x={1210} y={410} w={500} h={250}>
            <Card tone="dark" style={{ width: "100%", height: "100%", padding: "26px 30px" }}>
              <div style={{ fontFamily: fonts.sans, fontSize: 24, fontWeight: 700, color: colors.onDark }}>
                {p > 0.65 ? t({ ja: "BM25ランキング", en: "BM25 ranker" }) : t({ ja: "転置インデックス", en: "Inverted index" })}
              </div>
              <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
                {rows.map((r, i) => (
                  <div key={r.term} style={{ display: "flex", alignItems: "center", gap: 12, opacity: progress(frame, 42 + i * 8, 16) }}>
                    <span style={{ fontFamily: fonts.mono, fontSize: 24, color: r.tone, width: 58 }}>{r.term}</span>
                    <span style={{ fontFamily: fonts.mono, fontSize: 23, color: colors.onDarkSoft }}>→ [{r.list.join(", ")}]</span>
                  </div>
                ))}
              </div>
            </Card>
          </Abs>
          {["D1", "D2", "D3"].map((d, i) => {
            const s = pop(frame, 86 + i * 6, fps);
            return (
              <Abs key={d} x={1190 + i * 195} y={750} w={150} h={88} style={{ opacity: Math.min(1, s), transform: `scale(${0.82 + 0.18 * s})` }}>
                <Card tone="white" accent={i === 0 ? colors.teal : colors.hairline} style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                  <Mono size={30} color={i === 0 ? colors.tealDeep : colors.ink}>{d}</Mono>
                </Card>
              </Abs>
            );
          })}
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------------ */
/* 1. pipeline                                                              */
/* ------------------------------------------------------------------------ */

export function PipelineScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const stages: { label: Bilingual; sub: Bilingual; x: number; y: number; tone: string }[] = [
    { label: { ja: "収集", en: "Collect" }, sub: { ja: "文書", en: "docs" }, x: 150, y: 332, tone: colors.muted },
    { label: { ja: "解析", en: "Analyze" }, sub: { ja: "トークン", en: "tokens" }, x: 430, y: 332, tone: colors.coral },
    { label: { ja: "索引", en: "Index" }, sub: { ja: "ターム→文書", en: "term→docs" }, x: 710, y: 332, tone: colors.teal },
    { label: { ja: "クエリ", en: "Query" }, sub: { ja: "トークン", en: "tokens" }, x: 990, y: 332, tone: colors.amber },
    { label: { ja: "ランキング", en: "Rank" }, sub: { ja: "BM25", en: "BM25" }, x: 1270, y: 332, tone: colors.coral },
    { label: { ja: "結果", en: "Results" }, sub: { ja: "上位文書", en: "top docs" }, x: 1550, y: 332, tone: colors.teal },
  ];
  const activeIndex = frame < cues[1] ? 1 : frame < cues[2] ? 3 : 4;
  return (
    <SceneShell kicker={{ ja: "全体像", en: "Pipeline" }} title={{ ja: "生の文章を、検索可能な構造へ", en: "From raw text to searchable structures" }}>
      <Abs x={120} y={224} w={1680} h={470}>
        <Card tone="soft" style={{ width: "100%", height: "100%" }}><></></Card>
      </Abs>
      <Svg>
        {stages.slice(0, -1).map((s, i) => (
          <Arrow key={s.label.en} x1={s.x + 190} y1={s.y + 85} x2={stages[i + 1].x - 10} y2={s.y + 85} p={progress(frame, cues[0] + 12 + i * 8, 16)} color={i < activeIndex ? colors.coral : colors.hairlineStrong} width={5} />
        ))}
        <Packet x1={1450} y1={278} x2={1600} y2={278} start={cues[2] + 20} dur={26} color={colors.teal} label={t({ ja: "必要部分", en: "needed" })} />
      </Svg>
      {stages.map((s, i) => {
        const appear = progress(frame, cues[0] + i * 7, 16);
        const active = i === activeIndex || (frame >= cues[2] && i >= 3);
        return (
          <Abs key={s.label.en} x={s.x} y={s.y} w={220} h={170} style={{ opacity: appear, transform: `translateY(${(1 - appear) * 22}px)` }}>
            <Card tone="white" accent={active ? s.tone : colors.hairline} style={{ width: "100%", height: "100%", padding: 22 }}>
              <div style={{ width: 20, height: 20, borderRadius: 99, background: s.tone, marginBottom: 20 }} />
              <Label size={32}>{t(s.label)}</Label>
              <div style={{ marginTop: 10 }}><Mono size={26} color={colors.muted}>{t(s.sub)}</Mono></div>
            </Card>
          </Abs>
        );
      })}
      <Appear at={cues[2]} style={{ position: "absolute", left: 255, top: 734, width: 1410 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 18 }}>
          <Chip tone="teal" size={28}>{t({ ja: "事前に構築", en: "built ahead of time" })}</Chip>
          <Chip tone="coral" size={28}>{t({ ja: "クエリ時は必要部分だけ", en: "query reads only needed parts" })}</Chip>
        </div>
      </Appear>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. tokenization                                                          */
/* ------------------------------------------------------------------------ */

export function TokenizationScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const enTokens = ["Search", "engines", "rank", "documents"];
  const jaTokens = ["検索", "エンジン", "文書", "ランキング"];
  return (
    <SceneShell kicker={{ ja: "テキスト解析", en: "Text analysis" }} title={{ ja: "文章をトークンへ分解する", en: "Break documents into tokens" }}>
      <Abs x={120} y={236} w={760} h={210}>
        <Card tone="white" accent={colors.coral} style={{ height: "100%", padding: 30 }}>
          <Label size={28}>{t({ ja: "英語: 空白が手がかり", en: "English: spaces give boundaries" })}</Label>
          <div style={{ marginTop: 30, fontFamily: fonts.mono, fontSize: 32, color: colors.body }}>Search engines rank documents</div>
        </Card>
      </Abs>
      <Abs x={1040} y={236} w={760} h={210}>
        <Card tone="white" accent={colors.amber} style={{ height: "100%", padding: 30 }}>
          <Label size={28}>{t({ ja: "日本語: 空白がない", en: "Japanese: no spaces" })}</Label>
          <div style={{ marginTop: 30, fontFamily: fonts.sans, fontSize: 38, fontWeight: 700, color: colors.body }}>検索エンジンは文書をランキングする</div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={500} y1={470} x2={500} y2={565} p={progress(frame, cues[0] + 34, 18)} color={colors.coral} width={5} />
        <Arrow x1={1420} y1={470} x2={1420} y2={565} p={progress(frame, cues[2] - 14, 18)} color={colors.amber} width={5} />
      </Svg>
      <Abs x={150} y={574} w={700} h={130} style={{ display: "flex", flexWrap: "wrap", gap: 14, alignContent: "center", opacity: progress(frame, cues[0] + 46, 18) }}>
        {enTokens.map((tok, i) => <Term key={tok} text={tok.toLowerCase()} active={i === 0 && frame < cues[1]} done={frame >= cues[1]} />)}
      </Abs>
      <Abs x={1070} y={574} w={700} h={130} style={{ display: "flex", flexWrap: "wrap", gap: 14, alignContent: "center", opacity: progress(frame, cues[2], 20) }}>
        {jaTokens.map((tok) => <Term key={tok} text={tok} done />)}
      </Abs>
      <Appear at={cues[1]} style={{ position: "absolute", left: 255, top: 750 }}>
        <Chip tone="coral" size={28}>{t({ ja: "Unicode正規化 + 大文字小文字の統一", en: "Unicode normalization + case folding" })}</Chip>
      </Appear>
      <Appear at={cues[2]} style={{ position: "absolute", left: 1120, top: 750 }}>
        <Chip tone="amber" size={28}>{t({ ja: "MeCab / Kuromoji → 形態素解析", en: "MeCab / Kuromoji → morphological analysis" })}</Chip>
      </Appear>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. normalize                                                             */
/* ------------------------------------------------------------------------ */

export function NormalizeScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const raw = ["The", "cats", "are", "running", "on", "mats"];
  const normalized = ["cat", "run", "mat"];
  return (
    <SceneShell kicker={{ ja: "正規化", en: "Normalization" }} title={{ ja: "情報量のあるタームだけを残す", en: "Keep the terms that carry signal" }}>
      <Abs x={160} y={256} w={1600} h={144}>
        <Card tone="white" style={{ height: "100%", padding: "38px 44px" }}>
          <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
            {raw.map((w) => (
              <Term key={w} text={w} active={["The", "are", "on"].includes(w) && frame >= cues[0]} />
            ))}
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={960} y1={424} x2={960} y2={520} p={progress(frame, cues[0] + 10, 20)} color={colors.coral} width={5} />
        <Arrow x1={960} y1={642} x2={960} y2={724} p={progress(frame, cues[1] + 16, 20)} color={colors.teal} width={5} />
      </Svg>
      <Abs x={260} y={520} w={1400} h={120}>
        <Card tone="soft" accent={colors.coral} style={{ height: "100%", padding: "30px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Chip tone="coral" size={28}>{t({ ja: "ストップワード除去", en: "stopword removal" })}</Chip>
          <div style={{ display: "flex", gap: 14, opacity: progress(frame, cues[0], 20) }}>
            {["the", "are", "on"].map((w) => <Term key={w} text={w} active />)}
          </div>
          <Label size={26} muted>{t({ ja: "高頻度・低情報量", en: "frequent, low-information" })}</Label>
        </Card>
      </Abs>
      <Abs x={330} y={724} w={1260} h={138}>
        <Card tone="white" accent={colors.teal} style={{ height: "100%", padding: "30px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Chip tone="teal" size={28}>{t({ ja: "ステミング / レンマタイゼーション", en: "stemming / lemmatization" })}</Chip>
          <div style={{ display: "flex", gap: 16, opacity: progress(frame, cues[1], 22) }}>
            {normalized.map((w) => <Term key={w} text={w} done />)}
          </div>
          <Mono size={26} color={colors.muted}>running → run · cats → cat</Mono>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. inverted index                                                        */
/* ------------------------------------------------------------------------ */

export function InvertedIndexScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const scanP = progress(frame, cues[0] + 20, 70);
  const lookupP = progress(frame, cues[2], 24);
  return (
    <SceneShell kicker={{ ja: "転置インデックス", en: "Inverted index" }} title={{ ja: "全文走査では、規模に勝てない", en: "Full scans do not scale" }}>
      <Abs x={120} y={238} w={760} h={560}>
        <Card tone="soft" accent={colors.errorSoft} style={{ width: "100%", height: "100%", padding: 32 }}>
          <Chip tone="error" size={28}>{t({ ja: "素朴な全文検索", en: "naive full scan" })}</Chip>
          <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
            {Array.from({ length: 20 }, (_, i) => {
              const active = i / 20 < scanP;
              return (
                <div key={i} style={{ height: 70, borderRadius: 12, background: active ? colors.errorSoft : "#fff", border: `2px solid ${active ? colors.error : colors.hairline}`, display: "grid", placeItems: "center", fontFamily: fonts.mono, fontSize: 24, color: colors.muted }}>
                  D{i + 1}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 30, textAlign: "center" }}><Mono size={34} color={colors.error}>O(N×L)</Mono></div>
        </Card>
      </Abs>
      <Abs x={1040} y={238} w={760} h={560}>
        <Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 32 }}>
          <Chip tone="teal" size={28}>{t({ ja: "タームから直接たどる", en: "term points directly to docs" })}</Chip>
          <div style={{ position: "relative", marginTop: 42, height: 320 }}>
            <Abs x={48} y={120} w={180} h={90}>
              <Card tone="dark" style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}><Mono size={34} color={colors.onDark}>cat</Mono></Card>
            </Abs>
            <svg width={700} height={330} viewBox="0 0 700 330" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <defs>
                <marker id="idxArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.coral} />
                </marker>
              </defs>
              {[
                "M 235 165 Q 360 70 500 94",
                "M 235 165 Q 360 260 500 236",
              ].map((d) => (
                <path
                  key={d}
                  d={d}
                  fill="none"
                  stroke={colors.coral}
                  strokeWidth={6}
                  strokeLinecap="round"
                  markerEnd="url(#idxArrow)"
                  strokeDasharray={420}
                  strokeDashoffset={420 * (1 - lookupP)}
                />
              ))}
            </svg>
            <Abs x={430} y={48} w={160} h={90}><Card tone="white" accent={colors.coral} style={{ display: "grid", placeItems: "center", height: "100%" }}><Mono size={32}>D1</Mono></Card></Abs>
            <Abs x={430} y={190} w={160} h={90}><Card tone="white" accent={colors.coral} style={{ display: "grid", placeItems: "center", height: "100%" }}><Mono size={32}>D2</Mono></Card></Abs>
          </div>
          <div style={{ textAlign: "center", opacity: progress(frame, cues[2], 20) }}>
            <Chip tone="teal" size={28}>{t({ ja: "文書から探さない", en: "do not search documents first" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Appear at={cues[1]} style={{ position: "absolute", left: 670, top: 820 }}>
        <Chip tone="coral" size={28}>{t({ ja: "ドキュメント数が増えるほど走査コストが増える", en: "scan cost grows with corpus size" })}</Chip>
      </Appear>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. postings                                                              */
/* ------------------------------------------------------------------------ */

export function PostingsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "ポスティングリスト", en: "Posting lists" }} title={{ ja: "ターム辞書が、リストへの入口になる", en: "The term dictionary is the entry point" }}>
      <Abs x={120} y={226} w={560} h={580}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 30 }}>
          <Label size={30}>{t({ ja: "通常の索引", en: "Forward index" })}</Label>
          <div style={{ marginTop: 28, display: "grid", gap: 18 }}>
            {docs.map((d, i) => (
              <div key={d.id} style={{ opacity: progress(frame, cues[0] + i * 8, 16) }}>
                <div style={{ height: 94, borderRadius: 16, background: "#fff", border: `2px solid ${colors.hairline}`, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Mono size={24}>{d.id}</Mono>
                  <Mono size={22} color={colors.body}>{d.text}</Mono>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={680} y1={516} x2={920} y2={516} p={progress(frame, cues[0] + 24, 24)} color={colors.coral} width={6} />
      </Svg>
      <Abs x={920} y={226} w={880} h={580}>
        <Card tone="soft" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 30 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Label size={30}>{t({ ja: "転置インデックス", en: "Inverted index" })}</Label>
            <Chip tone="teal" size={24}>{t({ ja: "ターム → リスト", en: "term → posting list" })}</Chip>
          </div>
          <div style={{ marginTop: 26, display: "grid", gap: 16 }}>
            {postings.map((p, i) => (
              <div key={p.term} style={{ opacity: progress(frame, cues[0] + 36 + i * 7, 14), display: "flex", alignItems: "center", gap: 16 }}>
                <Term text={p.term} active={i < 3} />
                <div style={{ fontFamily: fonts.mono, fontSize: 30, color: colors.muted }}>→</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {p.list.map((d) => <Term key={d} text={d} done={i < 3} />)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Abs>
      <Appear at={cues[1]} style={{ position: "absolute", left: 250, top: 820 }}>
        <div style={{ display: "flex", gap: 22 }}>
          <Chip tone="teal" size={27}>{t({ ja: "ハッシュ辞書: 期待 O(1)", en: "hash dictionary: expected O(1)" })}</Chip>
          <Chip tone="amber" size={27}>{t({ ja: "探索木: O(log T)", en: "search tree: O(log T)" })}</Chip>
        </div>
      </Appear>
      <Appear at={cues[2]} style={{ position: "absolute", left: 1010, top: 820 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <Chip tone="muted" size={24}>{t({ ja: "文書ID", en: "doc ID" })}</Chip>
          <Chip tone="muted" size={24}>{t({ ja: "TF", en: "TF" })}</Chip>
          <Chip tone="muted" size={24}>{t({ ja: "位置", en: "position" })}</Chip>
          <Chip tone="muted" size={24}>{t({ ja: "オフセット", en: "offset" })}</Chip>
        </div>
      </Appear>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 6. boolean                                                               */
/* ------------------------------------------------------------------------ */

export function BooleanScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const step = frame < cues[1] ? 0 : frame < cues[2] ? 1 : 2;
  return (
    <SceneShell kicker={{ ja: "ブーリアン検索", en: "Boolean search" }} title={{ ja: "ANDは、リストの積集合", en: "AND is posting-list intersection" }}>
      <Abs x={220} y={250} w={1480} h={500}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 42 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 70, alignItems: "center" }}>
            <div>
              <Label size={32}>{t({ ja: "cat のリスト", en: "cat list" })}</Label>
              <div style={{ marginTop: 34, display: "flex", gap: 28 }}>
                {["D1", "D2"].map((d, i) => <BigTerm key={d} text={d} active={step === 1 && i === 0} />)}
              </div>
            </div>
            <Chip tone="coral" size={34}>{t({ ja: "AND", en: "AND" })}</Chip>
            <div>
              <Label size={32}>{t({ ja: "sat のリスト", en: "sat list" })}</Label>
              <div style={{ marginTop: 34, display: "flex", gap: 28 }}>
                {["D1", "D3"].map((d, i) => <BigTerm key={d} text={d} active={step === 1 && i === 0} />)}
              </div>
            </div>
          </div>
          <Abs x={610} y={270} w={260} style={{ opacity: progress(frame, cues[2] - 18, 12) }}>
            <Chip tone="teal" size={25}>{t({ ja: "2ポインタで走査", en: "two pointers" })}</Chip>
          </Abs>
          <Abs x={520} y={350} w={440} h={120} style={{ opacity: progress(frame, cues[1] + 18, 18) }}>
            <Card tone="soft" accent={colors.teal} style={{ height: "100%", display: "grid", placeItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Label size={30}>{t({ ja: "結果", en: "result" })}</Label>
                <BigTerm text="D1" done />
              </div>
            </Card>
          </Abs>
        </Card>
      </Abs>
      <Appear at={cues[2]} style={{ position: "absolute", left: 690, top: 800 }}>
        <Chip tone="teal" size={30}>{t({ ja: "ソート済みリストのマージ: O(n + m)", en: "merge sorted lists: O(n + m)" })}</Chip>
      </Appear>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 7. query optimization                                                    */
/* ------------------------------------------------------------------------ */

export function QueryOptimizationScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const showAnd = frame >= cues[1];
  const lists = [
    { term: { ja: "アルゴリズム", en: "algorithm" }, count: 2, docs: ["D4", "D9"] },
    { term: { ja: "検索", en: "search" }, count: 7, docs: ["D1", "D2", "D3", "D4"] },
    { term: { ja: "エンジン", en: "engine" }, count: 5, docs: ["D2", "D4", "D8"] },
  ];
  return (
    <SceneShell kicker={{ ja: "クエリ最適化", en: "Query optimization" }} title={{ ja: "候補集合を、小さいまま扱う", en: "Keep candidate sets small" }}>
      <Abs x={140} y={240} w={720} h={540}>
        <Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 34 }}>
          <Chip tone="teal" size={28}>{t({ ja: "cat または sat", en: "cat OR sat" })}</Chip>
          <div style={{ marginTop: 42, display: "grid", gap: 28 }}>
            {[
              { term: "cat", list: ["D1", "D2"] },
              { term: "sat", list: ["D1", "D3"] },
            ].map((row) => (
              <div key={row.term} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <BigTerm text={row.term} active={frame < cues[1]} />
                <Mono size={34} color={colors.muted}>→</Mono>
                <div style={{ display: "flex", gap: 14 }}>
                  {row.list.map((d) => <BigTerm key={d} text={d} />)}
                </div>
              </div>
            ))}
          </div>
          <Abs x={108} y={350} w={500} style={{ opacity: progress(frame, cues[0] + 28, 20) }}>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {["D1", "D2", "D3"].map((d) => <BigTerm key={d} text={d} done />)}
            </div>
          </Abs>
        </Card>
      </Abs>
      <Abs x={1040} y={240} w={740} h={540} style={{ opacity: showAnd ? 1 : 0.4 }}>
        <Card tone="soft" accent={colors.coral} style={{ width: "100%", height: "100%", padding: 34 }}>
          <Chip tone="coral" size={28}>{t({ ja: "ANDは短いリストから", en: "AND starts shortest" })}</Chip>
          <div style={{ marginTop: 36, display: "grid", gap: 20 }}>
            {lists.map((l, i) => {
              const order = [1, 2, 0].indexOf(i);
              const y = frame < cues[1] ? i * 96 : order * 96;
              const p = progress(frame, cues[1], 24);
              return (
                <div key={l.term.en} style={{ transform: `translateY(${lerp(i * 96, y, p) - i * 96}px)`, display: "flex", alignItems: "center", gap: 18 }}>
                  <Term text={t(l.term)} active={i === 0 && showAnd} />
                  <div style={{ width: l.count * 48, height: 30, borderRadius: 999, background: i === 0 ? colors.coral : colors.hairlineStrong }} />
                  <Mono size={22} color={colors.muted}>{t({ ja: `${l.count} 文書`, en: `${l.count} docs` })}</Mono>
                </div>
              );
            })}
          </div>
          <Appear at={cues[2] - 20} style={{ position: "absolute", left: 154, top: 402 }}>
            <Chip tone="teal" size={26}>{t({ ja: "中間結果が小さい", en: "small intermediate result" })}</Chip>
          </Appear>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 8. TF-IDF                                                                */
/* ------------------------------------------------------------------------ */

export function TFIDFScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const scoreRows = [
    { doc: "D1", score: d1Score, width: 320, top: true },
    { doc: "D2", score: idfText, width: 160, top: false },
    { doc: "D3", score: idfText, width: 160, top: false },
  ];
  return (
    <SceneShell kicker={{ ja: "ランキング", en: "Ranking" }} title={{ ja: "頻度と希少性を掛け合わせる", en: "Combine frequency with rarity" }}>
      <Abs x={120} y={236} w={520} h={560}>
        <Card tone="white" accent={colors.coral} style={{ width: "100%", height: "100%", padding: 34 }}>
          <Chip tone="coral" size={30}>{t({ ja: "TF", en: "TF" })}</Chip>
          <div style={{ marginTop: 28 }}><Label size={34}>{t({ ja: "文書内の出現回数", en: "count inside document" })}</Label></div>
          <div style={{ marginTop: 30, display: "grid", gap: 18 }}>
            {[
              ["cat", "D1", "1"],
              ["sat", "D1", "1"],
              ["cat", "D2", "1"],
              ["sat", "D3", "1"],
            ].map(([term, doc, tf], i) => (
              <div key={`${term}${doc}`} style={{ display: "flex", justifyContent: "space-between", opacity: progress(frame, cues[1] + i * 7, 14) }}>
                <Mono size={31}>{`${term}@${doc}`}</Mono>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 62,
                    height: 46,
                    borderRadius: 13,
                    background: colors.coralSoft,
                    border: `3px solid ${colors.coral}`,
                    fontFamily: fonts.mono,
                    fontSize: 30,
                    fontWeight: 800,
                    color: colors.coralDeep,
                  }}
                >
                  {tf}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Abs>
      <Abs x={700} y={236} w={520} h={560}>
        <Card tone="white" accent={colors.amber} style={{ width: "100%", height: "100%", padding: 34 }}>
          <Chip tone="amber" size={30}>{t({ ja: "IDF", en: "IDF" })}</Chip>
          <div style={{ marginTop: 30 }}><Label size={34}>{t({ ja: "珍しいタームほど重い", en: "rarer terms weigh more" })}</Label></div>
          <div style={{ marginTop: 54, textAlign: "center" }}>
            <Mono size={46}>log₁₀(N / df)</Mono>
            <div style={{ marginTop: 58, fontFamily: fonts.mono, fontSize: 40, fontWeight: 800, color: colors.body, opacity: progress(frame, cues[2], 18) }}>
              log₁₀(3 / 2) = {idfText}
            </div>
            <div style={{ marginTop: 46, opacity: progress(frame, cues[2] + 10, 18) }}>
              <Chip tone="amber" size={30}>{t({ ja: "cat と sat は df=2", en: "cat and sat: df=2" })}</Chip>
            </div>
          </div>
        </Card>
      </Abs>
      <Abs x={1280} y={236} w={520} h={560}>
        <Card tone="soft" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 34 }}>
          <Chip tone="teal" size={30}>{t({ ja: "合算", en: "sum" })}</Chip>
          <div style={{ marginTop: 34, display: "grid", gap: 28, opacity: progress(frame, cues[3] - 10, 18) }}>
            {scoreRows.map((row) => (
              <div key={row.doc}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <Mono size={34} color={row.top ? colors.tealDeep : colors.ink}>{row.doc}</Mono>
                  <Mono size={31} color={row.top ? colors.tealDeep : colors.muted}>{row.score}</Mono>
                </div>
                <div style={{ width: 360, height: 38, borderRadius: 999, background: "#fff", border: `2px solid ${colors.hairlineStrong}`, overflow: "hidden" }}>
                  <div
                    style={{
                      width: row.width * progress(frame, cues[3], 24),
                      height: "100%",
                      background: row.top ? colors.teal : colors.hairlineStrong,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, textAlign: "center", opacity: progress(frame, cues[3], 18) }}>
            <Chip tone="teal" size={30}>{t({ ja: "D1が上位", en: "D1 ranks first" })}</Chip>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 9. BM25                                                                  */
/* ------------------------------------------------------------------------ */

export function BM25Scene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const lineP = progress(frame, cues[0] + 12, 26);
  const curveP = progress(frame, cues[1], 38);
  const pts = Array.from({ length: 34 }, (_, i) => {
    const tf = i / 3;
    const y = 1.2 * ((tf * 2.2) / (tf + 1.2));
    return { x: 100 + i * 14, y: 300 - y * 70 };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <SceneShell kicker={{ ja: "BM25", en: "BM25" }} title={{ ja: "TFの伸びを飽和させ、長さを補正する", en: "Saturate TF and normalize length" }}>
      <Abs x={130} y={250} w={780} h={530}>
        <Card tone="white" accent={colors.coral} style={{ width: "100%", height: "100%", padding: 32 }}>
          <Chip tone="coral" size={28}>{t({ ja: "TF-IDFは線形", en: "TF-IDF is linear" })}</Chip>
          <svg width={620} height={280} viewBox="0 0 620 280" style={{ position: "absolute", left: 82, top: 98 }}>
            <line x1={90} y1={236} x2={560} y2={236} stroke={colors.hairlineStrong} strokeWidth={3} />
            <line x1={90} y1={236} x2={90} y2={34} stroke={colors.hairlineStrong} strokeWidth={3} />
            <line x1={116} y1={214} x2={520} y2={52} stroke={colors.coral} strokeWidth={7} strokeLinecap="round" strokeDasharray="438" strokeDashoffset={438 * (1 - lineP)} />
          </svg>
          <Abs x={82} y={345} w={620}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
              <Term text="TF=1" />
              <Mono size={32}>→</Mono>
              <Term text="score ×1" done />
            </div>
            <div style={{ marginTop: 46, display: "flex", alignItems: "center", justifyContent: "space-around", opacity: progress(frame, cues[0] + 50, 16) }}>
              <Term text="TF=100" active />
              <Mono size={32}>→</Mono>
              <Term text="score ×100" active />
            </div>
          </Abs>
        </Card>
      </Abs>
      <Abs x={1010} y={250} w={780} h={530}>
        <Card tone="soft" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 32 }}>
          <Chip tone="teal" size={28}>{t({ ja: "BM25は飽和", en: "BM25 saturates" })}</Chip>
          <svg width={620} height={360} viewBox="0 0 620 360" style={{ position: "absolute", left: 82, top: 116 }}>
            <line x1={90} y1={310} x2={560} y2={310} stroke={colors.hairlineStrong} strokeWidth={3} />
            <line x1={90} y1={310} x2={90} y2={40} stroke={colors.hairlineStrong} strokeWidth={3} />
            <path d={path} fill="none" stroke={colors.teal} strokeWidth={7} strokeLinecap="round" strokeDasharray="720" strokeDashoffset={720 * (1 - curveP)} />
            <line x1={90} y1={132} x2={560} y2={132} stroke={colors.amber} strokeWidth={3} strokeDasharray="10 10" opacity={progress(frame, cues[1] + 24, 18)} />
            <text x={328} y={124} fontFamily={fonts.mono} fontSize={24} fill={colors.amber}>k1 + 1</text>
            <text x={308} y={350} textAnchor="middle" fontFamily={fonts.sans} fontSize={22} fill={colors.muted}>TF</text>
          </svg>
          <Abs x={1150} y={670} style={{ opacity: progress(frame, cues[2] - 12, 18) }}>
            <div style={{ display: "flex", gap: 16 }}>
              <Chip tone="amber" size={26}>{t({ ja: "k1: 1.2〜2.0", en: "k1: 1.2–2.0" })}</Chip>
              <Chip tone="coral" size={26}>{t({ ja: "b: 0.75", en: "b: 0.75" })}</Chip>
            </div>
          </Abs>
        </Card>
      </Abs>
      <Appear at={cues[1]} style={{ position: "absolute", left: 690, top: 806 }}>
        <Chip tone="teal" size={28}>{t({ ja: "長い文書のTF偏りも補正", en: "also corrects long-document TF bias" })}</Chip>
      </Appear>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 10. scale                                                                */
/* ------------------------------------------------------------------------ */

export function ScaleScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "実践", en: "In practice" }} title={{ ja: "圧縮し、分散し、最適化する", en: "Compress, shard, and optimize" }}>
      <Abs x={120} y={238} w={520} h={560}>
        <Card tone="white" accent={colors.teal} style={{ height: "100%", padding: 32 }}>
          <Chip tone="teal" size={27}>{t({ ja: "差分符号化", en: "delta encoding" })}</Chip>
          <div style={{ marginTop: 48, display: "grid", gap: 28 }}>
            <div><Label size={26} muted>{t({ ja: "元のリスト", en: "original list" })}</Label><Mono size={36}>[101, 105, 108, 120]</Mono></div>
            <div style={{ opacity: progress(frame, cues[0] + 16, 20) }}><Label size={26} muted>{t({ ja: "差分", en: "deltas" })}</Label><Mono size={36} color={colors.tealDeep}>[101, 4, 3, 12]</Mono></div>
            <div style={{ opacity: progress(frame, cues[0] + 34, 20) }}><Chip tone="teal" size={24}>{t({ ja: "小さい数を可変長バイトへ", en: "small numbers pack into variable bytes" })}</Chip></div>
          </div>
        </Card>
      </Abs>
      <Abs x={700} y={238} w={560} h={560}>
        <Card tone="soft" accent={colors.coral} style={{ height: "100%", padding: 32 }}>
          <Chip tone="coral" size={27}>{t({ ja: "分散と集約", en: "scatter-gather" })}</Chip>
          <Abs x={210} y={120}><Term text={t({ ja: "クエリ", en: "query" })} active /></Abs>
          <Abs x={38} y={310}>
            <Label size={26} muted>{t({ ja: "シャード", en: "shards" })}</Label>
          </Abs>
          {["A", "B", "C"].map((s, i) => (
            <Abs key={s} x={155 + i * 130} y={300}><Term text={s} done={frame >= cues[1]} /></Abs>
          ))}
          <Abs x={210} y={500} style={{ opacity: progress(frame, cues[1] + 46, 20) }}><Term text={t({ ja: "上位K", en: "top K" })} done /></Abs>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={965} y1={406} x2={892} y2={538} p={progress(frame, cues[1], 20)} color={colors.coral} width={5} bend={-34} />
        <Arrow x1={965} y1={406} x2={1022} y2={538} p={progress(frame, cues[1] + 4, 20)} color={colors.coral} width={5} />
        <Arrow x1={965} y1={406} x2={1152} y2={538} p={progress(frame, cues[1] + 8, 20)} color={colors.coral} width={5} bend={34} />
        <Arrow x1={892} y1={586} x2={965} y2={738} p={progress(frame, cues[1] + 44, 20)} color={colors.teal} width={5} bend={34} />
        <Arrow x1={1022} y1={586} x2={965} y2={738} p={progress(frame, cues[1] + 48, 20)} color={colors.teal} width={5} />
        <Arrow x1={1152} y1={586} x2={965} y2={738} p={progress(frame, cues[1] + 52, 20)} color={colors.teal} width={5} bend={-34} />
      </Svg>
      <Abs x={1320} y={238} w={480} h={560}>
        <Card tone="dark" style={{ height: "100%", padding: 32 }}>
          <Chip tone="coral" size={27}>{t({ ja: "Lucene内部", en: "inside Lucene" })}</Chip>
          <div style={{ marginTop: 54, display: "grid", gap: 28 }}>
            {[
              { ja: "セグメント化", en: "segmentation" },
              { ja: "スキップリスト", en: "skip lists" },
              { ja: "ブロック符号化", en: "block encoding" },
            ].map((label, i) => (
              <div key={label.en} style={{ opacity: Math.max(0.28, progress(frame, cues[2] + i * 10, 18)) }}>
                <div style={{ padding: "20px 24px", borderRadius: 16, background: colors.darkElevated, border: `2px solid ${i === 0 ? colors.coral : i === 1 ? colors.amber : colors.teal}` }}>
                  <div style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: colors.onDark }}>
                    {t(label)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 11. outro                                                                */
/* ------------------------------------------------------------------------ */

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  return (
    <EndCard slug="search-engine-internals" headline={{ ja: "検索の一瞬には、\nデータ構造とランキングが詰まっている", en: "Instant search is built from\nindexes, sets, and ranking" }}>
      <div style={{ marginTop: 44, display: "flex", gap: 18, opacity: progress(frame, 24, 22) }}>
        <Chip tone="teal" size={28}>{t({ ja: "転置インデックスの構築と検索", en: "build and search an inverted index" })}</Chip>
        <Chip tone="coral" size={28}>{t({ ja: "TF-IDF計算", en: "TF-IDF calculation" })}</Chip>
      </div>
    </EndCard>
  );
}
