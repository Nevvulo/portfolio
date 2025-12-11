import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faTwitch,
	faDiscord,
} from "@fortawesome/free-brands-svg-icons";
import { faStar, faCrown } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";
import {
	BadgeType,
	BadgeNames,
	BadgeColors,
	BadgeDescriptions,
} from "../../constants/badges";

interface SupporterBadgeProps {
	type: BadgeType;
	size?: "small" | "medium";
	showLabel?: boolean;
	expandOnHover?: boolean;
	customColor?: string;
	customLabel?: string;
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
		case BadgeType.SUPER_LEGEND:
			return faStar;
		case BadgeType.SUPER_LEGEND_2:
			return faCrown;
		default:
			return faStar;
	}
}

export function SupporterBadge({
	type,
	size = "small",
	showLabel = false,
	expandOnHover = false,
	customColor,
	customLabel,
}: SupporterBadgeProps) {
	const color = customColor || BadgeColors[type];
	const icon = getBadgeIcon(type);
	const label = customLabel || BadgeNames[type];

	return (
		<BadgeContainer
			$color={color}
			$size={size}
			$expandOnHover={expandOnHover}
			title={!expandOnHover ? (customLabel || BadgeDescriptions[type]) : undefined}
		>
			<FontAwesomeIcon
				icon={icon}
				style={{ width: size === "small" ? 12 : 14, flexShrink: 0 }}
			/>
			{(showLabel || expandOnHover) && (
				<BadgeLabel $expandOnHover={expandOnHover}>{label}</BadgeLabel>
			)}
		</BadgeContainer>
	);
}

const BadgeContainer = styled.div<{ $color: string; $size: string; $expandOnHover: boolean }>`
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
`;

const BadgeLabel = styled.span<{ $expandOnHover: boolean }>`
	font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	white-space: nowrap;

	${(p) => p.$expandOnHover && `
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
