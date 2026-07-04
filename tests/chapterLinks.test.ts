import { describe, expect, it } from "vitest";
import { rehypeChapterLinks } from "../src/components/rehypeChapterLinks";

// The plugin mutates a hast tree in place. We build tiny trees by hand rather
// than round-tripping Markdown, so the test stays focused on the rewrite rules.
// biome-ignore lint/suspicious/noExplicitAny: hand-built partial hast nodes.
type Node = any;

function run(tree: Node): Node {
  rehypeChapterLinks()(tree);
  return tree;
}

function root(...children: Node[]): Node {
  return { type: "root", children };
}
function text(value: string): Node {
  return { type: "text", value };
}
function el(tagName: string, ...children: Node[]): Node {
  return { type: "element", tagName, properties: {}, children };
}

describe("rehypeChapterLinks", () => {
  it("links a valid Ch. X.Y reference to its hash route", () => {
    const tree = run(root(el("p", text("See Ch. 3.4 for containment."))));
    const p = tree.children[0];
    const anchor = p.children.find((c: Node) => c.type === "element" && c.tagName === "a");
    expect(anchor).toBeDefined();
    expect(anchor.properties.href).toBe("#/read/ch-3-4");
    expect(anchor.children[0].value).toBe("Ch. 3.4");
  });

  it("keeps the surrounding text around the link", () => {
    const tree = run(root(el("p", text("See Ch. 3.4 now."))));
    const values = tree.children[0].children.map((c: Node) =>
      c.type === "text" ? c.value : `[${c.children[0].value}]`,
    );
    expect(values).toEqual(["See ", "[Ch. 3.4]", " now."]);
  });

  it("leaves unknown chapters as plain text", () => {
    const tree = run(root(el("p", text("Ch. 9.9 does not exist."))));
    expect(tree.children[0].children).toHaveLength(1);
    expect(tree.children[0].children[0].type).toBe("text");
  });

  it("does not rewrite inside code elements", () => {
    const tree = run(root(el("code", text("Ch. 3.4"))));
    expect(tree.children[0].children[0].type).toBe("text");
  });
});
