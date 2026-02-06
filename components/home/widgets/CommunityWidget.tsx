import { useQuery as useRQ } from "@tanstack/react-query";
import { Pencil, Plus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import loungeIcon from "../../../assets/img/lounge.png";
import personalAtIcon from "../../../assets/img/personal-at.png";
import { getMe } from "@/src/db/client/me";
import { LOUNGE_COLORS } from "../../../constants/theme";
import type { DiscordWidget } from "../../../types/discord";
import { WidgetContainer } from "./WidgetContainer";

// Discord icon as inline SVG
function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

interface CommunityWidgetProps {
  discordWidget?: DiscordWidget | null;
}

export function CommunityWidget({ discordWidget }: CommunityWidgetProps) {
  const onlineCount = discordWidget?.presence_count ?? 0;
  const { data: user } = useRQ({
    queryKey: ["me"],
    queryFn: () => getMe(),
    staleTime: 30_000,
  });
  const username = user?.username;
  const profileHandle = username ? `@${username}` : "@you";

  return (
    <WidgetContainer title="Community" icon={<Users size={16} />}>
      <TopRow>
        <CommunityCard
          href="https://discord.nev.so"
          target="_blank"
          rel="noopener noreferrer"
          $color="#5865f2"
        >
          <CardIcon $color="#5865f2">
            <DiscordIcon size={18} />
          </CardIcon>
          <CardContent>
            <CardTitle>Discord</CardTitle>
            <CardMeta>
              {onlineCount > 0 ? (
                <>
                  <OnlineDot />
                  <span>{onlineCount.toLocaleString()} online</span>
                </>
              ) : (
                <span>Join the community</span>
              )}
            </CardMeta>
          </CardContent>
        </CommunityCard>

        <CommunityCard href="https://lounge.nev.so" target="_blank" rel="noopener noreferrer" $color={LOUNGE_COLORS.tier1}>
          <CardIcon $color={LOUNGE_COLORS.tier1}>
            <Image src={loungeIcon} alt="Lounge" width={18} height={18} />
          </CardIcon>
          <CardContent>
            <CardTitle>Lounge</CardTitle>
            <CardMeta>
              <span>lounge.nev.so</span>
            </CardMeta>
          </CardContent>
        </CommunityCard>
      </TopRow>

      <CommunityCard
        href={username ? `/u/${username}` : "/account"}
        $color="#22c55e"
      >
        <CardIcon $color="#22c55e">
          <Image src={personalAtIcon} alt="Personal page" width={18} height={18} />
        </CardIcon>
        <CardContent>
          <CardTitle>
            <ProfileUrl>nev.so/{profileHandle}</ProfileUrl>
          </CardTitle>
          <CardMeta>
            <span>Personal page to show your work & socials</span>
          </CardMeta>
        </CardContent>
        <ProfileCta
          href={username ? `/u/${username}/edit` : "/account"}
          onClick={(e) => e.stopPropagation()}
        >
          {username ? <Pencil size={14} /> : <Plus size={14} />}
        </ProfileCta>
      </CommunityCard>

      {discordWidget?.members && discordWidget.members.length > 0 && (
        <OnlineMembersSection>
          <OnlineHeader>
            <OnlineDot />
            <span>Online now</span>
          </OnlineHeader>
          <AvatarStack>
            {discordWidget.members.slice(0, 8).map((member) => (
              <AvatarItem
                key={member.id}
                $url={member.avatar_url}
                title={member.username}
              />
            ))}
            {discordWidget.members.length > 8 && (
              <MoreBadge>+{discordWidget.members.length - 8}</MoreBadge>
            )}
          </AvatarStack>
        </OnlineMembersSection>
      )}
    </WidgetContainer>
  );
}

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CommunityCard = styled(Link)<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: ${(props) => `${props.$color}40`};
  }
`;

const CardIcon = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => `${props.$color}15`};
  border-radius: 8px;
  color: ${(props) => props.$color};
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTitle = styled.span`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const CardMeta = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const ProfileCta = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: ${LOUNGE_COLORS.tier1};
  text-decoration: none;
  margin-left: auto;
  flex-shrink: 0;
  border-radius: 6px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const ProfileUrl = styled.span`
  font-family: var(--font-mono);
  font-size: 13px;
`;

const OnlineDot = styled.div`
  width: 6px;
  height: 6px;
  background: ${LOUNGE_COLORS.online};
  border-radius: 50%;
`;

const OnlineMembersSection = styled.div`
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const OnlineHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  margin-bottom: 10px;
`;

const AvatarStack = styled.div`
  display: flex;
  align-items: center;
`;

const AvatarItem = styled.div<{ $url: string }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: url(${(props) => props.$url}) center/cover;
  border: 2px solid ${(props) => props.theme.postBackground};
  margin-left: -8px;

  &:first-child {
    margin-left: 0;
  }

  &:hover {
    transform: scale(1.1);
    z-index: 1;
  }
`;

const MoreBadge = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid ${(props) => props.theme.postBackground};
  margin-left: -8px;
  font-size: 10px;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
`;
