import styled from "styled-components";
import { SupporterBadge } from "./supporter-badge";
import { BadgeType } from "../../constants/badges";
import { useSupporterStatus } from "../../hooks/useSupporterStatus";
import type { DiscordRole } from "../../types/supporter";

interface SupporterStatusData {
	discordHighestRole?: DiscordRole | null;
	twitchSubTier?: 1 | 2 | 3 | null;
	discordBooster?: boolean | null;
	clerkPlan?: string | null;
	clerkPlanStatus?: string | null;
}

interface SupporterBadgesProps {
	direction?: "row" | "column";
	showLabels?: boolean;
	expandOnHover?: boolean;
	size?: "small" | "medium";
	/** Pass supporter data directly instead of using hook (for viewing other users) */
	supporterData?: SupporterStatusData | null;
}

// Convert Discord's integer color to hex string
function discordColorToHex(color: number): string {
	if (color === 0) return "#99AAB5"; // Default Discord gray for no color
	return `#${color.toString(16).padStart(6, "0")}`;
}

interface BadgeConfig {
	type: BadgeType;
	customColor?: string;
	customLabel?: string;
}

export function SupporterBadges({
	direction = "row",
	showLabels = false,
	expandOnHover = false,
	size = "small",
	supporterData,
}: SupporterBadgesProps) {
	// Use hook for current user's data if no supporterData prop provided
	const { status: hookStatus, isLoading } = useSupporterStatus();

	// Use passed data if provided, otherwise fall back to hook data
	const status = supporterData !== undefined ? supporterData : hookStatus;

	// Only show loading state when using hook (not when data is passed)
	if (supporterData === undefined && isLoading) return null;
	if (!status) return null;

	const badges: BadgeConfig[] = [];

	// Add Discord highest role badge (shown first as it's the primary identifier)
	if (status.discordHighestRole) {
		badges.push({
			type: BadgeType.DISCORD_ROLE,
			customColor: discordColorToHex(status.discordHighestRole.color),
			customLabel: status.discordHighestRole.name,
		});
	}

	// Add Twitch sub badges
	if (status.twitchSubTier === 1) badges.push({ type: BadgeType.TWITCH_SUB_T1 });
	if (status.twitchSubTier === 2) badges.push({ type: BadgeType.TWITCH_SUB_T2 });
	if (status.twitchSubTier === 3) badges.push({ type: BadgeType.TWITCH_SUB_T3 });

	// Add Discord booster badge
	if (status.discordBooster) badges.push({ type: BadgeType.DISCORD_BOOSTER });

	// Add Clerk subscription badges
	if (status.clerkPlan === "super_legend" && status.clerkPlanStatus === "active") {
		badges.push({ type: BadgeType.SUPER_LEGEND });
	}
	if (status.clerkPlan === "super_legend_2" && status.clerkPlanStatus === "active") {
		badges.push({ type: BadgeType.SUPER_LEGEND_2 });
	}

	if (badges.length === 0) return null;

	return (
		<BadgeContainer $direction={direction}>
			{badges.map((badge, index) => (
				<SupporterBadge
					key={`${badge.type}-${index}`}
					type={badge.type}
					showLabel={showLabels}
					expandOnHover={expandOnHover}
					size={size}
					customColor={badge.customColor}
					customLabel={badge.customLabel}
				/>
			))}
		</BadgeContainer>
	);
}

const BadgeContainer = styled.div<{ $direction: string }>`
	display: flex;
	flex-direction: ${(p) => p.$direction};
	gap: 4px;
	align-items: center;
	flex-wrap: wrap;
`;

export { SupporterBadge } from "./supporter-badge";
