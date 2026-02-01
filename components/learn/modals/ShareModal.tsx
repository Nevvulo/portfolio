import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, m } from "framer-motion";
import {
  Check,
  Copy,
  Loader2,
  Lock,
  Repeat2,
  Share2,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: Id<"blogPosts">;
  postSlug: string;
  postTitle: string;
}

type ScreenState = "options" | "success";

export function ShareModal({ isOpen, onClose, postId, postSlug, postTitle }: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<ScreenState>("options");
  const [copied, setCopied] = useState(false);

  const { isSignedIn } = useUser();
  const repostToFeed = useMutation(api.userFeed.repostBlogPost);
  const hasReposted = useQuery(
    api.userFeed.hasUserRepostedBlogPost,
    isSignedIn ? { blogPostId: postId } : "skip",
  );
  const [isReposting, setIsReposting] = useState(false);

  const postUrl = `https://nev.so/learn/${postSlug}`;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScreen("options");
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

  const handleRepostToFeed = useCallback(async () => {
    if (!isSignedIn || isReposting || hasReposted) return;

    setIsReposting(true);
    try {
      await repostToFeed({ blogPostId: postId });
      setScreen("success");
    } catch (err: any) {
      console.error("Failed to repost:", err);
      alert(err.message || "Failed to repost. Please try again.");
    } finally {
      setIsReposting(false);
    }
  }, [isSignedIn, isReposting, hasReposted, repostToFeed, postId]);

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
                <AnimatePresence mode="wait">
                  {screen === "options" && (
                    <ScreenContainer
                      key="options"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ArticlePreview>
                        <ArticleTitle>{postTitle}</ArticleTitle>
                        <ArticleUrl>{postUrl}</ArticleUrl>
                      </ArticlePreview>

                      <SectionTitle>Share externally</SectionTitle>
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

                      <Divider />

                      <SectionTitle>Share on Nevulo</SectionTitle>
                      <OptionsList>
                        {isSignedIn ? (
                          <OptionButton
                            onClick={handleRepostToFeed}
                            disabled={isReposting || hasReposted === true}
                          >
                            <OptionIcon $disabled={hasReposted === true}>
                              {isReposting ? (
                                <Loader2 size={18} className="spin" />
                              ) : (
                                <Repeat2 size={18} />
                              )}
                            </OptionIcon>
                            <OptionText>
                              <OptionLabel $disabled={hasReposted === true}>
                                {hasReposted ? "Reposted to Feed" : "Repost to Feed"}
                              </OptionLabel>
                              <OptionDescription>
                                {hasReposted
                                  ? "Already shared to your profile"
                                  : "Share to your profile feed"}
                              </OptionDescription>
                            </OptionText>
                            {hasReposted && <Check size={14} />}
                          </OptionButton>
                        ) : (
                          <OptionButton disabled>
                            <OptionIcon $disabled>
                              <Repeat2 size={18} />
                            </OptionIcon>
                            <OptionText>
                              <OptionLabel $disabled>Repost to Feed</OptionLabel>
                              <OptionDescription>Sign in to share to your feed</OptionDescription>
                            </OptionText>
                            <Lock size={14} />
                          </OptionButton>
                        )}
                      </OptionsList>
                    </ScreenContainer>
                  )}

                  {screen === "success" && (
                    <ScreenContainer
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <SuccessIcon>
                        <Check size={32} />
                      </SuccessIcon>
                      <ScreenTitle>Shared!</ScreenTitle>
                      <ScreenSubtitle>Your article has been shared.</ScreenSubtitle>
                      <DoneButton onClick={onClose}>Done</DoneButton>
                    </ScreenContainer>
                  )}
                </AnimatePresence>
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

const ScreenContainer = styled(m.div)`
  display: flex;
  flex-direction: column;
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

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
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

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 20px 0;
`;

const ScreenTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: white;
`;

const ScreenSubtitle = styled.p`
  margin: 0 0 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
`;


const SuccessIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(34, 197, 94, 0.2);
  border-radius: 50%;
  color: #22c55e;
  margin: 0 auto 16px;
`;

const DoneButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;
