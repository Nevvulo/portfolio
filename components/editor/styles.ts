import styled from "styled-components";

export const EditorContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 8px;
  overflow: hidden;
  background: ${(p) => p.theme.background};
`;

export const EditorToolbarWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  background: ${(p) => p.theme.backgroundSecondary};
  border-bottom: 1px solid ${(p) => p.theme.border};
`;

export const ToolbarButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: ${(p) => (p.$active ? "rgba(79, 77, 193, 0.2)" : "transparent")};
  color: ${(p) => (p.$active ? "#a5a3f5" : p.theme.textColor)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.15);
    color: #a5a3f5;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ToolbarDivider = styled.div`
  width: 1px;
  height: 24px;
  background: ${(p) => p.theme.border};
  margin: 0 4px;
`;

export const EditorContentWrapper = styled.div`
  flex: 1;
  min-height: 400px;
  max-height: 70vh;
  overflow-y: auto;

  .tiptap {
    padding: 20px;
    min-height: 400px;
    outline: none;
    color: ${(p) => p.theme.textColor};
    font-family: var(--font-sans);
    line-height: 1.8;

    > * + * {
      margin-top: 0.75em;
    }

    /* Placeholder */
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: ${(p) => p.theme.textMuted};
      pointer-events: none;
      height: 0;
    }

    /* Headings */
    h1 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-size: 1.9em;
      letter-spacing: -1.25px;
      color: ${(p) => p.theme.contrast};
      font-weight: 700;

      @media (max-width: 768px) {
        font-size: 1.5em;
      }
    }

    h2 {
      margin-top: 2em;
      margin-bottom: 0.75em;
      font-family: var(--font-mono);
      letter-spacing: -1.25px;
      font-size: 1.5em;
      font-weight: 600;
      color: ${(p) => p.theme.contrast};

      @media (max-width: 768px) {
        font-size: 1.25em;
      }
    }

    h3 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-size: 1.25em;
      font-weight: 600;
      color: ${(p) => p.theme.contrast};
    }

    h4 {
      margin-top: 1.25em;
      margin-bottom: 0.5em;
      font-size: 1.1em;
      font-weight: 600;
      color: ${(p) => p.theme.contrast};
    }

    /* Paragraphs */
    p {
      color: ${(p) => p.theme.textColor};
      line-height: 1.85;
      font-size: 1.1em;
      font-weight: 400;
      letter-spacing: 0.2px;
      margin: 1.25em 0;

      @media (max-width: 768px) {
        font-size: 1em;
        line-height: 1.75;
      }
    }

    /* Bold */
    strong {
      color: ${(p) => p.theme.contrast};
      font-weight: 600;
    }

    /* Italic */
    em {
      font-style: italic;
    }

    /* Links */
    a {
      color: #a5a3f5;
      text-decoration: underline;
      text-decoration-thickness: 0.125em;
      cursor: pointer;

      &:hover {
        color: #8b88e8;
      }
    }

    /* Lists */
    ul {
      padding-left: 0;
      list-style: none;
      margin: 1em 0;

      li {
        position: relative;
        padding-left: 1.5em;
        margin-bottom: 0.5em;
        line-height: 1.75;

        &::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #a5a3f5;
          font-weight: bold;
          font-size: 1.2em;
        }
      }
    }

    ol {
      padding-left: 0;
      list-style: none;
      counter-reset: editor-list-counter;
      margin: 1em 0;

      li {
        counter-increment: editor-list-counter;
        position: relative;
        padding-left: 2.5em;
        margin-bottom: 0.75em;
        line-height: 1.75;

        &::before {
          content: counter(editor-list-counter);
          position: absolute;
          left: 0;
          top: 0;
          width: 1.6em;
          height: 1.6em;
          background: linear-gradient(135deg, rgba(79, 77, 193, 0.3), rgba(79, 77, 193, 0.15));
          border: 1px solid rgba(79, 77, 193, 0.5);
          border-radius: 50%;
          font-size: 0.85em;
          font-weight: 600;
          color: #a5a3f5;
          font-family: var(--font-mono);
          text-align: center;
          line-height: 1.6em;
        }
      }
    }

    /* Code */
    code {
      background: rgba(79, 77, 193, 0.15);
      border-radius: 4px;
      padding: 0.2em 0.4em;
      font-family: var(--font-mono);
      font-size: 0.9em;
      color: #a5a3f5;
    }

    /* Code blocks */
    pre {
      background: #1e1e3f;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin: 1.5em 0;

      code {
        background: none;
        padding: 0;
        color: inherit;
        font-size: 0.9em;
        line-height: 1.6;
      }
    }

    /* Blockquote */
    blockquote {
      border-left: 4px solid #a5a3f5;
      padding-left: 1em;
      margin: 1.5em 0;
      color: ${(p) => p.theme.textMuted};
      font-style: italic;
    }

    /* Horizontal rule */
    hr {
      border: none;
      border-top: 1px solid ${(p) => p.theme.border};
      margin: 2em 0;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.5em 0;
    }

    /* Selection */
    ::selection {
      background: rgba(79, 77, 193, 0.3);
    }
  }

  @media (max-width: 768px) {
    min-height: 300px;
    max-height: 60vh;

    .tiptap {
      padding: 16px;
      min-height: 300px;
    }
  }
