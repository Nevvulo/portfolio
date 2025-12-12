import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Pencil, X, Check } from "lucide-react";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import { MAX_BIO_LENGTH } from "../../../constants/word-filter";

interface UserBioProps {
  bio?: string;
  isEditable?: boolean;
  onSave?: (bio: string) => Promise<void>;
}

/**
 * User bio with inline editing capability
 */
export function UserBio({ bio, isEditable = false, onSave }: UserBioProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        editValue.length,
        editValue.length
      );
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(bio || "");
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(bio || "");
    setError(null);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const charCount = editValue.length;
  const isOverLimit = charCount > MAX_BIO_LENGTH;

  if (isEditing) {
    return (
      <BioContainer>
        <EditContainer>
          <BioTextarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a short bio..."
            $isOverLimit={isOverLimit}
            disabled={isSaving}
          />
          <EditFooter>
            <CharCounter $isOverLimit={isOverLimit}>
              {charCount}/{MAX_BIO_LENGTH}
            </CharCounter>
            <EditActions>
              <ActionButton onClick={handleCancel} disabled={isSaving}>
                <X size={14} />
              </ActionButton>
              <ActionButton
                onClick={handleSave}
                $primary
                disabled={isSaving || isOverLimit}
              >
                {isSaving ? "..." : <Check size={14} />}
              </ActionButton>
            </EditActions>
          </EditFooter>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </EditContainer>
      </BioContainer>
    );
  }

  return (
    <BioContainer>
      {bio ? (
        <BioText>
          {bio}
          {isEditable && (
            <EditIcon onClick={handleStartEdit}>
              <Pencil size={12} />
            </EditIcon>
          )}
        </BioText>
      ) : isEditable ? (
        <EmptyBio onClick={handleStartEdit}>
          Click to add a bio
        </EmptyBio>
      ) : (
        <EmptyBio as="span">No bio</EmptyBio>
      )}
    </BioContainer>
  );
}

const BioContainer = styled.div`
  width: 100%;
`;

const BioText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  white-space: pre-wrap;
  word-break: break-word;
`;

const EmptyBio = styled.button`
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  cursor: pointer;

  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const EditIcon = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 2px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  vertical-align: middle;

  ${BioText}:hover & {
    opacity: 1;
  }

  &:hover {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const BioTextarea = styled.textarea<{ $isOverLimit: boolean }>`
  width: 100%;
  min-height: 60px;
  max-height: 120px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${(p) =>
    p.$isOverLimit ? "#ef4444" : LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: #fff;
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  outline: none;

  &:focus {
    border-color: ${(p) =>
      p.$isOverLimit ? "#ef4444" : LOUNGE_COLORS.tier1};
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const EditFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CharCounter = styled.span<{ $isOverLimit: boolean }>`
  font-size: 0.7rem;
  color: ${(p) =>
    p.$isOverLimit ? "#ef4444" : "rgba(255, 255, 255, 0.4)"};
`;

const EditActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button<{ $primary?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: none;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  transition: all 0.15s ease;

  ${(p) =>
    p.$primary
      ? `
    background: ${LOUNGE_COLORS.online};
    color: #fff;
    &:hover:not(:disabled) {
      background: #16a34a;
    }
  `
      : `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
    }
  `}
`;

const ErrorMessage = styled.div`
  font-size: 0.75rem;
  color: #ef4444;
`;

export default UserBio;
