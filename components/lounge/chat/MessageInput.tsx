import { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Send, Smile, Paperclip, X, Loader2, Image as ImageIcon, Film, Music } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import { EmojiPicker } from "./EmojiPicker";
import { MentionAutocomplete, type MentionType, type MentionSelection } from "./MentionAutocomplete";
import { useMessageAttachments, type PendingAttachment } from "../../../hooks/lounge/useMessageAttachments";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MessageEmbed } from "../../../types/lounge";

interface MessageInputProps {
  channelId: Id<"channels">;
  channelName: string;
  disabled?: boolean;
  onSend: (content: string, embeds?: MessageEmbed[]) => void;
}

// Track inserted mentions for conversion on send
interface InsertedMention {
  displayText: string; // @Username or #channel
  insertText: string;  // <@id> or <#c:id>
}

export function MessageInput({ channelId, channelName, disabled, onSend }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<InsertedMention[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  // Mention autocomplete state
  const [mentionState, setMentionState] = useState<{
    isOpen: boolean;
    type: MentionType;
    query: string;
    triggerIndex: number;
    position: { top: number; left: number };
  } | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  const {
    attachments,
    addFiles,
    removeAttachment,
    uploadAll,
    clearAll,
    isUploading,
    error: attachmentError,
    clearError,
  } = useMessageAttachments();

  const startTyping = useMutation(api.presence.startTyping);
  const stopTyping = useMutation(api.presence.stopTyping);

  // Handle typing indicator
  useEffect(() => {
    if (content.length > 0) {
      startTyping({ channelId });
    } else {
      stopTyping({ channelId });
    }

    return () => {
      stopTyping({ channelId });
    };
  }, [content.length > 0, channelId, startTyping, stopTyping]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Check for mention triggers on content change
  const checkMentionTrigger = useCallback((text: string, cursorPos: number) => {
    // Look backwards from cursor to find @ or #
    const textBeforeCursor = text.slice(0, cursorPos);

    // Find the last @ or # that could be a trigger
    // Must be at start or after whitespace, and not inside a completed mention
    const atMatch = textBeforeCursor.match(/(^|[\s])@([^\s]*)$/);
    const hashMatch = textBeforeCursor.match(/(^|[\s])#([^\s]*)$/);

    if (atMatch && atMatch[2] !== undefined) {
      const query = atMatch[2];
      const triggerIndex = cursorPos - query.length - 1; // -1 for the @

      // Calculate position for dropdown
      const position = calculateDropdownPosition();

      setMentionState({
        isOpen: true,
        type: "user",
        query,
        triggerIndex,
        position,
      });
      setMentionSelectedIndex(0);
    } else if (hashMatch && hashMatch[2] !== undefined) {
      const query = hashMatch[2];
      const triggerIndex = cursorPos - query.length - 1; // -1 for the #

      // Calculate position for dropdown
      const position = calculateDropdownPosition();

      setMentionState({
        isOpen: true,
        type: "channel",
        query,
        triggerIndex,
        position,
      });
      setMentionSelectedIndex(0);
    } else {
      // Close mention autocomplete
      if (mentionState?.isOpen) {
        setMentionState(null);
      }
    }
  }, [mentionState?.isOpen]);

  // Calculate dropdown position relative to input
  const calculateDropdownPosition = useCallback(() => {
    const wrapper = inputWrapperRef.current;
    if (!wrapper) return { top: 0, left: 0 };

    // Position above the input (using bottom positioning)
    return {
      top: 70, // This is actually used as 'bottom' value - distance from bottom of wrapper
      left: 8,
    };
  }, []);

  // Handle content change with mention detection
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(newContent);
    checkMentionTrigger(newContent, cursorPos);
  }, [checkMentionTrigger]);

  // Handle mention selection
  const handleMentionSelect = useCallback((selection: MentionSelection) => {
    if (!mentionState) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    // Replace the @query or #query with the display text
    const beforeTrigger = content.slice(0, mentionState.triggerIndex);
    const afterCursor = content.slice(textarea.selectionStart);

    // Insert display text (e.g., @Username) - we'll convert on send
    const newContent = beforeTrigger + selection.displayText + " " + afterCursor;
    setContent(newContent);

    // Track the mention for conversion on send
    setMentions(prev => [...prev, {
      displayText: selection.displayText,
      insertText: selection.insertText,
    }]);

    // Close autocomplete
    setMentionState(null);

    // Focus and set cursor position after the inserted mention
    setTimeout(() => {
      const newCursorPos = beforeTrigger.length + selection.displayText.length + 1;
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }, 0);
  }, [content, mentionState]);

  // Close mention autocomplete
  const closeMentionAutocomplete = useCallback(() => {
    setMentionState(null);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmedContent = content.trim();
    const hasAttachments = attachments.length > 0;

    if ((!trimmedContent && !hasAttachments) || disabled || isUploading) return;

    try {
      let embeds: MessageEmbed[] | undefined;

      // Upload attachments first
      if (hasAttachments) {
        embeds = await uploadAll();
      }

      // Convert display mentions to raw format before sending
      let finalContent = trimmedContent;
      for (const mention of mentions) {
        // Replace all occurrences of this display text with the raw format
        finalContent = finalContent.split(mention.displayText).join(mention.insertText);
      }

      // Clear input immediately for snappy feel
      setContent("");
      setMentions([]);
      clearAll();

      // Call parent's optimistic send handler
      onSend(finalContent, embeds);

      textareaRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [content, mentions, attachments.length, disabled, isUploading, uploadAll, clearAll, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention autocomplete navigation
    if (mentionState?.isOpen) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionSelectedIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionSelectedIndex((prev) => prev + 1); // Component will clamp this
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        // Let the MentionAutocomplete handle selection via its exposed method
        // We'll dispatch a custom event or use a ref - for now, prevent default
        // The selection is handled by the component's click handler
        e.preventDefault();
        // Trigger selection of current item - we need to emit an event
        const event = new CustomEvent("mention-select-current");
        document.dispatchEvent(event);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionState(null);
        return;
      }
    }

    // Normal enter to send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(content + emoji);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = "";
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const hasContent = content.trim() || attachments.length > 0;

  return (
    <InputContainer
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Attachment Preview Area */}
      {attachments.length > 0 && (
        <AttachmentPreviewArea>
          {attachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => removeAttachment(attachment.id)}
            />
          ))}
        </AttachmentPreviewArea>
      )}

      {/* Error message */}
      {attachmentError && (
        <ErrorMessage>
          {attachmentError}
          <ErrorDismiss onClick={clearError}>
            <X size={14} />
          </ErrorDismiss>
        </ErrorMessage>
      )}

      <InputWrapper ref={inputWrapperRef} $isDragging={isDragging}>
        {/* Mention Autocomplete */}
        {mentionState?.isOpen && (
          <MentionAutocomplete
            type={mentionState.type}
            query={mentionState.query}
            position={mentionState.position}
            onSelect={handleMentionSelect}
            onClose={closeMentionAutocomplete}
            selectedIndex={mentionSelectedIndex}
            onSelectedIndexChange={setMentionSelectedIndex}
          />
        )}

        {isDragging && (
          <DragOverlay>
            <Paperclip size={24} />
            <span>Drop files to attach</span>
          </DragOverlay>
        )}

        <AttachButton
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Paperclip size={18} />
        </AttachButton>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={handleFileSelect}
          hidden
        />

        <TextInput
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={`Message #${channelName}`}
          disabled={disabled || isUploading}
          rows={1}
        />

        <EmojiWrapper>
          <EmojiButton
            title="Add emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            $isActive={showEmojiPicker}
            disabled={disabled || isUploading}
          >
            <Smile size={18} />
          </EmojiButton>
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={handleEmojiSelect}
          />
        </EmojiWrapper>

        <SendButton
          onClick={handleSend}
          disabled={!hasContent || disabled || isUploading}
          $hasContent={!!hasContent}
        >
          {isUploading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </SendButton>
      </InputWrapper>
    </InputContainer>
  );
}

