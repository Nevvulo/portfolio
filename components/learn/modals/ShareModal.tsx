import { AnimatePresence, m } from "framer-motion";
import {
  Check,
  Copy,
  Share2,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/theme";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postSlug: string;
  postTitle: string;
}

export function ShareModal({ isOpen, onClose, postId, postSlug, postTitle }: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  const postUrl = `https://nev.so/learn/${postSlug}`;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [postUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!canNativeShare) {
      // Fallback to copy
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: postTitle,
        text: `Check out "${postTitle}" on Nevulo`,
        url: postUrl,
      });
    } catch (err: any) {
      // User cancelled or share failed
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  }, [canNativeShare, postTitle, postUrl, handleCopyLink]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <ModalWrapper onClick={onClose}>
            <ModalContainer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <HeaderLeft>
                  <HeaderTitle>
                    <Share2 size={18} />
                    <span>Share</span>
                  </HeaderTitle>
                </HeaderLeft>
                <CloseButton onClick={onClose}>
                  <X size={18} />
                </CloseButton>
              </ModalHeader>

              <ModalContent>
                <ArticlePreview>
                  <ArticleTitle>{postTitle}</ArticleTitle>
                  <ArticleUrl>{postUrl}</ArticleUrl>
                </ArticlePreview>

                <OptionsList>
                  <OptionButton onClick={handleCopyLink}>
                    <OptionIcon>
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </OptionIcon>
                    <OptionText>
                      <OptionLabel>{copied ? "Copied!" : "Copy Link"}</OptionLabel>
                      <OptionDescription>Copy the article URL to clipboard</OptionDescription>
                    </OptionText>
                  </OptionButton>

                  <OptionButton onClick={handleNativeShare}>
                    <OptionIcon>
                      <Share2 size={18} />
                    </OptionIcon>
                    <OptionText>
                      <OptionLabel>Share</OptionLabel>
                      <OptionDescription>
                        {canNativeShare
                          ? "Share via system dialog"
                          : "Copy link to clipboard"}
                      </OptionDescription>
                    </OptionText>
                  </OptionButton>
                </OptionsList>
              </ModalContent>
            </ModalContainer>
          </ModalWrapper>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Styled Components
const Overlay = styled(m.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1100;
`;

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1101;
  padding: 20px;
`;

const ModalContainer = styled(m.div)`
  background: rgba(16, 13, 27, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  font-size: 15px;

  svg {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const ArticlePreview = styled.div`
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  margin-bottom: 20px;
`;

const ArticleTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
  line-height: 1.4;
`;

const ArticleUrl = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  word-break: break-all;
`;

const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OptionButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  transition: all 0.15s ease;
  text-align: left;
  opacity: ${(p) => (p.disabled ? 0.6 : 1)};

  &:hover:not(:disabled) {
    background: rgba(144, 116, 242, 0.1);
    border-color: rgba(144, 116, 242, 0.3);
  }

  > svg:last-child {
    margin-left: auto;
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
  }
`;

const OptionIcon = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: ${(p) => (p.$disabled ? "rgba(255, 255, 255, 0.05)" : "rgba(144, 116, 242, 0.15)")};
  border-radius: 8px;
  color: ${(p) => (p.$disabled ? "rgba(255, 255, 255, 0.4)" : LOUNGE_COLORS.tier1)};
  flex-shrink: 0;

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const OptionText = styled.div`
  flex: 1;
  min-width: 0;
`;

const OptionLabel = styled.div<{ $disabled?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => (p.$disabled ? "rgba(255, 255, 255, 0.5)" : "white")};
  margin-bottom: 2px;
`;

const OptionDescription = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`;

