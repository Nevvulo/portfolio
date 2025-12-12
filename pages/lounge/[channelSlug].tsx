import { useRouter } from "next/router";
import Head from "next/head";
import styled from "styled-components";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useState, useMemo } from "react";
import { api } from "../../convex/_generated/api";
import { LoungeLayout } from "../../components/lounge/layout/LoungeLayout";
import { ChatView } from "../../components/lounge/chat/ChatView";
import { useTierAccess } from "../../hooks/lounge/useTierAccess";
import { getCachedChannel, setCachedChannel } from "../../lib/lounge/channelCache";
import { LOUNGE_COLORS, TIER_INFO } from "../../constants/lounge";
import type { ChannelWithAccess, Tier } from "../../types/lounge";
import type { Id } from "../../convex/_generated/dataModel";
import { XCircleIcon } from "lucide-react";

// Use getServerSideProps to prevent static generation
export const getServerSideProps = () => ({ props: {} });

export default function ChannelPage() {
  const [mounted, setMounted] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const router = useRouter();
  const { channelSlug } = router.query;
  const { isLoading, isCreator, user, tier, displayName, avatarUrl } = useTierAccess();

  // Mutations
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const heartbeat = useMutation(api.users.heartbeat);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure user exists in Convex before making queries
  useEffect(() => {
    if (!mounted || isLoading || !user || !tier || userReady) return;

    const discordAccount = user.externalAccounts?.find(
      (account) => account.provider === "discord"
    );
    // Clerk stores Discord user ID in providerUserId (preferred) or externalId
    const discordId = (discordAccount as any)?.providerUserId || (discordAccount as any)?.externalId;

    getOrCreateUser({
      displayName: displayName || "Anonymous",
      avatarUrl: avatarUrl,
      tier: tier,
      discordId: discordId,
    }).then(() => {
      setUserReady(true);
    }).catch((err) => {
      console.error("Failed to create user:", err);
      setUserReady(true); // Continue anyway
    });
  }, [mounted, isLoading, user, tier, displayName, avatarUrl, userReady, getOrCreateUser]);

  // Get channel details - only query after user is ready
  const serverChannel = useQuery(
    api.channels.getBySlug,
    userReady && channelSlug ? { slug: channelSlug as string } : "skip"
  ) as ChannelWithAccess | null | undefined;

  // Load cached channel immediately
  const cachedChannel = useMemo(() => {
    if (!channelSlug) return null;
    return getCachedChannel(channelSlug as string);
  }, [channelSlug]);

  // Update cache when server responds
  useEffect(() => {
    if (serverChannel && channelSlug) {
      setCachedChannel({
        _id: serverChannel._id as string,
        slug: serverChannel.slug,
        name: serverChannel.name,
        description: serverChannel.description,
        type: serverChannel.type,
        icon: serverChannel.icon,
        requiredTier: serverChannel.requiredTier,
        hasAccess: serverChannel.hasAccess,
        isLocked: serverChannel.isLocked,
        cachedAt: Date.now(),
      });
    }
  }, [serverChannel, channelSlug]);

  // Use server channel if available, otherwise cached
  const channel = serverChannel ?? (cachedChannel as ChannelWithAccess | null);

  useEffect(() => {
    if (!user) return;

    // Initial heartbeat
    heartbeat({});

    // Regular heartbeat every 30 seconds
    const interval = setInterval(() => {
      heartbeat({});
    }, 30000);

    return () => clearInterval(interval);
  }, [user, heartbeat]);

  // Handle loading state - only show if no cached channel AND still loading
  if (isLoading || !userReady || (serverChannel === undefined && !cachedChannel)) {
    return (
      <LoungeLayout
        channelSlug={cachedChannel?.slug ?? channelSlug as string}
        channelName={cachedChannel?.name}
        channelType={cachedChannel?.type as "chat" | "announcements" | "content" | undefined}
      >
        <LoadingContainer>
          <LoadingSpinner />
          <span>Loading...</span>
        </LoadingContainer>
      </LoungeLayout>
    );
  }

  // Handle channel not found
  if (channel === null) {
    return (
      <>
        <Head>
          <title>#notfound?! | nevulounge</title>
        </Head>
        <LoungeLayout>
          <ErrorContainer>
            <XCircleIcon size={32} style={{ marginBottom: 16 }} />
            <ErrorTitle>channel not found</ErrorTitle>
            <ErrorText>
              This channel doesn't exist or has been removed.
            </ErrorText>
          </ErrorContainer>
        </LoungeLayout>
      </>
    );
  }

  // Handle no access
  if (!channel.hasAccess) {
    const requiredTierInfo = TIER_INFO[channel.requiredTier as Tier];

    return (
      <>
        <Head>
          <title>{channel.name} (Locked) | nevulounge</title>
        </Head>
        <LoungeLayout
          channelSlug={channel.slug}
          channelName={channel.name}
          channelType={channel.type as "chat" | "announcements" | "content"}
        >
          <LockedContainer>
            <LockedIcon>🔒</LockedIcon>
            <LockedTitle>Channel Locked</LockedTitle>
            <LockedText>
              This channel requires <TierHighlight>{requiredTierInfo.name}</TierHighlight> access.
            </LockedText>
            <UpgradeButton href="/support">
              Upgrade to {requiredTierInfo.name}
            </UpgradeButton>
          </LockedContainer>
        </LoungeLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>#{channel.name} | nevulounge</title>
        <meta name="description" content={channel.description || `Chat in #${channel.name}`} />
      </Head>

      <LoungeLayout
        channelSlug={channel.slug}
        channelName={channel.name}
        channelType={channel.type as "chat" | "announcements" | "content"}
      >
        <ChatView
          channelId={channel._id as Id<"channels">}
          channelName={channel.name}
          currentUserId={user?.id ?? ""}
          currentUserName={displayName ?? "Anonymous"}
          currentUserAvatar={avatarUrl}
          currentUserTier={tier ?? "tier1"}
          isCreator={isCreator}
        />
      </LoungeLayout>
    </>
  );
}

// Styled Components
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${LOUNGE_COLORS.glassBorder};
  border-top-color: ${LOUNGE_COLORS.tier1};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-family: "Sixtyfour", monospace;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem;
`;

const ErrorText = styled.p`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
`;

const LockedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
`;

const LockedIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const LockedTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.75rem;
`;

const LockedText = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1.5rem;
`;

const TierHighlight = styled.span`
  color: ${LOUNGE_COLORS.tier2};
  font-weight: 600;
`;

const UpgradeButton = styled.a`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  color: #fff;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(144, 116, 242, 0.4);
  }
`;
