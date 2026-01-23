import { useQuery } from "convex/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { BackButton } from "../../components/generics";
import { AnimatedMinimalView } from "../../components/layout/minimal";
import { api } from "../../convex/_generated/api";

type CreditUser = {
  _id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  tier: string;
  twitchSubTier?: 1 | 2 | 3 | null;
  discordBooster?: boolean | null;
  clerkPlan?: string | null;
  clerkPlanStatus?: string | null;
  isCreator?: boolean;
  role?: number;
  isContributor?: boolean;
};

function UserCard({ user, badge }: { user: CreditUser; badge?: string }) {
  const profileUrl = user.username ? `/@${user.username}` : null;

  const content = (
    <UserCardInner $clickable={!!profileUrl}>
      <UserAvatar>
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.displayName}
            width={48}
            height={48}
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <AvatarPlaceholder>{user.displayName.charAt(0).toUpperCase()}</AvatarPlaceholder>
        )}
      </UserAvatar>
      <UserInfo>
        <UserName>{user.displayName}</UserName>
        {user.username && <Username>@{user.username}</Username>}
      </UserInfo>
      {badge && <UserBadge $type={badge}>{badge}</UserBadge>}
    </UserCardInner>
  );

  if (profileUrl) {
    return <UserCardLink href={profileUrl}>{content}</UserCardLink>;
  }

  return <UserCardWrapper>{content}</UserCardWrapper>;
}

type PaginatedSection = {
  items: CreditUser[];
  hasMore: boolean;
  total: number;
};

function CreditsSection({
  title,
  section,
  badge,
  icon,
}: {
  title: string;
  section: PaginatedSection;
  badge?: string;
  icon?: string;
}) {
  if (section.items.length === 0) return null;

  return (
    <Section>
      <SectionHeader>
        {icon && <SectionIcon>{icon}</SectionIcon>}
        <SectionTitle>{title}</SectionTitle>
        <UserCount>{section.total}</UserCount>
      </SectionHeader>
      <UsersGrid>
        {section.items.map((user) => (
          <UserCard key={user._id} user={user} badge={badge} />
        ))}
      </UsersGrid>
      {section.hasMore && (
        <ShowMoreNote>+ {section.total - section.items.length} more supporters</ShowMoreNote>
      )}
    </Section>
  );
}

export default function CreditsPage() {
  const credits = useQuery(api.users.getCreditsPage, {});

  const isLoading = credits === undefined;

  const totalSupporters =
    credits &&
    credits.staff.total +
      credits.superLegendII.total +
      credits.superLegendI.total +
      credits.twitch.tier3.total +
      credits.twitch.tier2.total +
      credits.twitch.tier1.total +
      credits.discordBoosters.total +
      credits.contributors.total;

  return (
    <CreditsView>
      <BackButtonWrapper>
        <BackButton href="/" />
      </BackButtonWrapper>

      <ContentContainer>
        <HeroSection>
          <HeroTitle>credits</HeroTitle>
          <HeroSubtitle>
            special shoutout to all amazing supporters who make this possible :)
          </HeroSubtitle>
          {isLoading ? (
            <SkeletonSupporterCount />
          ) : totalSupporters !== undefined && totalSupporters > 0 ? (
            <SupporterCount>{totalSupporters} supporters and counting</SupporterCount>
          ) : null}
        </HeroSection>

        {isLoading ? (
          <SectionsContainer>
            <SkeletonSection />
            <SkeletonSection />
            <SkeletonSection cardCount={4} />
          </SectionsContainer>
        ) : (
          <SectionsContainer>
            <CreditsSection title="Staff" section={credits.staff} badge="Staff" icon="🛡️" />

            <CreditsSection
              title="Super Legend II"
              section={credits.superLegendII}
              badge="SL II"
              icon="👑"
            />

            <CreditsSection
              title="Super Legend I"
              section={credits.superLegendI}
              badge="SL I"
              icon="⭐"
            />

            <CreditsSection
              title="Twitch Tier 3"
              section={credits.twitch.tier3}
              badge="T3"
              icon="💜"
            />

            <CreditsSection
              title="Twitch Tier 2"
              section={credits.twitch.tier2}
              badge="T2"
              icon="💜"
            />

            <CreditsSection
              title="Twitch Tier 1"
              section={credits.twitch.tier1}
              badge="T1"
              icon="💜"
            />

            <CreditsSection
              title="Discord Boosters"
              section={credits.discordBoosters}
              badge="Booster"
              icon="🚀"
            />

            <CreditsSection
              title="Contributors"
              section={credits.contributors}
              badge="Contributor"
              icon="💻"
            />

            {totalSupporters === 0 && (
              <EmptyState>
                <EmptyIcon>💫</EmptyIcon>
                <EmptyTitle>Be the first!</EmptyTitle>
                <EmptyDescription>
                  No supporters have opted into the credits page yet.
                  <br />
                  <Link href="/support">Become a supporter</Link> and enable &quot;Show on
                  credits&quot; in your account settings!
                </EmptyDescription>
              </EmptyState>
            )}
          </SectionsContainer>
        )}

        <FooterNote>
          Want to appear here? <Link href="/support">Become a supporter</Link> and enable &quot;Show
          on credits&quot; in your <Link href="/account">account settings</Link>.
        </FooterNote>
      </ContentContainer>

      <Head>
        <title>Credits - Nevulo</title>
        <meta
          name="description"
          content="Thank you to all the amazing supporters who make this possible!"
        />
        <meta property="og:title" content="Credits - Nevulo" />
        <meta property="og:description" content="Thank you to all the amazing supporters!" />
        <meta property="og:url" content="https://nev.so/credits" />
      </Head>
    </CreditsView>
  );
}

