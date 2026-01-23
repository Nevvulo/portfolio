import {
  Bell,
  ChevronRight,
  Image,
  Palette,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Terminal,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import styled, { css, keyframes } from "styled-components";

const NEVI_AVATAR =
  "https://cdn.discordapp.com/avatars/1448561530428985364/7245e8d45db3af9a800e48dbbd190f0b.png?size=128";

interface CommandPerk {
  command: string;
  description: string;
  options?: { name: string; required: boolean }[];
  freeTier?: string;
  superLegend?: string;
  superLegend2?: string;
  isExclusive?: boolean;
  highlight?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
}

const GLOBAL_PERKS = [
  {
    title: "Increased Daily Limits",
    description: "10x-20x more uses on premium commands",
    icon: Zap,
  },
  {
    title: "Exclusive Badges",
    description: "Super Legend I & II profile badges",
    icon: Star,
  },
  {
    title: "Credits Recognition",
    description: "Featured in /credits command",
    icon: Trophy,
  },
];

const COMMANDS: CommandPerk[] = [
  {
    command: "/read",
    description: "Scrape & convert any URL to readable markdown",
    options: [{ name: "url", required: true }],
    freeTier: "1/day",
    superLegend: "10/day",
    superLegend2: "20/day",
    highlight: true,
    icon: Image,
  },
  {
    command: "/search",
    description: "Search the web and get instant results",
    options: [{ name: "query", required: true }],
    freeTier: "1/day",
    superLegend: "10/day",
    superLegend2: "20/day",
    highlight: true,
    icon: Search,
  },
  {
    command: "/profile",
    description: "View profiles with animated backgrounds & supporter badges",
    options: [{ name: "user", required: false }],
    superLegend: "Animated backgrounds",
    superLegend2: "Premium animations",
    icon: User,
  },
  {
    command: "/badges",
    description: "Exclusive supporter badges displayed on your profile",
    superLegend: "Super Legend badge",
    superLegend2: "Super Legend II badge",
    icon: Sparkles,
  },
  {
    command: "/shop",
    description: "Access exclusive items & create unlimited custom server items",
    freeTier: "Basic items only",
    superLegend: "Exclusive items + 50 custom",
    superLegend2: "All items + unlimited custom",
    icon: ShoppingBag,
  },
  {
    command: "/customcmd",
    description: "Create custom commands with economy variable access",
    freeTier: "10 commands",
    superLegend: "50 commands + economy vars",
    superLegend2: "Unlimited + all variables",
    icon: Terminal,
  },
  {
    command: "/twitch",
    description: "Twitch stream notifications for your server",
    freeTier: "3 subscriptions",
    superLegend: "10 subscriptions",
    superLegend2: "25 subscriptions",
    icon: Bell,
  },
  {
    command: "/youtube",
    description: "YouTube channel notifications for your server",
    freeTier: "3 subscriptions",
    superLegend: "10 subscriptions",
    superLegend2: "25 subscriptions",
    icon: Bell,
  },
  {
    command: "/credits",
    description: "See all supporters - including you!",
    superLegend: "Listed in Tier I section",
    superLegend2: "Listed in Tier II section",
    icon: Trophy,
  },
  {
    command: "/link",
    description: "Link your nev.so account to unlock all perks",
    isExclusive: true,
    icon: Zap,
  },
];

export function DiscordCommandShowcase() {
  return (
    <ShowcaseContainer>
      <SectionHeader>
        <BotAvatar src={NEVI_AVATAR} alt="Nevi Bot" />
        <HeaderContent>
          <BotName>
            @Nevi <BotTag>BOT</BotTag>
          </BotName>
          <BotDescription>Exclusive Super Legend command perks</BotDescription>
        </HeaderContent>
      </SectionHeader>

      {/* Global Perks Banner */}
      <GlobalPerksBar>
        {GLOBAL_PERKS.map((perk) => {
          const IconComponent = perk.icon;
          return (
            <GlobalPerk key={perk.title}>
              <PerkIconWrapper>
                <IconComponent size={18} />
              </PerkIconWrapper>
              <PerkInfo>
                <PerkTitle>{perk.title}</PerkTitle>
                <PerkDesc>{perk.description}</PerkDesc>
              </PerkInfo>
            </GlobalPerk>
          );
        })}
      </GlobalPerksBar>

      {/* Decorations Banner */}
      <DecorationsBanner>
        <Palette size={16} />
        <span>Custom decorations & badges displayed throughout the bot</span>
      </DecorationsBanner>

      {/* Super Legend Exclusive Commands */}
      <CommandSection>
        <CommandSectionTitle>
          <Star size={14} />
          Super Legend Command Perks
        </CommandSectionTitle>
        <CommandList>
          {COMMANDS.map((cmd) => {
            const IconComponent = cmd.icon;
            return (
              <CommandItem key={cmd.command} $highlight={cmd.highlight}>
                <CommandLeft>
                  <CommandAvatar src={NEVI_AVATAR} alt="" />
                  <CommandInfo>
                    <CommandName>
                      {cmd.command}
                      {cmd.options?.map((opt) => (
                        <CommandOption key={opt.name} $required={opt.required}>
                          {opt.name}
                        </CommandOption>
                      ))}
                      {cmd.isExclusive && <ExclusiveTag>REQUIRED</ExclusiveTag>}
                    </CommandName>
                    <CommandDesc>{cmd.description}</CommandDesc>
                    {(cmd.freeTier || cmd.superLegend || cmd.superLegend2) && (
                      <TierComparison>
                        {cmd.freeTier && (
                          <TierBadge $tier="free">
                            <TierLabel>Free</TierLabel>
                            <TierValue>{cmd.freeTier}</TierValue>
                          </TierBadge>
                        )}
                        {cmd.superLegend && (
                          <TierBadge $tier="tier1">
                            <TierLabel>
                              <Star size={10} /> I
                            </TierLabel>
                            <TierValue>{cmd.superLegend}</TierValue>
                          </TierBadge>
                        )}
                        {cmd.superLegend2 && (
                          <TierBadge $tier="tier2">
                            <TierLabel>
                              <Star size={10} /> II
                            </TierLabel>
                            <TierValue>{cmd.superLegend2}</TierValue>
                          </TierBadge>
                        )}
                      </TierComparison>
                    )}
                  </CommandInfo>
                </CommandLeft>
                {IconComponent && (
                  <CommandIconWrapper>
                    <IconComponent size={16} />
                  </CommandIconWrapper>
                )}
              </CommandItem>
            );
          })}
        </CommandList>
      </CommandSection>

      {/* CTA */}
      <InviteCTA
        href="https://discord.com/oauth2/authorize?client_id=1448561530428985364"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>Add @Nevi to your server</span>
        <ChevronRight size={18} />
      </InviteCTA>
    </ShowcaseContainer>
  );
}

const ShowcaseContainer = styled.div`
  background: #2b2d31;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #3f4147;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #5865f2 0%, #7289da 100%);
`;

const BotAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.2);
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const BotName = styled.div`
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BotTag = styled.span`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  background: #5865f2;
  border-radius: 4px;
  color: white;
