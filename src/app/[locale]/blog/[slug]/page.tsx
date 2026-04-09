import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { type Locale, locales } from "@/i18n/config";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/CodeBlock";
import { Mermaid } from "@/components/Mermaid";
import { remarkMermaid } from "@/lib/remark-mermaid";
import { SeattleVancouverMap } from "@/components/StorytellingMapLazy";
import {
  InteractiveDemo,
  GoRoutineVisualizer,
  GCVisualizer,
  GCTaxonomy,
  CircularRefDiagram,
  FragmentationDiagram,
  GenerationalHeapDiagram,
  ConcurrencyTimeline,
  PythonHybridDiagram,
  GCTimelineDiagram,
  BPlusTreeVisualizer,
  IndexTaxonomy,
  BTreeComparison,
  LSMWritePath,
  DiskIOComparison,
  DBIndexStrategies,
  EventLoopVisualizer,
  ConcurrencyTaxonomy,
  EventLoopCycle,
  CoroutineStateMachine,
  AsyncComparison,
  TypeSystemTaxonomy,
  StructuralVsNominal,
  TypeInferenceVisualizer,
  TypeSystemComparison,
  PaxosSimulator,
  RaftSimulator,
  PBFTSimulator,
  ConsensusTimeline,
  TwoPhaseCommitDiagram,
  ConsensusComparisonTable,
  FLPDiagram,
  RaftStateTransition,
  InvertedIndexVisualizer,
  TFIDFCalculator,
  SearchEnginePipeline,
  TokenizationDiagram,
  TFIDFDiagram,
  BooleanQueryDiagram,
  LLMTimeline,
  TransformerArchitecture,
  TrainingPipeline,
  ScalingLawsDiagram,
  LLMFamilyTree,
  BPETokenizationDiagram,
  SelfAttentionVisualizer,
  TextGenerationDemo,
  PositionalEncodingDiagram,
  PreLNvsPostLN,
  MultiHeadAttentionDiagram,
  CausalMaskDiagram,
  SwiGLUDiagram,
  RoPEDiagram,
  TransformerBlockVisualizer,
  ParadigmTimeline,
  ParadigmTaxonomy,
  ImperativeVsDeclarative,
  LambdaCalculusVisualizer,
  OOPVisualizer,
  ParadigmComparison,
  TestRunnerVisualizer,
  GraphTraversalVisualizer,
  DijkstraVisualizer,
  GraphRepresentationDiagram,
  TraversalComparisonTable,
  TraversalApplicationsDiagram,
  GraphComplexityTable,
  RandomWalk1DVisualizer,
  RandomWalkGraphVisualizer,
  PageRankVisualizer,
} from "@/components/interactive";

const rehypePrettyCodeOptions = {
  theme: { dark: "github-dark", light: "github-light" },
};

