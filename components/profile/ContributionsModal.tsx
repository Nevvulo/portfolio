import { useQuery as useRQ } from "@tanstack/react-query";
import { AnimatePresence, m } from "framer-motion";
import { Clock, FileText, Newspaper, Video, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { LOUNGE_COLORS } from "@/constants/theme";
import { getUserContributions } from "@/src/db/client/profile";

interface ContributionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

const contentTypeIcons = {
  article: FileText,
  video: Video,
  news: Newspaper,
};

export function ContributionsModal({ isOpen, onClose, userId, userName }: ContributionsModalProps) {
  const { data: contributions, isLoading: contributionsLoading } = useRQ({
    queryKey: ["contributions", userId],
    queryFn: () => getUserContributions(userId),
    enabled: isOpen,
  });

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>
                <FileText size={20} />
                {userName}'s Contributions
              </Title>
              <CloseButton onClick={onClose}>
                <X size={20} />
              </CloseButton>
            </Header>

            <Content>
              {contributionsLoading ? (
                <LoadingState>Loading contributions...</LoadingState>
              ) : !contributions || contributions.length === 0 ? (
                <EmptyState>
                  <FileText size={48} />
                  <p>No article contributions yet</p>
                </EmptyState>
              ) : (
                <ContributionsList>
                  {contributions.map((post) => {
                    const Icon =
                      contentTypeIcons[post.contentType as keyof typeof contentTypeIcons] ||
                      FileText;

                    return (
                      <ContributionCard
                        key={post.id}
                        href={`/learn/${post.slug}`}
                        onClick={onClose}
                      >
                        {post.coverImage && <CoverImage src={post.coverImage} alt={post.title} />}
                        <CardContent $hasCover={!!post.coverImage}>
                          <ContentType>
                            <Icon size={14} />
                            {post.contentType}
                            {post.isAuthor ? (
                              <RoleBadge $role="author">Author</RoleBadge>
                            ) : (
                              <RoleBadge $role="collaborator">Collaborator</RoleBadge>
                            )}
                          </ContentType>
                          <CardTitle>{post.title}</CardTitle>
                          {post.description && (
                            <CardDescription>
                              {post.description.length > 120
                                ? post.description.slice(0, 120) + "..."
                                : post.description}
                            </CardDescription>
                          )}
                          <CardMeta>
                            {post.readTimeMins && (
                              <MetaItem>
                                <Clock size={12} />
                                {post.readTimeMins} min read
                              </MetaItem>
                            )}
                            {post.publishedAt && (
                              <MetaItem>
                                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </MetaItem>
                            )}
                          </CardMeta>
                        </CardContent>
                      </ContributionCard>
                    );
                  })}
                </ContributionsList>
              )}
            </Content>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Styled Components
const Overlay = styled(m.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled(m.div)`
  background: rgba(20, 17, 32, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const CloseButton = styled.button`
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

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;

  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

const ContributionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ContributionCard = styled(Link)`
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(144, 116, 242, 0.3);
  }
`;

const CoverImage = styled.img`
  width: 100px;
  height: 70px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

const CardContent = styled.div<{ $hasCover?: boolean }>`
  flex: 1;
  min-width: 0;
`;

const ContentType = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
`;

const RoleBadge = styled.span<{ $role: "author" | "collaborator" }>`
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  margin-left: 4px;
  background: ${(p) =>
    p.$role === "author" ? "rgba(144, 116, 242, 0.2)" : "rgba(255, 184, 0, 0.2)"};
  color: ${(p) => (p.$role === "author" ? LOUNGE_COLORS.tier1 : "#ffb800")};
`;

const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardDescription = styled.p`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 8px;
  line-height: 1.4;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
`;