`;

const BotDescription = styled.div`
  font-family: var(--font-sans);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
`;

const GlobalPerksBar = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #3f4147;
  border-bottom: 1px solid #3f4147;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const GlobalPerk = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #313338;
`;

const PerkIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(247, 190, 92, 0.15);
  color: #f7be5c;
  flex-shrink: 0;
`;

const PerkInfo = styled.div``;

const PerkTitle = styled.div`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 12px;
  color: #f2f3f5;
`;

const PerkDesc = styled.div`
  font-family: var(--font-sans);
  font-size: 11px;
  color: #b5bac1;
`;

const DecorationsBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(90deg, rgba(247, 190, 92, 0.1) 0%, rgba(230, 126, 34, 0.1) 100%);
  border-bottom: 1px solid #3f4147;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: #f7be5c;
`;

const CommandSection = styled.div`
  padding: 16px 20px;
`;

const CommandSectionTitle = styled.h3`
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b5bac1;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CommandList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const pulseHighlight = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(88, 101, 242, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(88, 101, 242, 0);
  }
`;

const CommandItem = styled.div<{ $highlight?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  background: ${(props) => (props.$highlight ? "rgba(88, 101, 242, 0.15)" : "#313338")};
  border-radius: 8px;
  border: 1px solid ${(props) => (props.$highlight ? "rgba(88, 101, 242, 0.3)" : "transparent")};
  transition: all 0.2s ease;
  ${(props) =>
    props.$highlight &&
    css`
      animation: ${pulseHighlight} 3s ease-in-out infinite;
    `}

  &:hover {
    background: ${(props) => (props.$highlight ? "rgba(88, 101, 242, 0.2)" : "#383a40")};
  }
`;

const CommandLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
`;

const CommandAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const CommandInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CommandName = styled.div`
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 14px;
  color: #f2f3f5;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
`;

const CommandOption = styled.span<{ $required: boolean }>`
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${(props) => (props.$required ? "#5865f2" : "#4e5058")};
  color: ${(props) => (props.$required ? "white" : "#b5bac1")};
`;

const ExclusiveTag = styled.span`
  font-family: var(--font-sans);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: linear-gradient(135deg, #f7be5c, #e67e22);
  color: #1a1a1a;
`;

const CommandDesc = styled.div`
  font-family: var(--font-sans);
  font-size: 12px;
  color: #b5bac1;
  margin-top: 4px;
`;

const TierComparison = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const TierBadge = styled.div<{ $tier: "free" | "tier1" | "tier2" }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: ${(props) =>
    props.$tier === "free"
      ? "#4e5058"
      : props.$tier === "tier1"
        ? "rgba(247, 190, 92, 0.15)"
        : "rgba(230, 126, 34, 0.2)"};
  border: 1px solid
    ${(props) =>
      props.$tier === "free"
        ? "#5c5f66"
        : props.$tier === "tier1"
          ? "rgba(247, 190, 92, 0.3)"
          : "rgba(230, 126, 34, 0.4)"};
`;

const TierLabel = styled.span`
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 600;
  color: #b5bac1;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const TierValue = styled.span`
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: #f2f3f5;
`;

const CommandIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #80848e;
  flex-shrink: 0;
`;

const InviteCTA = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #5865f2, #7289da);
  color: white;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);
  }
`;
