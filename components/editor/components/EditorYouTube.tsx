import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { ComponentWrapper, YouTubeWrapper } from "../styles";

export function EditorYouTube({ node, selected, updateAttributes }: NodeViewProps) {
  const id = (node.attrs.id || "") as string;
  const [inputValue, setInputValue] = useState(id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Extract video ID from various YouTube URL formats
    let videoId = inputValue;

    // Handle full URLs
    const urlMatch = inputValue.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (urlMatch?.[1]) {
      videoId = urlMatch[1];
    }

    updateAttributes({ id: videoId });
  };

  return (
    <NodeViewWrapper>
      <ComponentWrapper $selected={selected}>
        {!id ? (
          <div
            style={{
              padding: "24px",
              background: "rgba(0, 0, 0, 0.2)",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
              </svg>
              <span>YouTube Video</span>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Paste YouTube URL or video ID..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid rgba(165, 163, 245, 0.3)",
                  borderRadius: "6px",
                  background: "transparent",
                  color: "inherit",
                  fontSize: "14px",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#a5a3f5",
                  color: "#1e1e3f",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Embed
              </button>
            </form>
          </div>
        ) : (
          <YouTubeWrapper>
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </YouTubeWrapper>
        )}
      </ComponentWrapper>
    </NodeViewWrapper>
  );
}

export default EditorYouTube;
