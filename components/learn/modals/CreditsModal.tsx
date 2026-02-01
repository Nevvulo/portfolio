import { AnimatePresence, m } from "framer-motion";
import { Bot, Clock, FileText, Image as ImageIcon, Tag, User, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import {
  type AIDisclosureStatus,
  getEffectiveAIStatus,
} from "@/components/badges/ai-disclosure-badge";
import { LOUNGE_COLORS } from "@/constants/theme";
import type { Id } from "@/convex/_generated/dataModel";

interface AuthorInfo {
  _id: Id<"users">;
  displayName: string;
  username?: string;
  avatarUrl?: string;
}

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    title: string;
    content: string;
    author?: AuthorInfo | null;
    collaborators?: AuthorInfo[];
    readTimeMins?: number;
    coverAuthor?: string;
    coverAuthorUrl?: string;
    labels: string[];
    aiDisclosureStatus?: AIDisclosureStatus;
    publishedAt?: number;
    createdAt?: number;
  };
}

function countWords(content: string): number {
  // Strip MDX/markdown syntax and count words
  const stripped = content
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]+`/g, "") // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
    .replace(/[#*_~>`]/g, "") // Remove markdown syntax
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  if (!stripped) return 0;
  return stripped.split(/\s+/).filter((word) => word.length > 0).length;
}

export function CreditsModal({ isOpen, onClose, post }: CreditsModalProps) {
  const [mounted, setMounted] = useState(false);
  const wordCount = countWords(post.content);

  useEffect(() => {
    setMounted(true);
  }, []);

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
                <HeaderTitle>
                  <FileText size={18} />
                  <span>Credits</span>
                </HeaderTitle>
                <CloseButton onClick={onClose}>
                  <X size={18} />
                </CloseButton>
              </ModalHeader>

              <ModalContent>
                <ArticleTitle>{post.title}</ArticleTitle>

                {/* Author */}
                {post.author && (
                  <CreditSection>
                    <SectionLabel>
                      <User size={14} />
                      Author
                    </SectionLabel>
                    <PersonLink href={`/@${post.author.username || post.author._id}`}>
                      {post.author.avatarUrl ? (
                        <PersonAvatar src={post.author.avatarUrl} alt={post.author.displayName} />
                      ) : (
                        <AvatarPlaceholder />
                      )}
                      <PersonName>{post.author.displayName}</PersonName>
                    </PersonLink>
                  </CreditSection>
                )}

                {/* Collaborators */}
                {post.collaborators && post.collaborators.length > 0 && (
                  <CreditSection>
                    <SectionLabel>
                      <Users size={14} />
                      Contributors
                    </SectionLabel>
                    <PersonList>
                      {post.collaborators.map((collab) => (
                        <PersonLink key={collab._id} href={`/@${collab.username || collab._id}`}>
                          {collab.avatarUrl ? (
                            <PersonAvatar src={collab.avatarUrl} alt={collab.displayName} $small />
                          ) : (
                            <AvatarPlaceholder $small />
                          )}
                          <PersonName>{collab.displayName}</PersonName>
                        </PersonLink>
                      ))}
                    </PersonList>
                  </CreditSection>
                )}

                {/* Stats Row */}
                <StatsRow>
                  <StatItem>
                    <StatIcon>
                      <FileText size={14} />
                    </StatIcon>
                    <StatValue>{wordCount.toLocaleString()}</StatValue>
                    <StatLabel>words</StatLabel>
                  </StatItem>
                  {post.readTimeMins && (
                    <StatItem>
                      <StatIcon>
                        <Clock size={14} />
                      </StatIcon>
                      <StatValue>{post.readTimeMins}</StatValue>
                      <StatLabel>min read</StatLabel>
                    </StatItem>
                  )}
                </StatsRow>

                {/* Cover Artist */}
                {post.coverAuthor && (
                  <CreditSection>
                    <SectionLabel>
                      <ImageIcon size={14} />
                      Cover Image
                    </SectionLabel>
                    {post.coverAuthorUrl ? (
                      <ExternalLink
                        href={post.coverAuthorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {post.coverAuthor}
                      </ExternalLink>
                    ) : (
                      <CreditText>{post.coverAuthor}</CreditText>
                    )}
                  </CreditSection>
                )}

                {/* Labels/Tags */}
                {post.labels && post.labels.length > 0 && (
                  <CreditSection>
                    <SectionLabel>
                      <Tag size={14} />
                      Topics
                    </SectionLabel>
                    <TagList>
                      {post.labels.map((label) => (
                        <TagLink
                          key={label}
                          href={`/learn?label=${encodeURIComponent(label)}`}
                          onClick={onClose}
                        >
                          {label.replace(/-/g, " ")}
                        </TagLink>
                      ))}
                    </TagList>
                  </CreditSection>
                )}

                {/* AI Disclosure */}
                <AIDisclosureWrapper>
                  <AIDisclosureRow>
                    <Bot size={14} />
                    <AIDisclosureText>
                      {(() => {
                        const status = getEffectiveAIStatus(
                          post.aiDisclosureStatus,
                          post.publishedAt ?? post.createdAt,
                        );
                        if (status === "none") {
                          return "Written without AI assistance";
                        } else if (status === "llm-reviewed") {
                          return "AI-reviewed for clarity";
                        } else {
                          return "AI-assisted (<10% content)";
                        }
                      })()}
                    </AIDisclosureText>
                  </AIDisclosureRow>
                  <AIDisclosureLink href="/ai-disclosure">Learn more</AIDisclosureLink>
                </AIDisclosureWrapper>
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

const ArticleTitle = styled.h3`
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  line-height: 1.4;
`;

const CreditSection = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;

  svg {
    opacity: 0.7;
  }
`;

const PersonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PersonAvatar = styled.img<{ $small?: boolean }>`
  width: ${(p) => (p.$small ? "28px" : "32px")};
  height: ${(p) => (p.$small ? "28px" : "32px")};
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const AvatarPlaceholder = styled.div<{ $small?: boolean }>`
  width: ${(p) => (p.$small ? "28px" : "32px")};
  height: ${(p) => (p.$small ? "28px" : "32px")};
  border-radius: 50%;
  background: rgba(144, 116, 242, 0.2);
  flex-shrink: 0;
`;

const PersonLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
    border-color: rgba(144, 116, 242, 0.3);
  }
`;

const PersonName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: white;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatIcon = styled.div`
  color: ${LOUNGE_COLORS.tier1};
  opacity: 0.8;
`;

const StatValue = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: white;
`;

const StatLabel = styled.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
`;

const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: ${LOUNGE_COLORS.tier1};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const CreditText = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagLink = styled(Link)`
  background: rgba(79, 77, 193, 0.15);
  padding: 0.1em 0.6em;
  border: 1px solid rgba(79, 77, 193, 0.3);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  color: #a5a3f5;
  text-transform: lowercase;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.25);
    border-color: rgba(79, 77, 193, 0.5);
  }
`;

const AIDisclosureWrapper = styled.div`
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AIDisclosureRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.4);

  svg {
    opacity: 0.6;
  }
`;

const AIDisclosureText = styled.span`
  font-size: 12px;
  font-weight: 500;
`;

const AIDisclosureLink = styled(Link)`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  text-decoration: none;

  &:hover {
    color: rgba(255, 255, 255, 0.5);
    text-decoration: underline;
  }
`;