const CreditsView = styled(AnimatedMinimalView)`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 4rem;
`;

const BackButtonWrapper = styled.div`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 10;
`;

const ContentContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  width: 100%;

  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding-top: 2rem;
`;

const HeroTitle = styled.h1`
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(36px, 5vw, 52px);
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.75rem 0;
  letter-spacing: -1px;
  font-variation-settings: "BLED" 0, "SCAN" 0;
`;

const HeroSubtitle = styled.p`
  font-family: var(--font-mono);
  font-size: 15px;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  opacity: 0.9;
`;

const SupporterCount = styled.p`
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  margin: 1rem 0 0 0;
  background: linear-gradient(135deg, #4f4dc1, #6b69d6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    rgba(79, 77, 193, 0.1) 25%,
    rgba(79, 77, 193, 0.2) 50%,
    rgba(79, 77, 193, 0.1) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 4px;
`;

function SkeletonSection({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <Section>
      <SectionHeader>
        <SkeletonIcon />
        <SkeletonTitle />
        <SkeletonCount />
      </SectionHeader>
      <UsersGrid>
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonAvatar />
            <SkeletonInfo>
              <SkeletonName />
              <SkeletonUsername />
            </SkeletonInfo>
            <SkeletonBadge />
          </SkeletonCard>
        ))}
      </UsersGrid>
    </Section>
  );
}

const SkeletonIcon = styled(SkeletonBase)`
  width: 20px;
  height: 20px;
  border-radius: 4px;
`;

const SkeletonTitle = styled(SkeletonBase)`
  width: 120px;
  height: 20px;
`;

const SkeletonCount = styled(SkeletonBase)`
  width: 32px;
  height: 18px;
  border-radius: 10px;
`;

const SkeletonCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(79, 77, 193, 0.15);
  border-radius: 10px;
`;

const SkeletonAvatar = styled(SkeletonBase)`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const SkeletonInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SkeletonName = styled(SkeletonBase)`
  width: 80px;
  height: 14px;
`;

const SkeletonUsername = styled(SkeletonBase)`
  width: 60px;
  height: 12px;
`;

const SkeletonBadge = styled(SkeletonBase)`
  width: 40px;
  height: 18px;
  flex-shrink: 0;
`;

const SkeletonSupporterCount = styled(SkeletonBase)`
  width: 180px;
  height: 16px;
  margin: 1rem auto 0;
`;

const SectionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

const Section = styled.section``;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(79, 77, 193, 0.2);
`;

const SectionIcon = styled.span`
  font-size: 20px;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
  color: ${(props) => props.theme.contrast};
  margin: 0;
`;

const UserCount = styled.span`
  font-family: var(--font-mono);
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  background: rgba(79, 77, 193, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
`;

const UsersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
`;

const UserCardWrapper = styled.div``;

const UserCardLink = styled(Link)`
  display: block;
  text-decoration: none;
`;

const UserCardInner = styled.div<{ $clickable: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(79, 77, 193, 0.15);
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

  &:hover {
    border-color: ${(props) =>
      props.$clickable ? "rgba(79, 77, 193, 0.4)" : "rgba(79, 77, 193, 0.15)"};
    background: ${(props) =>
      props.$clickable ? "rgba(79, 77, 193, 0.05)" : props.theme.postBackground};
  }
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4f4dc1, #6b69d6);
  color: white;
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 18px;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  color: ${(props) => props.theme.contrast};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Username = styled.div`
  font-family: var(--font-mono);
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const badgeColors: Record<
  string,
  { bg: string; color: string; border?: string; gradient?: boolean }
> = {
  Staff: { bg: "transparent", color: "", gradient: true },
  "SL II": { bg: "rgba(247, 190, 92, 0.15)", color: "#f7be5c", border: "rgba(247, 190, 92, 0.3)" },
  "SL I": { bg: "rgba(144, 116, 242, 0.15)", color: "#9074f2", border: "rgba(144, 116, 242, 0.3)" },
  T3: { bg: "rgba(145, 71, 255, 0.2)", color: "#9147ff", border: "rgba(145, 71, 255, 0.35)" },
  T2: { bg: "rgba(145, 71, 255, 0.15)", color: "#9147ff", border: "rgba(145, 71, 255, 0.3)" },
  T1: { bg: "rgba(145, 71, 255, 0.1)", color: "#9147ff", border: "rgba(145, 71, 255, 0.25)" },
  Booster: {
    bg: "rgba(244, 127, 255, 0.15)",
    color: "#f47fff",
    border: "rgba(244, 127, 255, 0.3)",
  },
  Contributor: {
    bg: "rgba(46, 204, 113, 0.15)",
    color: "#2ecc71",
    border: "rgba(46, 204, 113, 0.3)",
  },
};

const UserBadge = styled.span<{ $type: string }>`
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(props) => badgeColors[props.$type]?.bg || "rgba(255, 255, 255, 0.1)"};
  color: ${(props) => badgeColors[props.$type]?.color || props.theme.contrast};
  border: 1px solid ${(props) => badgeColors[props.$type]?.border || "transparent"};
  flex-shrink: 0;

  ${(props) =>
    badgeColors[props.$type]?.gradient &&
    `
    background: linear-gradient(135deg, #9074f2, #f7be5c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    border: none;
    padding: 0;
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 20px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const EmptyDescription = styled.p`
  font-family: var(--font-sans);
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
  line-height: 1.6;

  a {
    color: #4f4dc1;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const FooterNote = styled.p`
  text-align: center;
  font-family: var(--font-sans);
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(79, 77, 193, 0.15);

  a {
    color: #4f4dc1;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ShowMoreNote = styled.p`
  font-family: var(--font-sans);
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  margin-top: 0.75rem;
  text-align: center;
`;
