import { useMutation, useQuery as useRQ } from "@tanstack/react-query";
import { Gift, Package, Sparkles } from "lucide-react";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../components/layout/blog";
import { SimpleNavbar } from "../../components/navbar/simple";
import { PreviewModal, VaultCard, VaultGrid, type VaultItem } from "../../components/vault";
import { RARITY_COLORS, type Rarity } from "../../constants/rarity";
import { getVaultContent, getAvailableClaimables, claimTierItem } from "@/src/db/client/inventory";

const ITEMS_PER_PAGE = 12;

export default function VaultPage() {
  const [offset, setOffset] = useState(0);
  const [accumulatedItems, setAccumulatedItems] = useState<VaultItem[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Claimables data
  const { data: claimables } = useRQ({
    queryKey: ["claimables"],
    queryFn: () => getAvailableClaimables(),
  });
  const claimTierItemMutation = useMutation({
    mutationFn: (tierClaimableId: number) => claimTierItem(tierClaimableId),
  });
  const [claimingId, setClaimingId] = useState<number | null>(null);

  // Vault files pagination
  const { data: result } = useRQ({
    queryKey: ["vault", "content", offset],
    queryFn: () => getVaultContent(ITEMS_PER_PAGE, offset),
  });

  useEffect(() => {
    if (result?.items) {
      setAccumulatedItems((prev) => {
        if (offset === 0) {
          return result.items as VaultItem[];
        }
        const existingIds = new Set(prev.map((i) => i.id));
        const newItems = result.items.filter((i) => !existingIds.has(i.id));
        return [...prev, ...(newItems as VaultItem[])];
      });
      setIsLoadingMore(false);
    }
  }, [result, offset]);

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

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleLoadMore, hasItems]);

  const handleClaim = async (tierClaimableId: number) => {
    setClaimingId(tierClaimableId);
    try {
      await claimTierItemMutation.mutateAsync(tierClaimableId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to claim item");
    } finally {
      setClaimingId(null);
    }
  };

  const hasUnclaimed = claimables && claimables.length > 0;
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
        {/* Unclaimed Tier Items */}
        {hasUnclaimed && (
          <VaultSection>
            <SectionLabel>
              <Gift size={18} /> Unclaimed Items
            </SectionLabel>
            <ClaimableScroll>
              {claimables!.map((claimable: any) => {
                const item = claimable.item;
                if (!item) return null;
                const rarity = item.rarity as Rarity;
                const config = RARITY_COLORS[rarity] || RARITY_COLORS.common;
                return (
                  <ClaimCard key={claimable.id} $glowColor={config.color}>
                    <ClaimCardGlow $gradient={config.gradient} />
                    {item.iconUrl ? (
                      <ClaimIcon src={item.iconUrl} alt={item.name} />
                    ) : (
                      <ClaimIconPlaceholder $color={config.color}>
                        <Sparkles size={28} />
                      </ClaimIconPlaceholder>
                    )}
                    <ClaimName>{item.name}</ClaimName>
                    <ClaimRarity $color={config.color}>{config.label}</ClaimRarity>
                    {claimable.headline && <ClaimHeadline>{claimable.headline}</ClaimHeadline>}
                    <ClaimButton
                      onClick={() => handleClaim(claimable.id)}
                      disabled={claimingId === claimable.id}
                    >
                      {claimingId === claimable.id ? "Claiming..." : "Claim"}
                    </ClaimButton>
                  </ClaimCard>
                );
              })}
            </ClaimableScroll>
          </VaultSection>
        )}

        {/* Vault Downloads (existing) */}
        <VaultSection>
          <SectionLabel>
            <Package size={18} /> Vault Downloads
          </SectionLabel>
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
                  <VaultCard key={item.id} item={item} onPreview={(item) => setPreviewItem(item)} />
                ))}
              </VaultGrid>
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
        </VaultSection>
      </ContentContainer>

      {/* Modals */}
      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}

      <Head key="vault">
        <title>nevulo - Vault</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Protest+Revolution&display=swap"
          rel="stylesheet"
        />
        <meta name="description" content="Access exclusive downloads, resources, and tier-restricted content in the vault." />
        <meta property="og:title" content="nevulo - Vault" />
        <meta property="og:description" content="Access exclusive downloads, resources, and tier-restricted content." />
        <meta property="og:url" content="https://nev.so/vault" />
        <meta property="og:image" content="https://nev.so/api/og?title=Vault&subtitle=Exclusive%20Content" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="nevulo" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="nevulo - Vault" />
        <meta name="twitter:description" content="Access exclusive downloads, resources, and tier-restricted content." />
        <meta name="twitter:image" content="https://nev.so/api/og?title=Vault&subtitle=Exclusive%20Content" />
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
    @media (max-width: 900px) { padding: 0 16px; }
    & > div:first-child { display: none; }
    & > div:nth-child(2) { align-items: flex-start; }
    & > div:last-child { display: none; }
  }
