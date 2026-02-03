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
      $isSuperLegend={isSuperLegend}
      title={!expandOnHover ? description : undefined}
    >
      {type === BadgeType.SUPER_LEGEND_2 ? (
        <Image
          src={SuperLegend2Icon}
          alt={BadgeNames[type]}
          width={iconSize}
          height={iconSize}
          style={{ flexShrink: 0, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}
        />
      ) : type === BadgeType.SUPER_LEGEND ? (
        !showLabel ? (
          <Image
            src={SuperLegendIcon}
            alt={BadgeNames[type]}
            width={iconSize}
            height={iconSize}
            style={{ flexShrink: 0, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}
          />
        ) : null
      ) : (
        <FontAwesomeIcon icon={icon} style={{ width: size === "small" ? 12 : 14, flexShrink: 0 }} />
      )}
      {(showLabel || expandOnHover) && (
        <BadgeLabel $expandOnHover={expandOnHover} $isSuperLegend={isSuperLegend}>{label}</BadgeLabel>
      )}
    </BadgeContainer>
  );
}

const BadgeContainer = styled.div<{
  $color: string;
  $size: string;
  $expandOnHover: boolean;
  $isFounder?: boolean;
  $isSuperLegend?: boolean;
}>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: ${(p) => (p.$size === "small" ? "2px 6px" : "4px 10px")};
	background: ${(p) => p.$isSuperLegend ? "linear-gradient(135deg, #f7be5c, #e6a030, #d4912a)" : `${p.$color}22`};
	border: 1px solid ${(p) => p.$isSuperLegend ? "#d4912a" : `${p.$color}44`};
	border-radius: 4px;
	font-size: ${(p) => (p.$size === "small" ? "10px" : "12px")};
	color: ${(p) => p.$isSuperLegend ? "#2a2a2a" : p.$color};
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: ${(p) => (p.$expandOnHover ? "pointer" : "default")};
	overflow: hidden;

	&:hover {
		background: ${(p) => p.$isSuperLegend ? "linear-gradient(135deg, #fcc96e, #e6a030, #c4811a)" : `${p.$color}33`};
		border-color: ${(p) => p.$isSuperLegend ? "#c4811a" : `${p.$color}66`};
	}

	/* Founder badge shimmer effect */
	${(p) =>
    p.$isFounder &&
    `
		position: relative;

		&::after {
			content: "";
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			height: 100%;
			background: linear-gradient(
				90deg,
				transparent 0%,
				${p.$color}22 30%,
				${p.$color}55 50%,
				${p.$color}22 70%,
				transparent 100%
			);
			animation: founderShimmer 2.5s ease-in-out infinite;
			pointer-events: none;
			border-radius: inherit;
		}

		@keyframes founderShimmer {
			0% { left: -100%; }
			100% { left: 100%; }
		}
	`}
`;

const BadgeLabel = styled.span<{ $expandOnHover: boolean; $isSuperLegend?: boolean }>`
	font-family: "Inter", var(--font-sans), sans-serif;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
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
