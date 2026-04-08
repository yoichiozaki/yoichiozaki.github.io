import { visit } from "unist-util-visit";

/**
 * Remark plugin that converts ```mermaid code blocks into <Mermaid chart="..." />
 * JSX elements BEFORE rehype-pretty-code (Shiki) can process them.
 *
 * This prevents Shiki from tokenizing/encoding mermaid syntax, which would
 * corrupt the chart text before the client-side Mermaid renderer sees it.
 */
export function remarkMermaid() {
  return (tree: import("mdast").Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || index === undefined || !parent) return;

      // Replace the code node with an MDX JSX element that the MDX compiler
      // will resolve against the components map.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (parent.children as any[])[index] = {
        type: "mdxJsxFlowElement",
        name: "Mermaid",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "chart",
            value: node.value,
          },
        ],
        children: [],
      };
    });
  };
}