`;

const PageHeader = styled.div`
  padding: 0 48px;
  max-width: 1400px;
  margin: 0 auto;
  margin-top: -30px;
  margin-bottom: 32px;
  @media (max-width: 900px) { padding: 0 16px; margin-bottom: 24px; }
`;

const HeaderTitle = styled.h1`
  font-size: 80px;
  position: relative;
  font-weight: 900;
  margin-left: auto;
  margin-right: auto;
  color: ${(p) => p.theme.contrast};
  font-family: 'Protest Revolution', cursive;
  letter-spacing: 2px;
  transform: rotate(-3deg);
  width: fit-content;
  @media (max-width: 640px) { font-size: 56px; }
`;

const HeaderDescription = styled.p`
  margin: 0;
  padding-left: 24px;
  font-size: 16px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
  @media (max-width: 640px) { font-size: 14px; padding-left: 16px; }
`;

const ContentContainer = styled.div`
  width: 100%;
  padding-bottom: 60px;
`;

const VaultSection = styled.section`
  margin-bottom: 40px;
  padding: 0 48px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  @media (max-width: 900px) { padding: 0 16px; }
`;

const SectionLabel = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 16px;
`;

// Claimable items
const ClaimableScroll = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
`;

const ClaimCard = styled.div<{ $glowColor: string }>`
  flex-shrink: 0;
  width: 200px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${(p) => p.$glowColor}66;
    box-shadow: 0 4px 24px ${(p) => p.$glowColor}22;
  }
`;

const ClaimCardGlow = styled.div<{ $gradient: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: ${(p) => p.$gradient};
`;

const ClaimIcon = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
`;

const ClaimIconPlaceholder = styled.div<{ $color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$color}22;
  color: ${(p) => p.$color};
`;

const ClaimName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  text-align: center;
`;

const ClaimRarity = styled.div<{ $color: string }>`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(p) => p.$color};
`;

const ClaimHeadline = styled.div`
  font-size: 11px;
  color: #f59e0b;
  font-style: italic;
  text-align: center;
`;

const ClaimButton = styled.button`
  width: 100%;
  padding: 8px 16px;
  background: linear-gradient(135deg, #9074f2 0%, #6366f1 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: ${(p) => p.theme.textColor};
  svg { margin-bottom: 16px; opacity: 0.3; }
  p { margin: 4px 0; opacity: 0.6; &:first-of-type { font-size: 18px; font-weight: 500; } }
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
    0%, 100% { transform: translateY(0); opacity: 0.6; }
    50% { transform: translateY(-8px); opacity: 1; }
  }
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 640px) { grid-template-columns: 1fr; gap: 14px; }
`;

const SkeletonCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
`;

const SkeletonThumbnail = styled.div`
  aspect-ratio: 16 / 9;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
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
  &::before, &::after {
    content: "";
    height: 22px;
    width: 60px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
`;
