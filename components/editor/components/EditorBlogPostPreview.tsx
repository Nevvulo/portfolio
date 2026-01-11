import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BlogPostPreviewWrapper, ComponentWrapper } from "../styles";

export function EditorBlogPostPreview({ node, selected, updateAttributes }: NodeViewProps) {
  const id = node.attrs.id as string | undefined;
  const post = useQuery(api.blogPosts.getBySlug, id ? { slug: id } : "skip");

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ id: e.target.value });
  };

  return (
    <NodeViewWrapper>
      <ComponentWrapper $selected={selected}>
        <BlogPostPreviewWrapper>
          <div className="preview-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            <span>Blog Post Preview</span>
          </div>

          {!id ? (
            <div style={{ padding: "8px 0" }}>
              <input
                type="text"
                placeholder="Enter post slug..."
                value={id ?? ""}
                onChange={handleIdChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid rgba(165, 163, 245, 0.3)",
                  borderRadius: "4px",
                  background: "transparent",
                  color: "inherit",
                  fontSize: "14px",
                }}
              />
            </div>
          ) : post === undefined ? (
            <div className="preview-loading">Loading post...</div>
          ) : post === null ? (
            <div className="preview-loading">Post not found: {id}</div>
          ) : (
            <>
              <div className="preview-title">{post.title}</div>
              <div className="preview-description">{post.description}</div>
            </>
          )}
        </BlogPostPreviewWrapper>
      </ComponentWrapper>
    </NodeViewWrapper>
  );
}

export default EditorBlogPostPreview;
