import { Check, ChevronRight, Clock, Lock, type LucideIcon } from "lucide-react";
import Link from "next/link";
import styled from "styled-components";
import { SupporterBadge } from "../badges/supporter-badge";
import { type BadgeType } from "../../constants/badges";

// Types
export interface BenefitFeature {
  id: string;
  title: string;
  description: string;
  minTier?: "free" | "tier1" | "tier2";
  special?: "twitch" | "discordBooster";
  badgeType?: BadgeType;
  badgeLink?: string;
  link?: string;
  comingSoon?: boolean;
}

export interface BenefitCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  features: BenefitFeature[];
}

// Helper to get tier level
export function getTierLevel(tier: string): number {
  if (tier === "tier2") return 2;
  if (tier === "tier1") return 1;
  return 0;
}

// Feature Status Icon Component
interface FeatureStatusIconProps {
  unlocked: boolean;
  comingSoon?: boolean;
}

export function FeatureStatusIcon({ unlocked, comingSoon }: FeatureStatusIconProps) {
  return (
    <StatusIconWrapper $unlocked={unlocked}>
      {unlocked ? <Check size={14} /> : comingSoon ? <Clock size={14} /> : <Lock size={14} />}
    </StatusIconWrapper>
  );
}

// Feature Item Component
interface BenefitFeatureItemProps {
  feature: BenefitFeature;
  unlocked: boolean;
}

export function BenefitFeatureItem({ feature, unlocked }: BenefitFeatureItemProps) {
  return (
    <FeatureItemWrapper $unlocked={unlocked}>
      <FeatureStatusIcon unlocked={unlocked} comingSoon={feature.comingSoon} />
      <FeatureContent>
        <FeatureTitle>
          {feature.title}
          {feature.comingSoon && <ComingSoonTag>Coming Soon</ComingSoonTag>}
        </FeatureTitle>
        <FeatureDescription>{feature.description}</FeatureDescription>
      </FeatureContent>
      {feature.badgeType && (
        <BadgePreview
          href={feature.badgeLink || "#"}
          target={feature.badgeLink?.startsWith("http") ? "_blank" : undefined}
          rel={feature.badgeLink?.startsWith("http") ? "noopener noreferrer" : undefined}
        >
          <SupporterBadge type={feature.badgeType} size="small" />
        </BadgePreview>
      )}
      {feature.link && unlocked && (
        <FeatureLink href={feature.link}>
          <ChevronRight size={16} />
        </FeatureLink>
      )}
    </FeatureItemWrapper>
  );
}

// Category Card Component
interface BenefitCategoryCardProps {
  category: BenefitCategory;
  isFeatureUnlocked: (feature: BenefitFeature) => boolean;
}

export function BenefitCategoryCard({ category, isFeatureUnlocked }: BenefitCategoryCardProps) {
  const IconComponent = category.icon;

  return (
    <CategoryCardWrapper>
      <CategoryHeader>
        <CategoryIcon>
          <IconComponent size={28} />
        </CategoryIcon>
        <CategoryInfo>
          <CategoryTitle>{category.title}</CategoryTitle>
          <CategoryDescription>{category.description}</CategoryDescription>
        </CategoryInfo>
      </CategoryHeader>

      <FeaturesList>
        {category.features.map((feature) => {
          const unlocked = isFeatureUnlocked(feature);
          return (
            <BenefitFeatureItem
              key={feature.id}
              feature={feature}
              unlocked={unlocked}
            />
          );
        })}
      </FeaturesList>
    </CategoryCardWrapper>
  );
}

// Styled Components
const StatusIconWrapper = styled.div<{ $unlocked: boolean }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(props) =>
    props.$unlocked ? "linear-gradient(135deg, #4f4dc1, #6b69d6)" : "rgba(255, 255, 255, 0.1)"};
  color: ${(props) => (props.$unlocked ? "white" : props.theme.textColor)};
`;

const FeatureItemWrapper = styled.div<{ $unlocked: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  background: ${(props) =>
    props.$unlocked ? "rgba(79, 77, 193, 0.08)" : "rgba(255, 255, 255, 0.02)"};
  opacity: ${(props) => (props.$unlocked ? 1 : 0.6)};
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$unlocked ? "rgba(79, 77, 193, 0.12)" : "rgba(255, 255, 255, 0.04)"};
  }
`;

const FeatureContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const FeatureTitle = styled.div`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  color: ${(props) => props.theme.contrast};
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ComingSoonTag = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
`;

const FeatureDescription = styled.div`
  font-family: var(--font-sans);
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  line-height: 1.4;
  margin-top: 2px;
`;

const BadgePreview = styled(Link)`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  text-decoration: none;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const FeatureLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(79, 77, 193, 0.2);
  color: #4f4dc1;
  text-decoration: none;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.3);
    transform: translateX(2px);
  }
`;

const FeaturesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CategoryCardWrapper = styled.div`
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(79, 77, 193, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(79, 77, 193, 0.4);
    box-shadow: 0 4px 20px rgba(79, 77, 193, 0.1);
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(79, 77, 193, 0.15);
`;

const CategoryIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(79, 77, 193, 0.15);
  color: #4f4dc1;
  flex-shrink: 0;
`;

const CategoryInfo = styled.div`
  flex: 1;
`;

const CategoryTitle = styled.h2`
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 4px 0;
`;

const CategoryDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  opacity: 0.8;
`;
