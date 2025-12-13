import Head from "next/head";
import styled from "styled-components";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Gift, Package, Lock } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { LoungeLayout } from "../../components/lounge/layout/LoungeLayout";
import { useTierAccess } from "../../hooks/lounge/useTierAccess";
import { LOUNGE_COLORS, RARITY_COLORS, RARITY_ORDER } from "../../constants/lounge";
import {
  MysteryBoxAnimation,
  UnopenedBoxCard,
  InventoryItem,
  ClaimModal,
} from "../../components/lounge/rewards";
import type { ClaimData } from "../../components/lounge/rewards";
import type { Reward, InventoryItem as InventoryItemType, ItemRarity } from "../../types/lounge";
import type { Id } from "../../convex/_generated/dataModel";

export const getServerSideProps = () => ({ props: {} });

type FilterType = "all" | ItemRarity;

export default function RewardsPage() {
  const [mounted, setMounted] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Reward | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [claimingItem, setClaimingItem] = useState<InventoryItemType | null>(null);

  const { isLoading, user, tier, displayName, avatarUrl, isFreeUser, isSupporter } = useTierAccess();

  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const revealReward = useMutation(api.rewards.revealReward);
  const claimItem = useMutation(api.rewards.claimItem);

  // Queries
  const unopenedBoxes = useQuery(
    api.rewards.getUnopenedBoxes,
    userReady ? {} : "skip"
  ) as Reward[] | undefined;

  const inventory = useQuery(
    api.rewards.getInventory,
    userReady ? {} : "skip"
  ) as InventoryItemType[] | undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading || !user || !tier || userReady) return;

    const discordAccount = user.externalAccounts?.find(
      (account) => account.provider === "discord"
    );
    // Clerk stores Discord user ID in providerUserId (preferred) or externalId
    const discordId =
      (discordAccount as any)?.providerUserId ||
      (discordAccount as any)?.externalId;

    getOrCreateUser({
      displayName: displayName || "Anonymous",
      avatarUrl: avatarUrl,
      tier: tier,
      discordId: discordId,
    })
      .then(() => {
        setUserReady(true);
      })
      .catch(() => {
        setUserReady(true);
      });
  }, [mounted, isLoading, user, tier, displayName, avatarUrl, userReady, getOrCreateUser]);

  // Filter and sort inventory
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];

    let filtered = inventory;
    if (filter !== "all") {
      filtered = inventory.filter((item) => item.rarity === filter);
    }

    // Sort by rarity (legendary first), then by claimed status
    return filtered.sort((a, b) => {
      const rarityDiff = (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0);
      if (rarityDiff !== 0) return rarityDiff;
      return a.isClaimed ? 1 : -1;
    });
  }, [inventory, filter]);

  const handleOpenBox = async (reward: Reward) => {
    setSelectedBox(reward);
  };

  const handleRevealComplete = async () => {
    if (!selectedBox) return;
    try {
      await revealReward({ rewardId: selectedBox._id });
    } catch (error) {
      console.error("Failed to reveal reward:", error);
    }
  };

  // Open the claim modal for an item
  const handleStartClaim = (itemId: string) => {
    const item = inventory?.find((i) => i.id === itemId);
    if (item && !item.isClaimed) {
      setClaimingItem(item);
    }
  };

  // Process the actual claim with form data
  const handleClaimItem = async (data: ClaimData) => {
    try {
      await claimItem({
        rewardId: data.rewardId as Id<"rewards">,
        itemId: data.itemId,
        deliveryMethod: data.deliveryMethod,
        email: data.email,
        shoutoutTitle: data.shoutoutTitle,
        shoutoutImage: data.shoutoutImage,
        shoutoutLink: data.shoutoutLink,
      });
    } catch (error) {
      console.error("Failed to claim item:", error);
      throw error;
    }
  };

  if (isLoading || !userReady) {
    return (
      <LoungeLayout channelName="Rewards" customIcon={Gift}>
        <Container>
          <LoadingContainer>
            <LoadingText>Loading rewards...</LoadingText>
          </LoadingContainer>
        </Container>
      </LoungeLayout>
    );
  }

  const hasUnopenedBoxes = unopenedBoxes && unopenedBoxes.length > 0;
  const hasInventory = inventory && inventory.length > 0;

  return (
    <>
      <Head>
        <title>Rewards | nevulounge</title>
      </Head>
      <LoungeLayout channelName="Rewards" customIcon={Gift}>
        <Container>
          <ContentWrapper>
          {/* Unopened Boxes Section */}
          <Section>
            <SectionHeader>
              <SectionIcon>
                <Package size={20} />
              </SectionIcon>
              <SectionTitle>Mystery Boxes</SectionTitle>
              {hasUnopenedBoxes && (
                <Badge>{unopenedBoxes.length} unopened</Badge>
              )}
            </SectionHeader>

            {hasUnopenedBoxes ? (
              <BoxesGrid>
                {unopenedBoxes.map((box) => (
                  <UnopenedBoxCard
                    key={box._id}
                    reward={box}
                    onClick={() => handleOpenBox(box)}
                  />
                ))}
              </BoxesGrid>
            ) : (
              <EmptyState>
                <EmptyIcon>
                  <Package size={48} />
                </EmptyIcon>
                <EmptyTitle>No mystery boxes</EmptyTitle>
                <EmptyText>
                  When you receive new mystery boxes, they'll appear here.
                  Stay tuned for monthly drops!
                </EmptyText>
              </EmptyState>
            )}
          </Section>

          {/* Inventory Section */}
          <Section>
            <SectionHeader>
              <SectionIcon>
                <Gift size={20} />
              </SectionIcon>
              <SectionTitle>Inventory</SectionTitle>
              {hasInventory && isSupporter && (
                <Badge>{inventory.length} items</Badge>
              )}
              {isFreeUser && (
                <LockedBadge>
                  <Lock size={12} />
                  Supporters Only
                </LockedBadge>
              )}
            </SectionHeader>

            {/* Free users see locked inventory */}
            {isFreeUser ? (
              <LockedState>
                <LockedIcon>
                  <Lock size={48} />
                </LockedIcon>
                <LockedTitle>Inventory Locked</LockedTitle>
                <LockedText>
                  Free members can claim rewards instantly when received, but can't store items in inventory.
                  Upgrade to Super Legend to save items and access them anytime!
                </LockedText>
                <UpgradeHint>
                  Your claimed items are delivered immediately via email or direct download.
                </UpgradeHint>
              </LockedState>
            ) : (
              <>
                {hasInventory && (
                  <FilterBar>
                    <FilterButton
                      $active={filter === "all"}
                      onClick={() => setFilter("all")}
                    >
                      All
                    </FilterButton>
                    {(["legendary", "epic", "rare", "uncommon", "common"] as ItemRarity[]).map(
                      (rarity) => {
                        const count = inventory.filter((i) => i.rarity === rarity).length;
                        if (count === 0) return null;
                        const colors = RARITY_COLORS[rarity];
                        return (
                          <FilterButton
                            key={rarity}
                            $active={filter === rarity}
                            $color={colors.color}
                            onClick={() => setFilter(rarity)}
                          >
                            {colors.label} ({count})
                          </FilterButton>
                        );
                      }
                    )}
                  </FilterBar>
                )}

                {hasInventory ? (
                  <InventoryGrid>
                    {filteredInventory.map((item) => (
                      <InventoryItem
                        key={item.id}
                        item={item}
                        onClaim={handleStartClaim}
                      />
                    ))}
                  </InventoryGrid>
                ) : (
                  <EmptyState>
                    <EmptyIcon>
                      <Gift size={48} />
                    </EmptyIcon>
                    <EmptyTitle>Inventory is empty</EmptyTitle>
                    <EmptyText>
                      Open mystery boxes to earn exclusive items that will be stored here.
                    </EmptyText>
                  </EmptyState>
                )}
              </>
            )}
          </Section>
          </ContentWrapper>
        </Container>

        {/* Mystery Box Animation Overlay */}
        <AnimatePresence>
          {selectedBox && (
            <MysteryBoxAnimation
              reward={selectedBox}
              onComplete={handleRevealComplete}
              onClose={() => setSelectedBox(null)}
            />
          )}
        </AnimatePresence>

        {/* Claim Modal */}
        {claimingItem && (
          <ClaimModal
            item={claimingItem}
            isOpen={!!claimingItem}
            onClose={() => setClaimingItem(null)}
            onClaim={handleClaimItem}
          />
        )}
      </LoungeLayout>
    </>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const ContentWrapper = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const SectionIcon = styled.div`
  width: 32px;
  height: 32px;
  background: rgba(144, 116, 242, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${LOUNGE_COLORS.tier1};
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const Badge = styled.span`
  padding: 0.25rem 0.5rem;
  background: rgba(144, 116, 242, 0.2);
  color: ${LOUNGE_COLORS.tier1};
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
`;

const BoxesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FilterButton = styled.button<{ $active: boolean; $color?: string }>`
  padding: 0.375rem 0.75rem;
  background: ${(props) =>
    props.$active
      ? props.$color
        ? `${props.$color}33`
        : "rgba(144, 116, 242, 0.2)"
      : "rgba(255, 255, 255, 0.05)"};
  border: 1px solid
    ${(props) =>
      props.$active
        ? props.$color || LOUNGE_COLORS.tier1
        : "rgba(255, 255, 255, 0.1)"};
  color: ${(props) =>
    props.$active ? props.$color || LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.6)"};
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$color ? `${props.$color}22` : "rgba(144, 116, 242, 0.1)"};
  }
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(5, 1fr);
  }

  @media (min-width: 900px) and (max-width: 1199px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  color: rgba(255, 255, 255, 0.2);
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  max-width: 300px;
`;

// Locked state for free users
const LockedBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.25rem 0.5rem;
  background: rgba(107, 114, 128, 0.2);
  color: #9CA3AF;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
`;

const LockedState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  background: rgba(107, 114, 128, 0.1);
  border: 1px dashed rgba(107, 114, 128, 0.3);
  border-radius: 16px;
  text-align: center;
`;

const LockedIcon = styled.div`
  color: rgba(107, 114, 128, 0.4);
  margin-bottom: 1rem;
`;

const LockedTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 0.5rem;
`;

const LockedText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 1rem;
  max-width: 400px;
`;

const UpgradeHint = styled.p`
  font-size: 0.8rem;
  color: ${LOUNGE_COLORS.tier1};
  margin: 0;
  padding: 0.5rem 1rem;
  background: rgba(144, 116, 242, 0.1);
  border-radius: 8px;
`;
