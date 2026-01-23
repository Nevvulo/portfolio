import { faDiscord, faTwitch } from "@fortawesome/free-brands-svg-icons";
import { faCrown, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import styled from "styled-components";
import SuperLegendIcon from "../../assets/img/super-legend.png";
import SuperLegend2Icon from "../../assets/img/super-legend-2.png";
import { BadgeColors, BadgeDescriptions, BadgeNames, BadgeType } from "../../constants/badges";

interface SupporterBadgeProps {
  type: BadgeType;
  size?: "small" | "medium";
  showLabel?: boolean;
  expandOnHover?: boolean;
  customColor?: string;
  customLabel?: string;
  /** Optional founder number (1-10) to display "Founder #X" */
  founderNumber?: number;
}

function getBadgeIcon(type: BadgeType) {
  switch (type) {
    case BadgeType.TWITCH_SUB_T1:
    case BadgeType.TWITCH_SUB_T2:
    case BadgeType.TWITCH_SUB_T3:
      return faTwitch;
    case BadgeType.DISCORD_BOOSTER:
    case BadgeType.DISCORD_ROLE:
      return faDiscord;
    case BadgeType.FOUNDER:
      return faCrown;
    default:
      return faStar;
  }
}

function isSuperLegendType(type: BadgeType): boolean {
  return type === BadgeType.SUPER_LEGEND || type === BadgeType.SUPER_LEGEND_2;
}

function getSuperLegendImage(type: BadgeType) {
  return type === BadgeType.SUPER_LEGEND_2 ? SuperLegend2Icon : SuperLegendIcon;
}

export function SupporterBadge({
  type,
  size = "small",
  showLabel = false,
  expandOnHover = false,
  customColor,
  customLabel,
  founderNumber,
}: SupporterBadgeProps) {
  const color = customColor || BadgeColors[type];
  const icon = getBadgeIcon(type);
  const isFounder = type === BadgeType.FOUNDER;
  const isSuperLegend = isSuperLegendType(type);
  const iconSize = size === "small" ? 14 : 18;

  // For founder badge, show "Founder #X" if founderNumber is provided
  const label =
    customLabel || (isFounder && founderNumber ? `Founder #${founderNumber}` : BadgeNames[type]);
  const description =
    isFounder && founderNumber
      ? `Founder #${founderNumber} - One of the first 10 supporters`
      : customLabel || BadgeDescriptions[type];

  return (
    <BadgeContainer
      $color={color}
      $size={size}
      $expandOnHover={expandOnHover}
      $isFounder={isFounder}
      title={!expandOnHover ? description : undefined}
    >
      {isSuperLegend ? (
        <Image
          src={getSuperLegendImage(type)}
          alt={BadgeNames[type]}
          width={iconSize}
          height={iconSize}
          style={{ flexShrink: 0 }}
        />
      ) : (
        <FontAwesomeIcon icon={icon} style={{ width: size === "small" ? 12 : 14, flexShrink: 0 }} />
      )}
      {(showLabel || expandOnHover) && (
        <BadgeLabel $expandOnHover={expandOnHover}>{label}</BadgeLabel>
      )}
    </BadgeContainer>
  );
}

const BadgeContainer = styled.div<{
  $color: string;
  $size: string;
  $expandOnHover: boolean;
  $isFounder?: boolean;
}>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: ${(p) => (p.$size === "small" ? "2px 6px" : "4px 10px")};
	background: ${(p) => p.$color}22;
	border: 1px solid ${(p) => p.$color}44;
	border-radius: 4px;
	font-size: ${(p) => (p.$size === "small" ? "10px" : "12px")};
	color: ${(p) => p.$color};
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: ${(p) => (p.$expandOnHover ? "pointer" : "default")};
	overflow: hidden;

	&:hover {
		background: ${(p) => p.$color}33;
		border-color: ${(p) => p.$color}66;
	}

	/* Founder badge glow effect */
	${(p) =>
    p.$isFounder &&
    `
		box-shadow: 0 0 8px ${p.$color}55, 0 0 16px ${p.$color}33;
		animation: founderGlow 2s ease-in-out infinite alternate;

		@keyframes founderGlow {
			from {
				box-shadow: 0 0 8px ${p.$color}55, 0 0 16px ${p.$color}33;
			}
			to {
				box-shadow: 0 0 12px ${p.$color}77, 0 0 24px ${p.$color}44;
			}
		}
	`}
`;

const BadgeLabel = styled.span<{ $expandOnHover: boolean }>`
	font-family: var(--font-mono);
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	white-space: nowrap;

	${(p) =>
    p.$expandOnHover &&
    `
		max-width: 0;
		opacity: 0;
		transition: max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
		            opacity 0.2s ease,
		            margin-left 0.3s ease;
		margin-left: -4px;

		${BadgeContainer}:hover & {
			max-width: 200px;
			opacity: 1;
			margin-left: 0;
		}
	`}
`;