function getMdxComponents(locale: string) {
  return {
    pre: CodeBlock,
    Mermaid,
    SeattleVancouverMap: () => <SeattleVancouverMap locale={locale} />,
    InteractiveDemo,
    GoRoutineVisualizer: () => <GoRoutineVisualizer locale={locale} />,
    GCVisualizer: () => <GCVisualizer locale={locale} />,
    GCTaxonomy: () => <GCTaxonomy locale={locale} />,
    CircularRefDiagram: () => <CircularRefDiagram locale={locale} />,
    FragmentationDiagram: () => <FragmentationDiagram locale={locale} />,
    GenerationalHeapDiagram: () => <GenerationalHeapDiagram locale={locale} />,
    ConcurrencyTimeline: () => <ConcurrencyTimeline locale={locale} />,
    PythonHybridDiagram: () => <PythonHybridDiagram locale={locale} />,
    GCTimelineDiagram: () => <GCTimelineDiagram locale={locale} />,
    BPlusTreeVisualizer: () => <BPlusTreeVisualizer locale={locale} />,
    IndexTaxonomy: () => <IndexTaxonomy locale={locale} />,
    BTreeComparison: () => <BTreeComparison locale={locale} />,
    LSMWritePath: () => <LSMWritePath locale={locale} />,
    DiskIOComparison: () => <DiskIOComparison locale={locale} />,
    DBIndexStrategies: () => <DBIndexStrategies locale={locale} />,
    EventLoopVisualizer: () => <EventLoopVisualizer locale={locale} />,
    ConcurrencyTaxonomy: () => <ConcurrencyTaxonomy locale={locale} />,
    EventLoopCycle: () => <EventLoopCycle locale={locale} />,
    CoroutineStateMachine: () => <CoroutineStateMachine locale={locale} />,
    AsyncComparison: () => <AsyncComparison locale={locale} />,
    TypeSystemTaxonomy: () => <TypeSystemTaxonomy locale={locale} />,
    StructuralVsNominal: () => <StructuralVsNominal locale={locale} />,
    TypeInferenceVisualizer: () => <TypeInferenceVisualizer locale={locale} />,
    TypeSystemComparison: () => <TypeSystemComparison locale={locale} />,
    PaxosSimulator: () => <PaxosSimulator locale={locale} />,
    RaftSimulator: () => <RaftSimulator locale={locale} />,
    PBFTSimulator: () => <PBFTSimulator locale={locale} />,
    ConsensusTimeline: () => <ConsensusTimeline locale={locale} />,
    TwoPhaseCommitDiagram: () => <TwoPhaseCommitDiagram locale={locale} />,
    ConsensusComparisonTable: () => <ConsensusComparisonTable locale={locale} />,
    FLPDiagram: () => <FLPDiagram locale={locale} />,
    RaftStateTransition: () => <RaftStateTransition locale={locale} />,
    InvertedIndexVisualizer: () => <InvertedIndexVisualizer locale={locale} />,
    TFIDFCalculator: () => <TFIDFCalculator locale={locale} />,
    SearchEnginePipeline: () => <SearchEnginePipeline locale={locale} />,
    TokenizationDiagram: () => <TokenizationDiagram locale={locale} />,
    TFIDFDiagram: () => <TFIDFDiagram locale={locale} />,
    BooleanQueryDiagram: () => <BooleanQueryDiagram locale={locale} />,
    LLMTimeline: () => <LLMTimeline locale={locale} />,
    TransformerArchitecture: () => <TransformerArchitecture locale={locale} />,
    TrainingPipeline: () => <TrainingPipeline locale={locale} />,
    ScalingLawsDiagram: () => <ScalingLawsDiagram locale={locale} />,
    LLMFamilyTree: () => <LLMFamilyTree locale={locale} />,
    BPETokenizationDiagram: () => <BPETokenizationDiagram locale={locale} />,
    SelfAttentionVisualizer: () => <SelfAttentionVisualizer locale={locale} />,
    TextGenerationDemo: () => <TextGenerationDemo locale={locale} />,
    PositionalEncodingDiagram: () => <PositionalEncodingDiagram locale={locale} />,
    PreLNvsPostLN: () => <PreLNvsPostLN locale={locale} />,
    MultiHeadAttentionDiagram: () => <MultiHeadAttentionDiagram locale={locale} />,
    CausalMaskDiagram: () => <CausalMaskDiagram locale={locale} />,
    SwiGLUDiagram: () => <SwiGLUDiagram locale={locale} />,
    RoPEDiagram: () => <RoPEDiagram locale={locale} />,
    TransformerBlockVisualizer: () => <TransformerBlockVisualizer locale={locale} />,
    ParadigmTimeline: () => <ParadigmTimeline locale={locale} />,
    ParadigmTaxonomy: () => <ParadigmTaxonomy locale={locale} />,
    ImperativeVsDeclarative: () => <ImperativeVsDeclarative locale={locale} />,
    LambdaCalculusVisualizer: () => <LambdaCalculusVisualizer locale={locale} />,
    OOPVisualizer: () => <OOPVisualizer locale={locale} />,
    ParadigmComparison: () => <ParadigmComparison locale={locale} />,
    TestRunnerVisualizer: () => <TestRunnerVisualizer locale={locale} />,
    GraphTraversalVisualizer: () => <GraphTraversalVisualizer locale={locale} />,
    DijkstraVisualizer: () => <DijkstraVisualizer locale={locale} />,
    GraphRepresentationDiagram: () => <GraphRepresentationDiagram locale={locale} />,
    TraversalComparisonTable: () => <TraversalComparisonTable locale={locale} />,
    TraversalApplicationsDiagram: () => <TraversalApplicationsDiagram locale={locale} />,
    GraphComplexityTable: () => <GraphComplexityTable locale={locale} />,
    RandomWalk1DVisualizer: () => <RandomWalk1DVisualizer locale={locale} />,
    RandomWalkGraphVisualizer: () => <RandomWalkGraphVisualizer locale={locale} />,
    PageRankVisualizer: () => <PageRankVisualizer locale={locale} />,
  };
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale as Locale);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale as Locale);

  if (!post) {
    notFound();
  }

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <time className="text-sm text-muted-foreground">{post.date}</time>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-lg text-muted-foreground">{post.description}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MDXRemote
          source={post.content}
          components={getMdxComponents(locale)}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkMermaid, remarkGfm, remarkMath],
              rehypePlugins: [rehypeKatex, [rehypePrettyCode, rehypePrettyCodeOptions]],
            },
          }}
        />
      </div>
    </article>
  );
}