`;

// Slash command menu styles
export const SlashCommandMenu = styled.div`
  position: absolute;
  background: ${(p) => p.theme.backgroundSecondary};
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-height: 320px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 220px;
`;

export const SlashCommandItem = styled.button<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: ${(p) => (p.$selected ? "rgba(79, 77, 193, 0.15)" : "transparent")};
  color: ${(p) => p.theme.textColor};
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.15);
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

export const SlashCommandIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(79, 77, 193, 0.2);
  color: #a5a3f5;
  font-size: 14px;
`;

export const SlashCommandText = styled.div`
  flex: 1;
`;

export const SlashCommandTitle = styled.div`
  font-weight: 500;
  font-size: 14px;
`;

export const SlashCommandDescription = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.textMuted};
  margin-top: 2px;
`;

// Custom component wrapper styles
export const ComponentWrapper = styled.div<{ $selected?: boolean }>`
  border: 2px solid ${(p) => (p.$selected ? "#a5a3f5" : "transparent")};
  border-radius: 8px;
  margin: 1em 0;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: rgba(79, 77, 193, 0.3);
  }
`;

// Callout styles
export const CalloutWrapper = styled.div<{ $type: "info" | "warning" | "tip" }>`
  padding: 16px;
  border-radius: 8px;
  margin: 1em 0;
  background: ${(p) =>
    ({
      info: "rgba(88, 101, 242, 0.1)",
      warning: "rgba(245, 158, 11, 0.1)",
      tip: "rgba(16, 185, 129, 0.1)",
    })[p.$type]};
  border-left: 4px solid
    ${(p) =>
      ({
        info: "#5865f2",
        warning: "#f59e0b",
        tip: "#10b981",
      })[p.$type]};

  .callout-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 600;
    color: ${(p) =>
      ({
        info: "#5865f2",
        warning: "#f59e0b",
        tip: "#10b981",
      })[p.$type]};
  }

  .callout-content {
    color: ${(p) => p.theme.textColor};

    p:first-child {
      margin-top: 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
  }
`;

// YouTube embed styles
export const YouTubeWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  margin: 1.5em 0;
  border-radius: 8px;
  overflow: hidden;
  background: #000;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

// Blog post preview styles
export const BlogPostPreviewWrapper = styled.div`
  padding: 16px;
  border-radius: 8px;
  background: ${(p) => p.theme.backgroundSecondary};
  border: 1px solid ${(p) => p.theme.border};
  margin: 1em 0;

  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 12px;
    color: ${(p) => p.theme.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .preview-title {
    font-size: 1.1em;
    font-weight: 600;
    color: ${(p) => p.theme.contrast};
    margin-bottom: 4px;
  }

  .preview-description {
    font-size: 0.9em;
    color: ${(p) => p.theme.textMuted};
    line-height: 1.5;
  }

  .preview-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: ${(p) => p.theme.textMuted};
  }
`;

// Code playground styles
export const CodePlaygroundWrapper = styled.div`
  border-radius: 8px;
  overflow: hidden;
  margin: 1.5em 0;
  background: #1e1e3f;
  border: 1px solid ${(p) => p.theme.border};

  .playground-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .playground-language {
    font-size: 12px;
    color: #a5a3f5;
    font-family: var(--font-mono);
  }

  .playground-run {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border: none;
    border-radius: 4px;
    background: #a5a3f5;
    color: #1e1e3f;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;

    &:hover {
      background: #8b88e8;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .playground-code {
    padding: 16px;
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.6;
    color: #e0def4;
    min-height: 100px;
    outline: none;

    &:empty::before {
      content: "// Write your code here...";
      color: rgba(255, 255, 255, 0.3);
    }
  }

  .playground-output {
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-family: var(--font-mono);
    font-size: 13px;
    color: #a5a3f5;
    white-space: pre-wrap;
    max-height: 200px;
    overflow-y: auto;

    .error {
      color: #f87171;
    }
  }
`;

// Image upload styles
export const ImageUploadWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  margin: 1em 0;
  border: 2px dashed ${(p) => p.theme.border};
  border-radius: 8px;
  background: ${(p) => p.theme.backgroundSecondary};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #a5a3f5;
    background: rgba(79, 77, 193, 0.05);
  }

  &.dragging {
    border-color: #a5a3f5;
    background: rgba(79, 77, 193, 0.1);
  }

  .upload-icon {
    font-size: 32px;
    color: ${(p) => p.theme.textMuted};
    margin-bottom: 12px;
  }

  .upload-text {
    font-size: 14px;
    color: ${(p) => p.theme.textMuted};
    text-align: center;
  }

  .upload-hint {
    font-size: 12px;
    color: ${(p) => p.theme.textMuted};
    margin-top: 8px;
    opacity: 0.7;
  }

  input[type="file"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
`;
