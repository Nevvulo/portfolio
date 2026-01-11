import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Copy,
  Check,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  Lock,
  Hash,
  Megaphone,
  FileText,
  User,
  Repeat2,
  Loader2,
} from "lucide-react";
import { LOUNGE_COLORS } from "@/constants/lounge";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: Id<"blogPosts">;
  postSlug: string;
  postTitle: string;
}

type ScreenState = "options" | "channel-picker" | "success";

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  chat: <Hash size={16} />,
  announcements: <Megaphone size={16} />,
  content: <FileText size={16} />,
};

export function ShareModal({
  isOpen,
  onClose,
  postId,
  postSlug,
  postTitle,
}: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<ScreenState>("options");
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Id<"channels"> | null>(
    null
  );
  const [shareComment, setShareComment] = useState("");

  const { isSignedIn } = useUser();
  const channels = useQuery(api.channels.list);
  const shareToLounge = useMutation(api.messages.shareLearnPost);
  const repostToFeed = useMutation(api.userFeed.repostBlogPost);
  const hasReposted = useQuery(
    api.userFeed.hasUserRepostedBlogPost,
    isSignedIn ? { blogPostId: postId } : "skip"
  );
  const [isReposting, setIsReposting] = useState(false);

  const postUrl = `https://nev.so/learn/${postSlug}`;
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScreen("options");
      setCopied(false);
      setSelectedChannel(null);
      setShareComment("");
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

  const handleShareToChannel = useCallback(async () => {
    if (!selectedChannel) return;

    setIsSharing(true);
    try {
      await shareToLounge({
        channelId: selectedChannel,
        postId,
        comment: shareComment || undefined,
      });
      setScreen("success");
    } catch (err) {
      console.error("Failed to share:", err);
      alert("Failed to share to channel. Please try again.");
    } finally {
      setIsSharing(false);
    }
  }, [selectedChannel, shareToLounge, postId, shareComment]);

  const handleBack = useCallback(() => {
    setScreen("options");
    setSelectedChannel(null);
    setShareComment("");
  }, []);

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

  const accessibleChannels = channels?.filter((c) => c.hasAccess) || [];

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
                  {screen === "channel-picker" && (
                    <BackButton onClick={handleBack}>
                      <ArrowLeft size={16} />
                    </BackButton>
                  )}
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
                            <OptionLabel>
                              {copied ? "Copied!" : "Copy Link"}
                            </OptionLabel>
                            <OptionDescription>
                              Copy the article URL to clipboard
                            </OptionDescription>
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
                          <OptionButton onClick={() => setScreen("channel-picker")}>
                            <OptionIcon>
                              <MessageSquare size={18} />
                            </OptionIcon>
                            <OptionText>
                              <OptionLabel>Share to Lounge</OptionLabel>
                              <OptionDescription>
                                Post in a lounge channel
                              </OptionDescription>
                            </OptionText>
                            <ChevronRight size={16} />
                          </OptionButton>
                        ) : (
                          <OptionButton disabled>
                            <OptionIcon $disabled>
                              <MessageSquare size={18} />
                            </OptionIcon>
                            <OptionText>
                              <OptionLabel $disabled>Share to Lounge</OptionLabel>
                              <OptionDescription>
                                Sign in to share in the lounge
                              </OptionDescription>
                            </OptionText>
                            <Lock size={14} />
                          </OptionButton>
                        )}

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
                              <OptionDescription>
                                Sign in to share to your feed
                              </OptionDescription>
                            </OptionText>
                            <Lock size={14} />
                          </OptionButton>
                        )}
                      </OptionsList>
                    </ScreenContainer>
                  )}

                  {screen === "channel-picker" && (
                    <ScreenContainer
                      key="channel-picker"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ScreenTitle>Choose a channel</ScreenTitle>
                      <ScreenSubtitle>
                        Select where you'd like to share this article.
                      </ScreenSubtitle>

                      <ChannelList>
                        {accessibleChannels.map((channel) => (
                          <ChannelButton
                            key={channel._id}
                            $selected={selectedChannel === channel._id}
                            onClick={() => setSelectedChannel(channel._id)}
                          >
                            <ChannelIcon>
                              {CHANNEL_ICONS[channel.type] || <Hash size={16} />}
                            </ChannelIcon>
                            <ChannelName>{channel.name}</ChannelName>
                            {selectedChannel === channel._id && (
                              <SelectedIndicator>
                                <Check size={14} />
                              </SelectedIndicator>
                            )}
                          </ChannelButton>
                        ))}
                      </ChannelList>

                      {selectedChannel && (
                        <>
                          <CommentLabel>Add a comment (optional)</CommentLabel>
                          <CommentInput
                            value={shareComment}
                            onChange={(e) => setShareComment(e.target.value)}
                            placeholder="Say something about this article..."
                            maxLength={500}
                          />
                        </>
                      )}

                      <ShareButton
                        onClick={handleShareToChannel}
                        disabled={!selectedChannel || isSharing}
                      >
                        {isSharing ? "Sharing..." : "Share to Channel"}
                      </ShareButton>
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
                      <ScreenSubtitle>
                        Your article has been shared to the channel.
                      </ScreenSubtitle>
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
    document.body
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

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }
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
  background: ${(p) =>
    p.$disabled ? "rgba(255, 255, 255, 0.05)" : "rgba(144, 116, 242, 0.15)"};
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

const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
`;

const ChannelButton = styled.button<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: ${(p) =>
    p.$selected ? "rgba(144, 116, 242, 0.15)" : "rgba(255, 255, 255, 0.03)"};
  border: 1px solid
    ${(p) =>
      p.$selected ? "rgba(144, 116, 242, 0.4)" : "rgba(255, 255, 255, 0.08)"};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;

  &:hover {
    background: ${(p) =>
      p.$selected ? "rgba(144, 116, 242, 0.2)" : "rgba(255, 255, 255, 0.06)"};
  }
`;

const ChannelIcon = styled.div`
  color: rgba(255, 255, 255, 0.5);
`;

const ChannelName = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: white;
`;

const SelectedIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 50%;
  color: white;
`;

const CommentLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
`;

const CommentInput = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  height: 80px;
  margin-bottom: 16px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const ShareButton = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: ${LOUNGE_COLORS.tier1};
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
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
