import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useQuery } from "convex/react";
import { Calendar, ExternalLink, ArrowLeft } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { LOUNGE_COLORS, TIER_INFO } from "../../constants/lounge";
import { SupporterBadges } from "../../components/badges/supporter-badges";
import type { Tier } from "../../types/lounge";

export const getServerSideProps = () => ({ props: {} });

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;

  const user = useQuery(
    api.users.getByUsername,
    typeof username === "string" ? { username } : "skip"
  );

  if (!username || typeof username !== "string") {
    return null;
  }

  // Loading state
  if (user === undefined) {
    return (
      <Container>
        <LoadingText>Loading profile...</LoadingText>
      </Container>
    );
  }

  // User not found
  if (user === null) {
    return (
      <>
        <Head>
          <title>User not found | nevulo</title>
        </Head>
        <Container>
          <NotFoundCard>
            <NotFoundTitle>User not found</NotFoundTitle>
            <NotFoundText>
              The user @{username} doesn't exist or hasn't set up their profile yet.
            </NotFoundText>
            <BackLink href="/">
              <ArrowLeft size={16} />
              Go home
            </BackLink>
          </NotFoundCard>
        </Container>
      </>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const tierColor = TIER_INFO[user.tier as Tier]?.color || "#9CA3AF";
  const tierName = TIER_INFO[user.tier as Tier]?.name || "Member";

  // Get Discord role color if free tier user has one
  const nameColor =
    user.tier === "free" && user.discordHighestRole?.color
      ? `#${user.discordHighestRole.color.toString(16).padStart(6, "0")}`
      : tierColor;

  return (
    <>
      <Head>
        <title>{user.displayName} (@{user.username}) | nevulo</title>
        <meta
          name="description"
          content={user.bio || `${user.displayName}'s profile on nevulo`}
        />
        <meta property="og:title" content={`${user.displayName} | nevulo`} />
        <meta property="og:description" content={user.bio || `${user.displayName}'s profile`} />
        {user.avatarUrl && <meta property="og:image" content={user.avatarUrl} />}
      </Head>

      <Container>
        <ProfileCard>
          {/* Banner */}
          <Banner $url={user.bannerUrl} $focalY={user.bannerFocalY ?? 50}>
            {!user.bannerUrl && <BannerGradient $tier={user.tier as Tier} />}
          </Banner>

          {/* Avatar */}
          <AvatarSection>
            <Avatar src={user.avatarUrl} alt={user.displayName} />
          </AvatarSection>

          {/* Profile Info */}
          <ProfileInfo>
            <NameRow>
              <DisplayName $color={nameColor}>{user.displayName}</DisplayName>
              {user.isCreator && <StaffBadge>staff</StaffBadge>}
            </NameRow>
            <Username>@{user.username}</Username>

            <TierBadge $tier={user.tier as Tier}>
              {tierName}
            </TierBadge>

            <BadgesRow>
              <SupporterBadges
                size="medium"
                supporterData={{
                  discordHighestRole: user.discordHighestRole,
                  discordBooster: user.discordBooster,
                }}
              />
            </BadgesRow>

            {user.bio && <Bio>{user.bio}</Bio>}

            <MetaRow>
              <MetaItem>
                <Calendar size={14} />
                <span>Member since {memberSince}</span>
              </MetaItem>
            </MetaRow>

            {/* Action Buttons */}
            <Actions>
              <ActionLink href="/lounge">
                Visit Lounge
                <ExternalLink size={14} />
              </ActionLink>
            </Actions>
          </ProfileInfo>
        </ProfileCard>

        {/* Footer */}
        <Footer>
          <FooterLink href="/">nevulo</FooterLink>
        </Footer>
      </Container>
    </>
  );
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #0f0a1f 0%, #1a0f2e 50%, #0d0a1a 100%);
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.5);
`;

const NotFoundCard = styled.div`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  max-width: 400px;
`;

const NotFoundTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem;
`;

const NotFoundText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1.5rem;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${LOUNGE_COLORS.tier1};
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const ProfileCard = styled.div`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  max-width: 400px;
  position: relative;
`;

const Banner = styled.div<{ $url?: string; $focalY: number }>`
  height: 120px;
  background: ${(props) =>
    props.$url
      ? `url(${props.$url}) center ${props.$focalY}% / cover no-repeat`
      : "transparent"};
  position: relative;
`;

const BannerGradient = styled.div<{ $tier: Tier }>`
  position: absolute;
  inset: 0;
  background: ${(props) =>
    props.$tier === "tier2"
      ? `linear-gradient(135deg, ${LOUNGE_COLORS.tier2}44 0%, ${LOUNGE_COLORS.tier1}44 100%)`
      : props.$tier === "tier1"
        ? `linear-gradient(135deg, ${LOUNGE_COLORS.tier1}44 0%, rgba(144, 116, 242, 0.2) 100%)`
        : `linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(55, 65, 81, 0.3) 100%)`};
`;

const AvatarSection = styled.div`
  position: relative;
  padding: 0 1.5rem;
  margin-top: -40px;
`;

const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid ${LOUNGE_COLORS.glassBackground};
  background: ${LOUNGE_COLORS.glassBorder};
  object-fit: cover;
`;

const ProfileInfo = styled.div`
  padding: 1rem 1.5rem 1.5rem;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const DisplayName = styled.h1<{ $color: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.$color};
  margin: 0;
`;

const StaffBadge = styled.span`
  margin-left: auto;
  padding: 2px 8px;
  font-size: 0.6rem;
  font-family: "Sixtyfour", monospace;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Username = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0.25rem 0 0.75rem;
`;

const TierBadge = styled.span<{ $tier: Tier }>`
  display: inline-block;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(props) => TIER_INFO[props.$tier]?.color || "#9CA3AF"};
  background: ${(props) =>
    props.$tier === "tier2"
      ? LOUNGE_COLORS.tier2Background
      : props.$tier === "tier1"
        ? LOUNGE_COLORS.tier1Background
        : "rgba(107, 114, 128, 0.1)"};
  border-radius: 6px;
  margin-bottom: 0.75rem;
`;

const BadgesRow = styled.div`
  margin-bottom: 1rem;
`;

const Bio = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin: 0 0 1rem;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${LOUNGE_COLORS.tier1};
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(144, 116, 242, 0.3);
  }
`;

const Footer = styled.footer`
  margin-top: 2rem;
`;

const FooterLink = styled(Link)`
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  text-decoration: none;

  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;
