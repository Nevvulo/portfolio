import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EditorYouTube } from "../components/EditorYouTube";

export interface YouTubeOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtube: {
      setYouTube: (attributes: { id: string }) => ReturnType;
    };
  }
}

export const YouTube = Node.create<YouTubeOptions>({
  name: "youtube",
  group: "block",
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "youtube-embed[data-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["youtube-embed", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditorYouTube);
  },

  addCommands() {
    return {
      setYouTube:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});

export default YouTube;
