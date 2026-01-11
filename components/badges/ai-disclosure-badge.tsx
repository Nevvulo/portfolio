import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styled from "styled-components";

export type AIDisclosureStatus = "none" | "llm-assisted" | "llm-reviewed";

// Cutoff timestamp: Nov 30, 2022 00:00:00 UTC
const AI_CUTOFF_TIMESTAMP = 1669766400000;

interface AIDisclosureBadgeProps {
  status?: AIDisclosureStatus;
  publishedAt?: number;
  size?: "small" | "medium";
  showLabel?: boolean;
}

const StatusLabels: Record<Exclude<AIDisclosureStatus, "none">, string> = {
  "llm-assisted": "AI-Assisted",
  "llm-reviewed": "AI-Reviewed",
};

const StatusDescriptions: Record<Exclude<AIDisclosureStatus, "none">, string> = {
  "llm-assisted": "Less than 10% of this content was influenced by AI tools",
  "llm-reviewed": "AI tools helped review this content but did not generate it",
};

export function getEffectiveAIStatus(
  status?: AIDisclosureStatus,
  publishedAt?: number,
): AIDisclosureStatus {
  // If explicitly set, use that value
  if (status) return status;

  // Posts before Nov 30, 2022 default to "none"
  if (publishedAt && publishedAt < AI_CUTOFF_TIMESTAMP) {
    return "none";
  }

  // Default to "none" for newer posts without explicit status
  return "none";
}

export function AIDisclosureBadge({
  status,
  publishedAt,
  size = "small",
  showLabel = true,
}: AIDisclosureBadgeProps) {
  const effectiveStatus = getEffectiveAIStatus(status, publishedAt);

  // Don't render anything for "none" status
  if (effectiveStatus === "none") {
    return null;
  }

  const label = StatusLabels[effectiveStatus];
  const description = StatusDescriptions[effectiveStatus];

  return (
    <Link href="/ai-disclosure" passHref legacyBehavior>
      <BadgeLink title={`${description}. Click for more info.`}>
        <BadgeContainer $size={size}>
          <FontAwesomeIcon
            icon={faRobot}
            style={{ width: size === "small" ? 12 : 14, flexShrink: 0 }}
          />
          {showLabel && <BadgeLabel>{label}</BadgeLabel>}
        </BadgeContainer>
      </BadgeLink>
    </Link>
  );
}

const BadgeLink = styled.a`
  text-decoration: none;
`;

const BadgeContainer = styled.div<{ $size: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: ${(p) => (p.$size === "small" ? "2px 6px" : "4px 10px")};
  background: rgba(128, 128, 128, 0.15);
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 4px;
  font-size: ${(p) => (p.$size === "small" ? "10px" : "12px")};
  color: #888;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: rgba(128, 128, 128, 0.25);
    border-color: rgba(128, 128, 128, 0.4);
    color: #aaa;
  }
`;

const BadgeLabel = styled.span`
  font-family: var(--font-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
`;
