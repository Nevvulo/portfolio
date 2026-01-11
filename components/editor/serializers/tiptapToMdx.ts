import type { JSONContent } from "@tiptap/react";

interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
}

function serializeMarks(text: string, marks?: Mark[]): string {
  if (!marks || marks.length === 0) return text;

  let result = text;

  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        result = `**${result}**`;
        break;
      case "italic":
        result = `*${result}*`;
        break;
      case "code":
        result = `\`${result}\``;
        break;
      case "link":
        result = `[${result}](${mark.attrs?.href || ""})`;
        break;
      case "strike":
        result = `~~${result}~~`;
        break;
    }
  }

  return result;
}

function serializeInlineContent(content?: JSONContent[]): string {
  if (!content) return "";

  return content
    .map((node) => {
      if (node.type === "text") {
        return serializeMarks(node.text || "", node.marks as Mark[] | undefined);
      }
      if (node.type === "hardBreak") {
        return "\n";
      }
      return "";
    })
    .join("");
}

function serializeNode(node: JSONContent, indent = ""): string {
  switch (node.type) {
    case "doc":
      return (node.content || []).map((n) => serializeNode(n)).join("\n\n");

    case "paragraph":
      return serializeInlineContent(node.content);

    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      const prefix = "#".repeat(level);
      return `${prefix} ${serializeInlineContent(node.content)}`;
    }

    case "codeBlock": {
      const lang = (node.attrs?.language as string) || "";
      const code = node.content?.[0]?.text || "";
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case "blockquote": {
      const content = (node.content || [])
        .map((n) => serializeNode(n))
        .join("\n\n");
      return content
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    }

    case "bulletList": {
      return (node.content || [])
        .map((item) => {
          const itemContent = serializeNode(item, indent);
          return `${indent}- ${itemContent}`;
        })
        .join("\n");
    }

    case "orderedList": {
      return (node.content || [])
        .map((item, index) => {
          const itemContent = serializeNode(item, indent);
          return `${indent}${index + 1}. ${itemContent}`;
        })
        .join("\n");
    }

    case "listItem": {
      // List item content - join paragraphs with line breaks
      return (node.content || [])
        .map((n) => serializeNode(n, indent + "  "))
        .join("\n" + indent + "  ");
    }

    case "horizontalRule":
      return "---";

    case "image": {
      const { src, alt, title } = node.attrs || {};
      if (title) {
        return `![${alt || ""}](${src} "${title}")`;
      }
      return `![${alt || ""}](${src})`;
    }

    case "blogPostPreview": {
      const id = node.attrs?.id || "";
      return `<BlogPostPreview id="${id}" />`;
    }

    case "youtube": {
      const id = node.attrs?.id || "";
      return `<YouTube id="${id}" />`;
    }

    case "callout": {
      const type = node.attrs?.type || "info";
      const content = (node.content || [])
        .map((n) => serializeNode(n))
        .join("\n\n");
      return `<Callout type="${type}">\n${content}\n</Callout>`;
    }

    case "codePlayground": {
      const language = node.attrs?.language || "javascript";
      const code = node.attrs?.code || "";
      return `<CodePlayground language="${language}">\n${code}\n</CodePlayground>`;
    }

    default:
      // Unknown node type - try to serialize content
      if (node.content) {
        return (node.content || []).map((n) => serializeNode(n)).join("\n\n");
      }
      return "";
  }
}

export function tiptapToMdx(doc: JSONContent): string {
  if (!doc || doc.type !== "doc") {
    return "";
  }

  return serializeNode(doc).trim();
}

export default tiptapToMdx;
