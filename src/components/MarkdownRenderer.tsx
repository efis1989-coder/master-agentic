import { memo } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { Callout, parseCallout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { Mermaid } from "./Mermaid";
import { rehypeChapterLinks } from "./rehypeChapterLinks";

/**
 * Shared Markdown surface for the whole app. GFM tables/strikethrough and syntax
 * highlighting via rehype-highlight, plus three overrides: `pre` routes ```mermaid
 * fences to the lazy Mermaid renderer and every other fence through CodeBlock
 * (header + Copy button); `blockquote` promotes GitHub-style [!NOTE]/… markers to
 * Callout panels while leaving plain blockquotes untouched.
 */

// Minimal hast shapes for reading fenced-code language + raw text off the node.
interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: unknown };
  children?: HastNode[];
}

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

function fencedCode(node: HastNode | undefined): { lang?: string; text: string } {
  const code = node?.children?.find((c) => c.tagName === "code");
  const cls = code?.properties?.className;
  const classStr = Array.isArray(cls) ? cls.join(" ") : typeof cls === "string" ? cls : "";
  const lang = /language-(\w+)/.exec(classStr)?.[1];
  return { lang, text: code ? hastText(code) : "" };
}

const components: Components = {
  pre(props) {
    const { children, node } = props as { children?: React.ReactNode; node?: HastNode };
    const { lang, text } = fencedCode(node);
    if (lang === "mermaid") {
      return <Mermaid code={text.replace(/\n$/, "")} />;
    }
    return (
      <CodeBlock lang={lang} code={text}>
        {children}
      </CodeBlock>
    );
  },
  blockquote(props) {
    const { children } = props as { children?: React.ReactNode };
    const callout = parseCallout(children);
    if (callout) {
      return <Callout type={callout.type}>{callout.body}</Callout>;
    }
    return <blockquote>{children}</blockquote>;
  },
};

export const MarkdownRenderer = memo(function MarkdownRenderer({
  markdown,
}: {
  markdown: string;
}): React.JSX.Element {
  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeChapterLinks]}
        components={components}
      >
        {markdown}
      </Markdown>
    </div>
  );
});
