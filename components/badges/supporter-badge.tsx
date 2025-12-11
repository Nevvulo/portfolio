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
}

function getBadgeIcon(type: BadgeType) {
	switch (type) {
		case BadgeType.TWITCH_SUB_T1:
		case BadgeType.TWITCH_SUB_T2:
		case BadgeType.TWITCH_SUB_T3:
			return faTwitch;
		case BadgeType.DISCORD_BOOSTER:
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
}: SupporterBadgeProps) {
	const color = BadgeColors[type];
	const icon = getBadgeIcon(type);

	return (
		<BadgeContainer
			$color={color}
			$size={size}
			title={BadgeDescriptions[type]}
		>
			<FontAwesomeIcon
				icon={icon}
				style={{ width: size === "small" ? 12 : 14 }}
			/>
			{showLabel && <BadgeLabel>{BadgeNames[type]}</BadgeLabel>}
		</BadgeContainer>
	);
}

const BadgeContainer = styled.div<{ $color: string; $size: string }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: ${(p) => (p.$size === "small" ? "2px 6px" : "4px 10px")};
	background: ${(p) => p.$color}22;
	border: 1px solid ${(p) => p.$color}44;
	border-radius: 4px;
	font-size: ${(p) => (p.$size === "small" ? "10px" : "12px")};
	color: ${(p) => p.$color};
	transition: all 0.2s ease;

	&:hover {
		background: ${(p) => p.$color}33;
		border-color: ${(p) => p.$color}66;
	}
`;

const BadgeLabel = styled.span`
	font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;
