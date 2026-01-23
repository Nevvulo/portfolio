import { useQuery } from "convex/react";
import { Package } from "lucide-react";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../components/layout/blog";
import { SimpleNavbar } from "../../components/navbar/simple";
import { PreviewModal, VaultCard, VaultGrid, type VaultItem } from "../../components/vault";
import { api } from "../../convex/_generated/api";

const ITEMS_PER_PAGE = 12;

export default function VaultPage() {
  const [offset, setOffset] = useState(0);
  const [accumulatedItems, setAccumulatedItems] = useState<VaultItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Query vault content with pagination
  const result = useQuery(api.vault.getVaultContent, {
    limit: ITEMS_PER_PAGE,
    offset,
  });

  // Accumulate items as we load more
  useEffect(() => {
    if (result?.items) {
      setAccumulatedItems((prev) => {
        if (offset === 0) {
          return result.items as VaultItem[];
        }
        // Append, avoiding duplicates
        const existingIds = new Set(prev.map((i) => i._id));
        const newItems = result.items.filter((i) => !existingIds.has(i._id));
        return [...prev, ...(newItems as VaultItem[])];
      });
      setIsLoadingMore(false);
    }
  }, [result, offset]);

  // Refs for intersection observer
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  hasMoreRef.current = result?.hasMore ?? false;
  isLoadingMoreRef.current = isLoadingMore;

  const handleLoadMore = useCallback(() => {
    if (hasMoreRef.current && !isLoadingMoreRef.current) {
      setIsLoadingMore(true);
      setOffset((prev) => prev + ITEMS_PER_PAGE);
    }
  }, []);

  const hasItems = accumulatedItems.length > 0;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleLoadMore, hasItems]);

  const handlePreview = (item: VaultItem) => {
    setPreviewItem(item);
  };

  const isLoading = result === undefined;
  const hasMore = result?.hasMore ?? false;

  return (
    <BlogView>
      <NavbarWrapper>
        <SimpleNavbar />
      </NavbarWrapper>

      <PageHeader>
        <HeaderTitle>vault</HeaderTitle>
        <HeaderDescription>instant downloadables & fun stuff for supporters</HeaderDescription>
      </PageHeader>

      <ContentContainer>
        {isLoading ? (
          <LoadingSkeleton />
        ) : accumulatedItems.length === 0 ? (
          <EmptyState>
            <Package size={48} />
            <p>The vault is empty</p>
            <p>Check back soon for exclusive content!</p>
          </EmptyState>
        ) : (
          <>
            <VaultGrid>
              {accumulatedItems.map((item) => (
                <VaultCard key={item._id} item={item} onPreview={handlePreview} />
              ))}
            </VaultGrid>

            {/* Infinite scroll trigger */}
            <LoadMoreTrigger ref={loadMoreRef}>
              {isLoadingMore && hasMore && (
                <LoadingIndicator>
                  <LoadingDot $delay={0} />
                  <LoadingDot $delay={0.1} />
                  <LoadingDot $delay={0.2} />
                </LoadingIndicator>
              )}
            </LoadMoreTrigger>
          </>
        )}
      </ContentContainer>

      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}

      <Head key="vault">
        <title>Vault - Nevulo</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Protest+Revolution&display=swap"
          rel="stylesheet"
        />
        <meta
          name="description"
          content="Access exclusive downloads, resources, and tier-restricted content in the vault."
        />
        <meta property="og:title" content="Vault - Nevulo" />
        <meta
          property="og:description"
          content="Access exclusive downloads, resources, and tier-restricted content."
        />
        <meta property="og:url" content="https://nev.so/vault" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Vault&subtitle=Exclusive%20Content"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Nevulo" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Vault - Nevulo" />
        <meta
          name="twitter:description"
          content="Access exclusive downloads, resources, and tier-restricted content."
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Vault&subtitle=Exclusive%20Content"
        />
        <link rel="canonical" href="https://nev.so/vault" />
      </Head>
    </BlogView>
  );
}

function LoadingSkeleton() {
  return (
    <SkeletonGrid>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i}>
          <SkeletonThumbnail />
          <SkeletonContent>
            <SkeletonTitle />
            <SkeletonDescription />
            <SkeletonMeta />
          </SkeletonContent>
        </SkeletonCard>
      ))}
    </SkeletonGrid>
  );
}

// Styled components
const NavbarWrapper = styled.div`
  & > header > div:first-child {
    max-width: 1400px;
    justify-content: flex-start;
    padding: 0 48px;

    @media (max-width: 900px) {
      padding: 0 16px;
    }

    & > div:first-child {
      display: none;
    }

    & > div:nth-child(2) {
      align-items: flex-start;
    }

    & > div:last-child {
      display: none;
    }
  }
`;

const PageHeader = styled.div`
  padding: 0 48px;
  max-width: 1400px;
  margin: 0 auto;
  margin-top: -30px;
  margin-bottom: 32px;

  @media (max-width: 900px) {
    padding: 0 16px;
    margin-bottom: 24px;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 80px;
  position: relative;
  font-weight: 900;
  margin-left: auto;
  margin-right: auto;
  color: ${(props) => props.theme.contrast};
  font-family: 'Protest Revolution', cursive;
  letter-spacing: 2px;
  transform: rotate(-3deg);
  width: fit-content;

  @media (max-width: 640px) {
    font-size: 56px;
  }
`;

const HeaderDescription = styled.p`
  margin: 0;
  padding-left: 24px;
  font-size: 16px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;

  @media (max-width: 640px) {
    font-size: 14px;
    padding-left: 16px;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  padding-bottom: 60px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: ${(props) => props.theme.textColor};

  svg {
    margin-bottom: 16px;
    opacity: 0.3;
  }

  p {
    margin: 4px 0;
    opacity: 0.6;

    &:first-of-type {
      font-size: 18px;
      font-weight: 500;
    }
  }
`;

const LoadMoreTrigger = styled.div`
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
`;

const LoadingIndicator = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const LoadingDot = styled.div<{ $delay: number }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(144, 116, 242, 0.6);
  animation: bounce 0.6s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay}s;

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
      opacity: 0.6;
    }
    50% {
      transform: translateY(-8px);
      opacity: 1;
    }
  }
`;

// Skeleton styles
const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 0 48px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 0 16px;
  }
`;

const SkeletonCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
`;

const SkeletonThumbnail = styled.div`
  aspect-ratio: 16 / 9;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkeletonContent = styled.div`
  padding: 16px;
`;

const SkeletonTitle = styled.div`
  height: 20px;
  width: 80%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
`;

const SkeletonDescription = styled.div`
  height: 14px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 12px;
`;

const SkeletonMeta = styled.div`
  display: flex;
  gap: 8px;

  &::before,
  &::after {
    content: "";
    height: 22px;
    width: 60px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
`;
