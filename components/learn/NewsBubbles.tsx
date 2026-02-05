import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import NevuloImg from "../../assets/img/nevulo.jpg";
import type { BentoCardProps } from "./BentoCard";

interface NewsBubblesProps {
  posts: BentoCardProps[];
}

export function NewsBubbles({ posts }: NewsBubblesProps) {
  if (posts.length === 0) return null;

  return (
    <BubblesContainer>
      <BubbleStack>
        {posts.map((post, index) => {
          const isFirst = index === 0;
          const isLast = index === posts.length - 1;
          const newsDate = post.publishedAt ? new Date(post.publishedAt) : null;

          return (
            <BubbleLink key={post._id} href={`/learn/${post.slug}`} prefetch={false}>
              <MessageBubble $isFirst={isFirst} $isLast={isLast} $isOnly={posts.length === 1}>
                <BubbleTitle>{post.title}</BubbleTitle>
                <BubbleDescription>{post.description}</BubbleDescription>
                {newsDate && (
                  <BubbleDate>
                    {newsDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </BubbleDate>
                )}
              </MessageBubble>
            </BubbleLink>
          );
        })}
      </BubbleStack>
      <AvatarContainer>
        <Avatar src={NevuloImg} alt="Nevulo" width={36} height={36} />
      </AvatarContainer>
    </BubblesContainer>
  );
}

const BubblesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  width: 100%;
  padding-right: 48px; /* Space for avatar to sit beside */
  position: relative;
`;

const BubbleStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  width: 100%;
`;

const BubbleLink = styled(Link)`
  text-decoration: none;
  display: block;
  max-width: 380px;
  width: 100%;

  @media (max-width: 600px) {
    max-width: 100%;
  }
`;

const MessageBubble = styled.div<{ $isFirst: boolean; $isLast: boolean; $isOnly: boolean }>`
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.25) 0%, rgba(144, 116, 242, 0.12) 100%);
  border: 1px solid rgba(144, 116, 242, 0.3);
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  /* Dynamic border radius based on position in stack */
  border-radius: ${(p) => {
    if (p.$isOnly) return "16px 16px 4px 16px"; // Single bubble
    if (p.$isFirst) return "16px 16px 4px 16px"; // First in chain
    if (p.$isLast) return "16px 4px 4px 16px"; // Last in chain
    return "16px 4px 4px 16px"; // Middle bubbles
  }};

  &:hover {
    background: linear-gradient(135deg, rgba(144, 116, 242, 0.35) 0%, rgba(144, 116, 242, 0.2) 100%);
    border-color: rgba(144, 116, 242, 0.5);
    transform: translateX(-4px);
  }
`;

const BubbleTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  line-height: 1.3;
  font-family: var(--font-sans);
`;

const BubbleDescription = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BubbleDate = styled.span`
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const AvatarContainer = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
`;

const Avatar = styled(Image)`
  border-radius: 50%;
  border: 2px solid rgba(144, 116, 242, 0.4);
`;

export default NewsBubbles;