// Attachment Preview Component
function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: PendingAttachment;
  onRemove: () => void;
}) {
  const isImage = attachment.type === "image";
  const isVideo = attachment.type === "video";
  const isAudio = attachment.type === "audio";

  return (
    <PreviewItem $status={attachment.status}>
      {isImage && attachment.preview ? (
        <PreviewImage src={attachment.preview} alt={attachment.file.name} />
      ) : (
        <PreviewIcon>
          {isVideo && <Film size={24} />}
          {isAudio && <Music size={24} />}
          {!isVideo && !isAudio && <ImageIcon size={24} />}
        </PreviewIcon>
      )}
      <PreviewName title={attachment.file.name}>
        {attachment.file.name}
      </PreviewName>
      {attachment.status === "uploading" && (
        <UploadingOverlay>
          <Loader2 size={16} className="spin" />
        </UploadingOverlay>
      )}
      {attachment.status === "error" && (
        <ErrorOverlay title={attachment.error}>!</ErrorOverlay>
      )}
      <RemoveButton onClick={onRemove} title="Remove">
        <X size={14} />
      </RemoveButton>
    </PreviewItem>
  );
}

// Styled Components
const InputContainer = styled.div`
  padding: 0 1rem 1rem;
  position: relative;
`;

const AttachmentPreviewArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
`;

const PreviewItem = styled.div<{ $status: string }>`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${(p) =>
    p.$status === "error"
      ? "rgba(237, 66, 69, 0.5)"
      : p.$status === "complete"
        ? "rgba(87, 242, 135, 0.5)"
        : LOUNGE_COLORS.glassBorder};
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PreviewIcon = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
`;

const PreviewName = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.25rem;
  background: rgba(0, 0, 0, 0.7);
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UploadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${LOUNGE_COLORS.tier1};

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

const ErrorOverlay = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  background: rgba(237, 66, 69, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: #fff;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;

  ${PreviewItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: rgba(237, 66, 69, 0.8);
    color: #fff;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(237, 66, 69, 0.1);
  border: 1px solid rgba(237, 66, 69, 0.3);
  border-radius: 6px;
  font-size: 0.8rem;
  color: #ed4245;
`;

