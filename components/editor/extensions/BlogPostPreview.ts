import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EditorBlogPostPreview } from "../components/EditorBlogPostPreview";

export interface BlogPostPreviewOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blogPostPreview: {
      setBlogPostPreview: (attributes: { id: string }) => ReturnType;
    };
  }
}

export const BlogPostPreview = Node.create<BlogPostPreviewOptions>({
  name: "blogPostPreview",
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
        tag: 'blog-post-preview[data-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["blog-post-preview", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EditorBlogPostPreview);
  },

  addCommands() {
    return {
      setBlogPostPreview:
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

export default BlogPostPreview;
