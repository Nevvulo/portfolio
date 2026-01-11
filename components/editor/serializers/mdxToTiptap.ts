import type { JSONContent } from "@tiptap/react";
import type { Content, InlineCode, Text as MdastText, PhrasingContent, Root } from "mdast";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

type MdastNode = Content | Root;

function getJsxAttribute(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  name: string,
): string | undefined {
  const attr = node.attributes.find((a) => a.type === "mdxJsxAttribute" && a.name === name);
  if (attr && attr.type === "mdxJsxAttribute") {
    if (typeof attr.value === "string") {
      return attr.value;
    }
  }
  return undefined;
}

function getTextContent(node: MdxJsxFlowElement | MdxJsxTextElement): string {
  let text = "";
  visit(node, "text", (textNode: MdastText) => {
    text += textNode.value;
  });
  return text;
}

function convertInlineContent(children: PhrasingContent[]): JSONContent[] {
  const result: JSONContent[] = [];

  for (const child of children) {
    switch (child.type) {
      case "text":
        result.push({ type: "text", text: child.value });
        break;

      case "strong":
        if (child.children) {
          const content = convertInlineContent(child.children);
          for (const item of content) {
            result.push({
              ...item,
              marks: [...(item.marks || []), { type: "bold" }],
            });
          }
        }
        break;

      case "emphasis":
        if (child.children) {
          const content = convertInlineContent(child.children);
          for (const item of content) {
            result.push({
              ...item,
              marks: [...(item.marks || []), { type: "italic" }],
            });
          }
        }
        break;

      case "inlineCode":
        result.push({
          type: "text",
          text: (child as InlineCode).value,
          marks: [{ type: "code" }],
        });
        break;

      case "link":
        if (child.children) {
          const content = convertInlineContent(child.children);
          for (const item of content) {
            result.push({
              ...item,
              marks: [...(item.marks || []), { type: "link", attrs: { href: child.url } }],
            });
          }
        }
        break;

      default:
        // Handle other inline elements as text if possible
        if ("value" in child && typeof child.value === "string") {
          result.push({ type: "text", text: child.value });
        }
    }
  }

  return result;
}

function convertNode(node: MdastNode): JSONContent | JSONContent[] | null {
  switch (node.type) {
    case "root":
      return {
        type: "doc",
        content: (node as Root).children
          .flatMap(convertNode)
          .filter((n): n is JSONContent => n !== null),
      };

    case "paragraph":
      return {
        type: "paragraph",
        content: convertInlineContent(node.children || []),
      };

    case "heading":
      return {
        type: "heading",
        attrs: { level: node.depth },
        content: convertInlineContent(node.children || []),
      };

    case "code":
      return {
        type: "codeBlock",
        attrs: { language: node.lang || "" },
        content: [{ type: "text", text: node.value }],
      };

    case "blockquote":
      return {
        type: "blockquote",
        content: (node.children || [])
          .flatMap(convertNode)
          .filter((n): n is JSONContent => n !== null),
      };

    case "list":
      return {
        type: node.ordered ? "orderedList" : "bulletList",
        content: (node.children || [])
          .flatMap(convertNode)
          .filter((n): n is JSONContent => n !== null),
      };

    case "listItem":
      return {
        type: "listItem",
        content: (node.children || [])
          .flatMap(convertNode)
          .filter((n): n is JSONContent => n !== null),
      };

    case "thematicBreak":
      return { type: "horizontalRule" };

    case "image":
      return {
        type: "image",
        attrs: {
          src: node.url,
          alt: node.alt || "",
          title: node.title || null,
        },
      };

    case "mdxJsxFlowElement":
    case "mdxJsxTextElement": {
      const jsxNode = node as MdxJsxFlowElement | MdxJsxTextElement;
      const name = jsxNode.name;

      switch (name) {
        case "BlogPostPreview":
          return {
            type: "blogPostPreview",
            attrs: { id: getJsxAttribute(jsxNode, "id") || "" },
          };

        case "YouTube":
          return {
            type: "youtube",
            attrs: { id: getJsxAttribute(jsxNode, "id") || "" },
          };

        case "Callout":
          return {
            type: "callout",
            attrs: { type: getJsxAttribute(jsxNode, "type") || "info" },
            content: jsxNode.children
              ? (jsxNode.children as Content[])
                  .flatMap(convertNode)
                  .filter((n): n is JSONContent => n !== null)
              : [{ type: "paragraph" }],
          };

        case "CodePlayground":
          return {
            type: "codePlayground",
            attrs: {
              language: getJsxAttribute(jsxNode, "language") || "javascript",
              code: getTextContent(jsxNode),
            },
          };

        default:
          // Unknown JSX component - preserve as paragraph with raw text
          return {
            type: "paragraph",
            content: [{ type: "text", text: `<${name} />` }],
          };
      }
    }

    default:
      return null;
  }
}

export async function mdxToTiptap(mdx: string): Promise<JSONContent> {
  if (!mdx || !mdx.trim()) {
    return {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
  }

  try {
    const processor = unified().use(remarkParse).use(remarkMdx);

    const ast = processor.parse(mdx);
    const result = convertNode(ast as Root);

    if (result && !Array.isArray(result)) {
      return result;
    }

    return {
      type: "doc",
      content: Array.isArray(result) ? result : [{ type: "paragraph" }],
    };
  } catch (error) {
    console.error("Failed to parse MDX:", error);
    // Return a basic document with the raw content as a paragraph
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: mdx }],
        },
      ],
    };
  }
}

export default mdxToTiptap;
