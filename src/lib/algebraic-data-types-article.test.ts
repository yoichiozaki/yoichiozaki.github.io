import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import messagesJa from "../../messages/ja.json";
import messagesEn from "../../messages/en.json";
import {
  exhaustivenessModes,
  exhaustivenessSource,
} from "./algebraic-data-types";

const root = resolve(__dirname, "..", "..");
const slug = "algebraic-data-types-in-practice";
const articles = ["ja", "en"].map((locale) => ({
  locale,
  source: readFileSync(
    resolve(root, "content", "blog", locale, `${slug}.mdx`),
    "utf8",
  ),
}));

function snippets(source: string): string[] {
  return Array.from(
    source.matchAll(/^```typescript\r?\n([\s\S]*?)^```[ \t]*$/gm),
    (match) => match[1].trim(),
  );
}

function diagnostics(source: string): readonly ts.Diagnostic[] {
  const filename = resolve(root, "__adt_typecheck__.ts");
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    types: [],
    skipLibCheck: true,
  };
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreateNew) =>
    resolve(name) === filename
      ? ts.createSourceFile(name, source, languageVersion, true)
      : originalGetSourceFile(name, languageVersion, onError, shouldCreateNew);
  const program = ts.createProgram([filename], options, host);
  return ts.getPreEmitDiagnostics(program);
}

function errors(source: string): string[] {
  return diagnostics(source).map((diagnostic) =>
    `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`,
  );
}

function declarations(source: string): Map<string, string> {
  const file = ts.createSourceFile("model.ts", source, ts.ScriptTarget.ES2022, true);
  const printer = ts.createPrinter({ removeComments: true });
  const result = new Map<string, string>();
  for (const statement of file.statements) {
    if (
      (ts.isTypeAliasDeclaration(statement) ||
        ts.isFunctionDeclaration(statement)) &&
      statement.name
    ) {
      result.set(
        statement.name.text,
        printer.printNode(ts.EmitHint.Unspecified, statement, file)
          .replace(/^export\s+/, ""),
      );
    }
  }
  return result;
}

function evaluateExample(source: string): unknown {
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return runInNewContext(output, {}, { timeout: 1000 });
}

describe("ADT compiler experiment", () => {
  it.each(exhaustivenessModes)(
    "verifies the displayed diagnostics with TypeScript: %s",
    (mode) => {
      expect(diagnostics(exhaustivenessSource(mode)).map((error) => error.code))
        .toEqual(mode === "extended" ? [2345] : []);
    },
  );

  it("demonstrates the actual default behavior, rather than just a warning label", () => {
    for (const [mode, expected] of [
      ["fixed", "Cancelled"],
      ["fallback", "Ready"],
    ] as const) {
      const source = `${exhaustivenessSource(mode)}\nlabel({ kind: "cancelled" });`;
      expect(evaluateExample(source)).toBe(expected);
    }
  });
});

