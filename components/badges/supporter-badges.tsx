import styled from "styled-components";
import { SupporterBadge } from "./supporter-badge";
import { BadgeType } from "../../constants/badges";
import { useSupporterStatus } from "../../hooks/useSupporterStatus";

interface SupporterBadgesProps {
	direction?: "row" | "column";
	showLabels?: boolean;
	size?: "small" | "medium";
}

export function SupporterBadges({
	direction = "row",
	showLabels = false,
	size = "small",
}: SupporterBadgesProps) {
	const { status, isLoading } = useSupporterStatus();

	if (isLoading || !status) return null;

	const badges: BadgeType[] = [];

	// Add Twitch sub badges
	if (status.twitchSubTier === 1) badges.push(BadgeType.TWITCH_SUB_T1);
	if (status.twitchSubTier === 2) badges.push(BadgeType.TWITCH_SUB_T2);
	if (status.twitchSubTier === 3) badges.push(BadgeType.TWITCH_SUB_T3);

	// Add Discord booster badge
	if (status.discordBooster) badges.push(BadgeType.DISCORD_BOOSTER);

	// Add Clerk subscription badges
	if (status.clerkPlan === "super_legend" && status.clerkPlanStatus === "active") {
		badges.push(BadgeType.SUPER_LEGEND);
	}
	if (status.clerkPlan === "super_legend_2" && status.clerkPlanStatus === "active") {
		badges.push(BadgeType.SUPER_LEGEND_2);
	}

	if (badges.length === 0) return null;

	return (
		<BadgeContainer $direction={direction}>
			{badges.map((type) => (
				<SupporterBadge
					key={type}
					type={type}
					showLabel={showLabels}
					size={size}
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