const ErrorDismiss = styled.button`
  margin-left: auto;
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: #ed4245;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: rgba(237, 66, 69, 0.2);
  }
`;

const InputWrapper = styled.div<{ $isDragging?: boolean }>`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${(p) => (p.$isDragging ? LOUNGE_COLORS.tier1 : LOUNGE_COLORS.glassBorder)};
  border-radius: 12px;
  transition: border-color 0.2s ease;
  position: relative;

  &:focus-within {
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const DragOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(144, 116, 242, 0.1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: ${LOUNGE_COLORS.tier1};
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 10;
  pointer-events: none;
`;

const TextInput = styled.textarea`
  flex: 1;
  min-height: 24px;
  max-height: 200px;
  padding: 0.5rem 0;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 0.95rem;
  font-family: inherit;
  line-height: 1.4;
  resize: none;
  overflow-y: auto;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &:disabled {
    opacity: 0.3;
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

const AttachButton = styled(IconButton)`
  color: rgba(255, 255, 255, 0.6);

  &:hover:not(:disabled) {
    color: ${LOUNGE_COLORS.tier1};
    background: rgba(144, 116, 242, 0.1);
  }
`;

const EmojiWrapper = styled.div`
  position: relative;
`;

const EmojiButton = styled(IconButton)<{ $isActive?: boolean }>`
  color: ${(props) =>
    props.$isActive ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.6)"};
  background: ${(props) =>
    props.$isActive ? LOUNGE_COLORS.tier1Background : "transparent"};

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.$isActive
        ? LOUNGE_COLORS.tier1Background
        : "rgba(255, 255, 255, 0.1)"};
    color: ${(props) => (props.$isActive ? LOUNGE_COLORS.tier1 : "#fff")};
  }
`;

const SendButton = styled(IconButton)<{ $hasContent: boolean }>`
  color: ${(props) =>
    props.$hasContent ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.4)"};

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.$hasContent ? "rgba(144, 116, 242, 0.2)" : "rgba(255, 255, 255, 0.05)"};
    color: ${(props) => (props.$hasContent ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.5)")};
  }

  &:disabled {
    opacity: 1; /* Override default disabled opacity */
    cursor: default;
  }
`;
