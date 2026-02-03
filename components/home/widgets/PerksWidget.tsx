import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Check, Crown, ExternalLink, Gift, Link2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { RARITY_COLORS, type Rarity } from "../../../constants/rarity";
import { LOUNGE_COLORS } from "../../../constants/theme";
import { WidgetContainer } from "./WidgetContainer";

interface SuperLegendService {
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
}

interface LinkedService {
  slug: string;
  serviceUserId?: string;
  serviceUsername?: string;
  linkedAt: number;
}

type LinkingState = "idle" | "loading" | "success" | "error";

export function PerksWidget() {
  const user = useQuery(api.users.getMe);
  const claimables = useQuery(api.inventory.getAvailableClaimables);
  const linkedServices = useQuery(api.users.getLinkedServices);
  const linkServiceMutation = useMutation(api.users.linkService);
  const claimItem = useMutation(api.inventory.claimTierItem);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [superLegendServices, setSuperLegendServices] = useState<SuperLegendService[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [linkingStates, setLinkingStates] = useState<Record<string, LinkingState>>({});
  const [linkingErrors, setLinkingErrors] = useState<Record<string, string>>({});

  // Fetch Super Legend services on mount
  useEffect(() => {
    fetch("/api/netvulo/services")
      .then((res) => res.json())
      .then((data) => {
        setSuperLegendServices(data.services || []);
      })
      .catch(() => {})
      .finally(() => setServicesLoaded(true));
  }, []);

  const isTier2 = user?.tier === "tier2";
  const isTier1 = user?.tier === "tier1";

  const handleClaim = async (tierClaimableId: Id<"tierClaimables">) => {
    setClaimingId(tierClaimableId);
    try {
      await claimItem({ tierClaimableId });
    } catch (error) {
      console.error("Failed to claim item:", error);
    } finally {
      setClaimingId(null);
    }
  };

  const handleLink = async (service: SuperLegendService) => {
    setLinkingStates((prev) => ({ ...prev, [service.slug]: "loading" }));
    setLinkingErrors((prev) => ({ ...prev, [service.slug]: "" }));

    try {
      const res = await fetch("/api/netvulo/assert-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: service.slug }),
      });

      const data = await res.json();

      if (data.linked) {
        // Also persist to Convex directly
        await linkServiceMutation({
          slug: service.slug,
          serviceUserId: data.serviceUserId,
          serviceUsername: data.serviceUsername,
        });
        setLinkingStates((prev) => ({ ...prev, [service.slug]: "success" }));
        // Reset to idle after 2 seconds
        setTimeout(() => {
          setLinkingStates((prev) => ({ ...prev, [service.slug]: "idle" }));
        }, 2000);
      } else {
        setLinkingStates((prev) => ({ ...prev, [service.slug]: "error" }));
        setLinkingErrors((prev) => ({
          ...prev,
          [service.slug]: data.error || "Unable to link account",
        }));
        // Reset to idle after 3 seconds
        setTimeout(() => {
          setLinkingStates((prev) => ({ ...prev, [service.slug]: "idle" }));
        }, 3000);
      }
    } catch (error) {
      setLinkingStates((prev) => ({ ...prev, [service.slug]: "error" }));
      setLinkingErrors((prev) => ({
        ...prev,
        [service.slug]: "Failed to connect",
      }));
      setTimeout(() => {
        setLinkingStates((prev) => ({ ...prev, [service.slug]: "idle" }));
      }, 3000);
    }
  };

  const isServiceLinked = (slug: string) => {
    return linkedServices?.some((s) => s.slug === slug) ?? false;
  };

  const hasClaimables = claimables && claimables.length > 0;
  const hasServices = superLegendServices.length > 0;

  return (
    <WidgetContainer
      title="Perks"
      icon={<Crown size={16} />}
      headerAction={<Link href="/vault">View Vault</Link>}
      variant="accent"
    >
      <PerksContent>
        {/* Monthly Legend Loot - tier2 only */}
        {isTier2 && (
          <Section>
            <SectionHeader>
              <Gift size={14} />
              <SectionTitle>Monthly Legend Loot</SectionTitle>
            </SectionHeader>
            {hasClaimables ? (
              <ClaimablesList>
                {claimables.slice(0, 3).map((claimable) => (
                  <ClaimableItem key={claimable._id}>
                    <ItemIcon $rarity={(claimable.item?.rarity as Rarity) ?? "common"}>
                      {claimable.item?.iconUrl ? (
                        <Image
                          src={claimable.item.iconUrl}
                          alt={claimable.item.name}
                          width={24}
                          height={24}
                          style={{ borderRadius: 4 }}
                        />
                      ) : (
                        <Gift size={16} />
                      )}
                    </ItemIcon>
                    <ItemInfo>
                      <ItemName>{claimable.item?.name ?? "Unknown Item"}</ItemName>
                      <ItemRarity $rarity={(claimable.item?.rarity as Rarity) ?? "common"}>
                        {RARITY_COLORS[(claimable.item?.rarity as Rarity) ?? "common"].label}
                      </ItemRarity>
                    </ItemInfo>
                    <ClaimButton
                      onClick={() => handleClaim(claimable._id)}
                      disabled={claimingId === claimable._id}
                    >
                      {claimingId === claimable._id ? "..." : "Claim"}
                    </ClaimButton>
                  </ClaimableItem>
                ))}
              </ClaimablesList>
            ) : (
              <EmptyState>
                <Check size={16} />
                <span>All items claimed!</span>
              </EmptyState>
            )}
          </Section>
        )}

        {/* Super Legend Integrations */}
        {hasServices && (
          <Section>
            <SectionHeader>
              <Link2 size={14} />
              <SectionTitle>Super Legend Integrations</SectionTitle>
            </SectionHeader>
            <ServicesList>
              {superLegendServices.slice(0, 4).map((service) => {
                const linked = isServiceLinked(service.slug);
                const linkState = linkingStates[service.slug] || "idle";
                const error = linkingErrors[service.slug];

                return (
                  <ServiceItem key={service.slug}>
                    <ServiceIcon>
                      {service.iconUrl ? (
                        <Image
                          src={service.iconUrl}
                          alt={service.name}
                          width={20}
                          height={20}
                          style={{ borderRadius: 4 }}
                        />
                      ) : (
                        <ExternalLink size={14} />
                      )}
                    </ServiceIcon>
                    <ServiceInfo>
                      <ServiceName>{service.name}</ServiceName>
                      {linkState === "error" && error && (
                        <ServiceError>{error}</ServiceError>
                      )}
                    </ServiceInfo>
                    <ServiceAction>
                      {linked || linkState === "success" ? (
                        <LinkedBadge>
                          <Check size={12} />
                          <span>Linked</span>
                        </LinkedBadge>
                      ) : linkState === "loading" ? (
                        <LinkingIndicator>
                          <Loader2 size={14} />
                        </LinkingIndicator>
                      ) : linkState === "error" ? (
                        <ErrorIndicator>
                          <AlertCircle size={14} />
                        </ErrorIndicator>
                      ) : (
                        <LinkButton onClick={() => handleLink(service)}>
                          Link
                        </LinkButton>
                      )}
                    </ServiceAction>
                  </ServiceItem>
                );
              })}
            </ServicesList>
          </Section>
        )}

        {/* Empty state for tier1 users when no services are configured */}
        {isTier1 && !hasServices && servicesLoaded && (
          <EmptyState>
            <Check size={16} />
            <span>All caught up!</span>
          </EmptyState>
        )}
      </PerksContent>
    </WidgetContainer>
  );
}

const PerksContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
`;

const SectionTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ClaimablesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ClaimableItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
`;

const ItemIcon = styled.div<{ $rarity: Rarity }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => `${RARITY_COLORS[p.$rarity].color}15`};
  border: 1px solid ${(p) => `${RARITY_COLORS[p.$rarity].color}30`};
  border-radius: 6px;
  color: ${(p) => RARITY_COLORS[p.$rarity].color};
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemRarity = styled.div<{ $rarity: Rarity }>`
  font-size: 10px;
  font-weight: 500;
  color: ${(p) => RARITY_COLORS[p.$rarity].color};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const ClaimButton = styled.button`
  padding: 5px 12px;
  background: ${LOUNGE_COLORS.tier1}20;
  border: 1px solid ${LOUNGE_COLORS.tier1}40;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: ${LOUNGE_COLORS.tier1};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${LOUNGE_COLORS.tier1}30;
    border-color: ${LOUNGE_COLORS.tier1}60;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ServicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ServiceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
`;

const ServiceIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
`;

const ServiceInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ServiceName = styled.span`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
`;

const ServiceError = styled.span`
  display: block;
  font-size: 10px;
  color: #ef4444;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ServiceAction = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const LinkButton = styled.button`
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
  }
`;

const LinkedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  color: #22c55e;
`;

const LinkingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: rgba(255, 255, 255, 0.5);

  svg {
    animation: ${spin} 1s linear infinite;
  }
`;

const ErrorIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #ef4444;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;

  svg {
    opacity: 0.6;
  }
`;
