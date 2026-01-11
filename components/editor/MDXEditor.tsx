import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { BlogPostPreview, Callout, CodePlayground, CustomImage, YouTube } from "./extensions";
import { SlashCommand } from "./SlashCommand";
import { mdxToTiptap } from "./serializers/mdxToTiptap";
import { tiptapToMdx } from "./serializers/tiptapToMdx";
import { EditorContainer, EditorContentWrapper, ImageUploadWrapper } from "./styles";

interface MDXEditorProps {
  initialContent: string;
  onChange: (mdx: string) => void;
  placeholder?: string;
}

export function MDXEditor({
  initialContent,
  onChange,
  placeholder = "Start writing... Type '/' for commands",
}: MDXEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: "code-block",
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      CustomImage,
      BlogPostPreview,
      YouTube,
      Callout,
      CodePlayground,
    ],
    content: { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      const mdx = tiptapToMdx(editor.getJSON());
      onChange(mdx);
    },
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
  });

  // Load initial content
  useEffect(() => {
    if (!editor || initializedRef.current) return;

    const loadContent = async () => {
      try {
        const doc = await mdxToTiptap(initialContent);
        editor.commands.setContent(doc);
        initializedRef.current = true;
      } catch (error) {
        console.error("Failed to load content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [editor, initialContent]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;

      setIsUploading(true);

      try {
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to API
        const response = await fetch("/api/blog/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, filename: file.name }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const { url } = await response.json();

        // Insert image into editor
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
        setShowImageUpload(false);
      }
    },
    [editor],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          break;
        }
      }
    },
    [handleImageUpload],
  );

  if (isLoading) {
    return (
      <EditorContainer>
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading editor...
        </div>
      </EditorContainer>
    );
  }

  return (
    <EditorContainer>
      <EditorToolbar editor={editor} onImageUpload={() => setShowImageUpload(true)} />

      <EditorContentWrapper
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
      >
        <EditorContent editor={editor} />
        <SlashCommand editor={editor} onImageUpload={() => setShowImageUpload(true)} />
      </EditorContentWrapper>

      {showImageUpload && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !isUploading && setShowImageUpload(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "400px", margin: "0 16px" }}
          >
            <ImageUploadWrapper
              className={isUploading ? "uploading" : ""}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith("image/")) {
                  handleImageUpload(file);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("dragging");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("dragging");
              }}
            >
              {isUploading ? (
                <>
                  <div className="upload-icon">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z" />
                    </svg>
                  </div>
                  <div className="upload-text">Uploading...</div>
                </>
              ) : (
                <>
                  <div className="upload-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                  </div>
                  <div className="upload-text">Drop an image here or click to upload</div>
                  <div className="upload-hint">Supports PNG, JPG, GIF, WebP (max 10MB)</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </>
              )}
            </ImageUploadWrapper>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </EditorContainer>
  );
}

export default MDXEditor;
