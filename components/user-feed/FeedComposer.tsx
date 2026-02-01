import { useMutation } from "convex/react";
import { AnimatePresence, m } from "framer-motion";
import { Image, Loader2, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { validateContent } from "@/lib/safeMd";

interface MediaAttachment {
  file: File;
  preview: string;
  type: "image" | "video";
}

interface UploadedMedia {
  type: "image" | "video";
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
}

interface FeedComposerProps {
  profileUserId: Id<"users">;
  parentId?: Id<"userFeedPosts">;
  placeholder?: string;
  requiresApproval?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
  autoFocus?: boolean;
}

const MAX_CONTENT_LENGTH = 2000;
const MAX_ATTACHMENTS = 4;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB

export function FeedComposer({
  profileUserId,
  parentId,
  placeholder = "What's on your mind?",
  requiresApproval = false,
  onSuccess,
  onCancel,
  compact = false,
  autoFocus = false,
}: FeedComposerProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when enabled
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const createPost = useMutation(api.userFeed.create);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CONTENT_LENGTH) {
      setContent(value);
      setError(null);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: MediaAttachment[] = [];

      for (const file of Array.from(files)) {
        if (attachments.length + newAttachments.length >= MAX_ATTACHMENTS) {
          setError(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
          break;
        }

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          setError("Only images and videos are allowed");
          continue;
        }

        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        if (file.size > maxSize) {
          setError(`File too large. Max size: ${isImage ? "10MB" : "25MB"}`);
          continue;
        }

        newAttachments.push({
          file,
          preview: URL.createObjectURL(file),
          type: isImage ? "image" : "video",
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [attachments.length],
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const uploadMedia = async (file: File): Promise<UploadedMedia> => {
    // Read file as base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Upload to API
    const response = await fetch("/api/user-feed/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: base64,
        filename: file.name,
        mimeType: file.type,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    return response.json();
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) {
      setError("Please enter some content or add media");
      return;
    }

    // Validate content
    const validation = validateContent(content);
    if (!validation.valid) {
      setError(validation.reason || "Invalid content");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload attachments
      let uploadedMedia: UploadedMedia[] = [];
      if (attachments.length > 0) {
        uploadedMedia = await Promise.all(attachments.map((att) => uploadMedia(att.file)));
      }

      // Create post
      await createPost({
        profileUserId,
        content: content.trim(),
        parentId,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      });

      // Clean up
      attachments.forEach((att) => URL.revokeObjectURL(att.preview));
      setContent("");
      setAttachments([]);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <ComposerContainer $compact={compact}>
      <TextArea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        disabled={isSubmitting}
      />

      <AnimatePresence>
        {attachments.length > 0 && (
          <AttachmentPreview
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <AttachmentGrid>
              {attachments.map((att, index) => (
                <AttachmentItem key={index}>
                  {att.type === "image" ? (
                    <AttachmentImage src={att.preview} alt="Attachment" />
                  ) : (
                    <AttachmentVideo src={att.preview} />
                  )}
                  <RemoveButton onClick={() => removeAttachment(index)}>
                    <X size={14} />
                  </RemoveButton>
                </AttachmentItem>
              ))}
            </AttachmentGrid>
          </AttachmentPreview>
        )}
      </AnimatePresence>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <ComposerFooter>
        <FooterLeft>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <AttachButton
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting || attachments.length >= MAX_ATTACHMENTS}
          >
            <Image size={18} />
          </AttachButton>
          <CharCount $warning={content.length > MAX_CONTENT_LENGTH * 0.9}>
            {content.length}/{MAX_CONTENT_LENGTH}
          </CharCount>
        </FooterLeft>

        <FooterRight>
          {onCancel && (
            <CancelButton onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </CancelButton>
          )}
          <SubmitButton
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && attachments.length === 0)}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <>
                <Send size={16} />
                {requiresApproval ? "Submit for Review" : parentId ? "Reply" : "Post"}
              </>
            )}
          </SubmitButton>
        </FooterRight>
      </ComposerFooter>

      {requiresApproval && (
        <ApprovalNotice>
          Your post will be reviewed before appearing on this profile.
        </ApprovalNotice>
      )}
    </ComposerContainer>
  );
}

// Styled Components
const ComposerContainer = styled.div<{ $compact?: boolean }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: ${(p) => (p.$compact ? "12px" : "16px")};
  margin-bottom: 20px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: ${LOUNGE_COLORS.tier1};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AttachmentPreview = styled(m.div)`
  margin-top: 12px;
  overflow: hidden;
`;

const AttachmentGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const AttachmentItem = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
`;

const AttachmentImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AttachmentVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 107, 107, 0.9);
  }
`;

const ErrorMessage = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 6px;
  font-size: 13px;
  color: #ff6b6b;
`;

const ComposerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AttachButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(144, 116, 242, 0.15);
    color: ${LOUNGE_COLORS.tier1};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const CharCount = styled.span<{ $warning?: boolean }>`
  font-size: 12px;
  color: ${(p) => (p.$warning ? "#ff9500" : "rgba(255, 255, 255, 0.4)")};
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: #7c5dd3;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ApprovalNotice = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(144, 116, 242, 0.1);
  border: 1px solid rgba(144, 116, 242, 0.2);
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;
