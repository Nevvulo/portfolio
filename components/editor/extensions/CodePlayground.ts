import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EditorCodePlayground } from "../components/EditorCodePlayground";

export interface CodePlaygroundOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    codePlayground: {
      setCodePlayground: (attributes?: { language?: string }) => ReturnType;
    };
  }
}

export const CodePlayground = Node.create<CodePlaygroundOptions>({
  name: "codePlayground",
  group: "block",
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      language: {
        default: "javascript",
      },
      code: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'code-playground',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["code-playground", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditorCodePlayground);
  },

  addCommands() {
    return {
      setCodePlayground:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              language: attributes?.language || "javascript",
              code: "",
            },
          });
        },
    };
  },
});

export default CodePlayground;