describe("ADT bilingual article contract", () => {
  const source = snippets(articles[0].source).join("\n\n");
  const library = readFileSync(
    resolve(root, "src", "lib", "algebraic-data-types.ts"),
    "utf8",
  );

  it("keeps all TypeScript examples identical between languages", () => {
    expect(snippets(articles[0].source).length).toBeGreaterThan(10);
    expect(snippets(articles[1].source)).toEqual(snippets(articles[0].source));
  });

  it("compiles all examples together, including checked intentional errors", () => {
    expect(errors(source)).toEqual([]);
  });

  it("proves the three intentionally invalid examples really fail type checking", () => {
    const withoutDirectives = source.replace(
      /^\s*\/\/ @ts-expect-error[^\r\n]*$/gm,
      "",
    );
    expect(diagnostics(withoutDirectives).map((error) => error.code).sort())
      .toEqual([2322, 2339, 2345]);
  });

  it("keeps the article's domain model identical to the model used by the demos", () => {
    const articleDeclarations = declarations(source);
    const modelDeclarations = declarations(library);
    for (const name of [
      "Result", "RemoteData", "assertNever", "OrderFields", "DraftOrder",
      "PaidOrder", "RefundedOrder", "Order", "DecodeError", "decodeDraft",
      "parseDraftJson", "recordPayment", "recordRefund", "OrderEvent",
      "TransitionError", "applyOrderEvent",
    ]) {
      expect(articleDeclarations.has(name), name).toBe(true);
      expect(articleDeclarations.get(name), name).toBe(modelDeclarations.get(name));
    }
  });

  it("checks the structural-typing caveat with the actual compiler", () => {
    const remoteData = declarations(source).get("RemoteData");
    expect(errors(`${remoteData}
const extra = { kind: "success" as const, data: "ok", error: "extra" };
const accepted: RemoteData<string, string> = extra;
`)).toEqual([]);
  });

  it("distinguishes constructing a negative amount from mutating a readonly field", () => {
    const model = declarations(source);
    const construction = `${model.get("OrderFields")}
${model.get("DraftOrder")}
const negativeDraft: DraftOrder = {
  kind: "draft", orderId: "order-42", amountYen: -1,
};`;
    expect(errors(construction)).toEqual([]);
    expect(diagnostics(`${construction}\nnegativeDraft.amountYen = 1;`)
      .map((error) => error.code)).toEqual([2540]);
  });

  it("requires a new state fixture even when the event dispatcher still rejects it", () => {
    const extended = source.replace(
      "type Order = DraftOrder | PaidOrder | RefundedOrder;",
      'type Order = DraftOrder | PaidOrder | RefundedOrder | (OrderFields & { readonly kind: "cancelled" });',
    );
    expect(diagnostics(extended).map((error) => error.code)).toEqual([1360]);
    expect(errors(extended)[0]).toContain("cancelled");
  });

  it("runs the article's consumer example and preserves orders on either failure path", () => {
    expect(evaluateExample(`${source}
(() => {
  const invalidInput = loadDraftIntoScreen(orderScreen, '{"kind":"draft"}');
  const invalidEvent = dispatchToScreen(orderScreen, {
    type: "refund-recorded", refundId: "another-refund",
  });
  return {
    finalState: orderScreen.order.kind,
    total: orderScreen.order.amountYen,
    inputPreserved: invalidInput.order === orderScreen.order,
    eventPreserved: invalidEvent.order === orderScreen.order,
    inputNotice: invalidInput.notice,
    eventNotice: invalidEvent.notice,
  };
})()
`)).toEqual({
      finalState: "refunded",
      total: 1200,
      inputPreserved: true,
      eventPreserved: true,
      inputNotice: "Input rejected: invalid-order-id",
      eventNotice: "Operation rejected: refunded + refund-recorded",
    });
  });

  it("runs interchangeable gateway implementations through the same consumer", async () => {
    expect(await evaluateExample(`${source}\ngatewayExamples()`)).toEqual([
      "Paid: test-payment",
      "Declined: TEST_DECLINE",
    ]);
    expect(await evaluateExample(`${source}
chargeNotice(
  {
    charge: async (_order, attempt) => ({
      ok: false,
      error: { kind: "outcome-unknown", attemptId: attempt.attemptId },
    }),
  },
  exampleDraft,
  { attemptId: "attempt-unknown", idempotencyKey: "key-unknown" },
)
`)).toBe("Check attempt: attempt-unknown");
  });

  it("forces outcome handling when the gateway result gains an alternative", () => {
    const extended = source.replace(
      "type ChargeFailure =",
      'type ChargeFailure =\n  | { readonly kind: "requires-action" }',
    );
    expect(diagnostics(extended).map((error) => error.code)).toEqual([2345]);
    expect(errors(extended)[0]).toContain("requires-action");
  });

  it("does not turn unexpected gateway failures into business declines", async () => {
    const rejected = evaluateExample(`${source}
chargeNotice(
  { charge: async () => { throw new Error("BUG_IN_ADAPTER"); } },
  exampleDraft,
  { attemptId: "attempt-bug", idempotencyKey: "key-bug" },
)
`);
    await expect(rejected).rejects.toThrow("BUG_IN_ADAPTER");
  });

  it("registers all four experiments in both articles and the MDX component map", () => {
    const page = readFileSync(
      resolve(root, "src", "app", "[locale]", "blog", "[slug]", "page.tsx"),
      "utf8",
    );
    const index = readFileSync(
      resolve(root, "src", "components", "interactive", "index.ts"),
      "utf8",
    );
    for (const name of [
      "ADTStateSpace", "ADTExhaustivenessLab", "ADTBoundaryLab", "ADTExtensionMatrix",
    ]) {
      expect(page).toContain(`${name}: () => <${name} locale={locale} />`);
      expect(index).toContain(name);
      for (const article of articles) {
        expect(article.source.match(new RegExp(`<${name} />`, "g"))).toHaveLength(1);
      }
    }
  });

  it("keeps local article links resolvable in their own locale", () => {
    for (const article of articles) {
      for (const match of article.source.matchAll(/\]\(\/(ja|en)\/blog\/([^/)]+)\/?\)/g)) {
        expect(match[1]).toBe(article.locale);
        expect(existsSync(resolve(root, "content", "blog", match[1], `${match[2]}.mdx`)))
          .toBe(true);
      }
    }
  });

  it("keeps translation keys aligned", () => {
    function keys(value: unknown, prefix = ""): string[] {
      if (typeof value !== "object" || value === null) {
        expect(typeof value).toBe("string");
        expect(value).not.toBe("");
        return [prefix];
      }
      return Object.entries(value).flatMap(([key, child]) =>
        keys(child, `${prefix}.${key}`),
      ).sort();
    }
    expect(keys(messagesJa.adt)).toEqual(keys(messagesEn.adt));
  });

  it.each(articles)("preserves scroll-region focus and reading links in real MDX: $locale", async (article) => {
    const compiled = await serialize(article.source, {
      parseFrontmatter: true,
      mdxOptions: { remarkPlugins: [remarkGfm] },
    });
    expect(compiled.compiledSource.match(/tabIndex:\s*"0"/g)).toHaveLength(5);
    expect(compiled.compiledSource.match(/role:\s*"region"/g)).toHaveLength(5);
    const anchors = Array.from(
      article.source.matchAll(/\]\(#([a-z-]+)\)/g),
      (match) => match[1],
    );
    expect(anchors).toEqual([
      "state-modeling", "inheritance-and-unions", "payment-attempts",
    ]);
    for (const anchor of anchors) {
      expect(article.source.match(new RegExp(`id="${anchor}"`, "g"))).toHaveLength(1);
      expect(compiled.compiledSource).toMatch(new RegExp(`id:\\s*"${anchor}"`));
    }
  });
});
