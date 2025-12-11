import { useClerk, useUser } from "@clerk/nextjs";
import { useSubscription } from "@clerk/nextjs/experimental";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { SupporterBadges } from "../../components/badges/supporter-badges";
import { SimpleNavbar } from "../../components/navbar/simple";
import { useSupporterStatus } from "../../hooks/useSupporterStatus";

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { status: supporterStatus, isSyncing: badgeSyncing, syncStatus: syncBadges, hasBadges, syncError: badgeSyncError } = useSupporterStatus();
  const router = useRouter();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <AccountView>
        <SimpleNavbar backRoute="/" />
        <LoadingContainer>Loading...</LoadingContainer>
      </AccountView>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  // Extract connected accounts
  const discordAccount = user.externalAccounts.find(
    (account) => account.provider === "discord"
  );
  const googleAccount = user.externalAccounts.find(
    (account) => account.provider === "google"
  );
  const twitchAccount = user.externalAccounts.find(
    (account) => account.provider === "twitch"
  );

  const handleConnectDiscord = async () => {
    try {
      await user.createExternalAccount({
        strategy: "oauth_discord",
        redirectUrl: "/account",
      });
    } catch (error) {
      console.error("Failed to connect Discord:", error);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      await user.createExternalAccount({
        strategy: "oauth_google",
        redirectUrl: "/account",
      });
    } catch (error) {
      console.error("Failed to connect Google:", error);
    }
  };

  const handleConnectTwitch = async () => {
    try {
      await user.createExternalAccount({
        strategy: "oauth_twitch",
        redirectUrl: "/account",
      });
    } catch (error) {
      console.error("Failed to connect Twitch:", error);
    }
  };

  const handleSyncDiscordRole = async () => {
    setSyncStatus("syncing");
    setSyncError(null);

    try {
      const planId = subscription?.subscriptionItems?.[0]?.plan?.id;
      const res = await fetch("/api/discord/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync role");
      }

      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch (error) {
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Failed to sync role");
      setTimeout(() => {
        setSyncStatus("idle");
        setSyncError(null);
      }, 5000);
    }
  };

  // Format next payment date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <AccountView>
      <SimpleNavbar backRoute="/" />

      <ContentContainer>
        <PageTitle>account</PageTitle>

        <Section>
          <SectionTitle>Profile</SectionTitle>
          <ProfileCard>
            <ProfileInfo>
              <Avatar src={user.imageUrl} alt={user.fullName || "User"} />
              <ProfileDetails>
                <ProfileName>
                  {user.fullName || user.username || "User"}
                </ProfileName>
                <ProfileEmail>
                  {user.primaryEmailAddress?.emailAddress}
                </ProfileEmail>
              </ProfileDetails>
            </ProfileInfo>
          </ProfileCard>
        </Section>

        <Section>
          <SectionTitle>Connected Accounts</SectionTitle>
          <SectionDescription>
            Link your accounts to access additional features and verify your identity.
          </SectionDescription>
          <ConnectionsGrid>
            <ConnectionCard $connected={!!discordAccount}>
              <ConnectionIcon>
                <DiscordIcon />
              </ConnectionIcon>
              <ConnectionInfo>
                <ConnectionName>Discord</ConnectionName>
                {discordAccount ? (
                  <>
                    <ConnectionStatus $connected>
                      Connected as {discordAccount.username}
                    </ConnectionStatus>
                    {syncError && <SyncError>{syncError}</SyncError>}
                  </>
                ) : (
                  <ConnectionStatus>Not connected</ConnectionStatus>
                )}
              </ConnectionInfo>
              {discordAccount ? (
                <SyncButton
                  onClick={handleSyncDiscordRole}
                  disabled={syncStatus === "syncing"}
                  $status={syncStatus}
                >
                  {syncStatus === "syncing"
                    ? "Syncing..."
                    : syncStatus === "success"
                      ? "Synced!"
                      : syncStatus === "error"
                        ? "Failed"
                        : "Sync Role"}
                </SyncButton>
              ) : (
                <ConnectButton onClick={handleConnectDiscord}>
                  Connect
                </ConnectButton>
              )}
            </ConnectionCard>

            <ConnectionCard $connected={!!googleAccount}>
              <ConnectionIcon>
                <GoogleIcon />
              </ConnectionIcon>
              <ConnectionInfo>
                <ConnectionName>Google</ConnectionName>
                {googleAccount ? (
                  <ConnectionStatus $connected>
                    Connected as {googleAccount.emailAddress}
                  </ConnectionStatus>
                ) : (
                  <ConnectionStatus>Not connected</ConnectionStatus>
                )}
              </ConnectionInfo>
              {!googleAccount && (
                <ConnectButton onClick={handleConnectGoogle}>
                  Connect
                </ConnectButton>
              )}
            </ConnectionCard>

            <ConnectionCard $connected={!!twitchAccount}>
              <ConnectionIcon>
                <TwitchIcon />
              </ConnectionIcon>
              <ConnectionInfo>
                <ConnectionName>Twitch</ConnectionName>
                {twitchAccount ? (
                  <ConnectionStatus $connected>
                    Connected as {twitchAccount.username}
                  </ConnectionStatus>
                ) : (
                  <ConnectionStatus>Not connected</ConnectionStatus>
                )}
              </ConnectionInfo>
              {!twitchAccount && (
                <ConnectButton onClick={handleConnectTwitch}>
                  Connect
                </ConnectButton>
              )}
            </ConnectionCard>
          </ConnectionsGrid>
        </Section>

        <Section>
          <SectionTitle>Your Badges</SectionTitle>
          <SectionDescription>
            Badges earned from supporting the channel and server.
          </SectionDescription>
          <BadgesCard>
            {hasBadges ? (
              <SupporterBadges direction="row" showLabels size="medium" />
            ) : (
              <NoBadgesMessage>
                Connect your Twitch or Discord account and subscribe/boost to earn badges!
              </NoBadgesMessage>
            )}
            <BadgesActions>
              <SyncBadgesButton
                onClick={syncBadges}
                disabled={badgeSyncing}
              >
                {badgeSyncing ? "Syncing..." : "Refresh Badges"}
              </SyncBadgesButton>
              {supporterStatus?.lastSyncedAt && (
                <LastSynced>
                  Last synced: {formatDate(supporterStatus.lastSyncedAt)}
                </LastSynced>
              )}
            </BadgesActions>
            {badgeSyncError && <SyncError>{badgeSyncError}</SyncError>}
          </BadgesCard>
        </Section>

        <Section>
          <SectionTitle>Subscription</SectionTitle>
          <SupporterCard $hasSubscription={!!subscription}>
            <SupporterIcon>
              {subscription ? <StarIcon /> : <SparklesIcon />}
            </SupporterIcon>
            <SupporterInfo>
              {subLoading ? (
                <>
                  <SupporterTitle>Loading...</SupporterTitle>
                  <SupporterDescription>
                    Checking your subscription status...
                  </SupporterDescription>
                </>
              ) : subscription ? (
                <>
                  <SupporterTitle>
                    {subscription.subscriptionItems?.[0]?.plan?.name || "Supporter"}
                  </SupporterTitle>
                  <SupporterDescription>
                    Thanks for supporting! You have access to exclusive features.
                  </SupporterDescription>
                  <SubscriptionMeta>
                    <SubscriptionStatus $status={subscription.status}>
                      {subscription.status}
                    </SubscriptionStatus>
                    {subscription.nextPayment && (
                      <NextPayment>
                        Next payment: {formatDate(subscription.nextPayment.date)}
                      </NextPayment>
                    )}
                  </SubscriptionMeta>
                </>
              ) : (
                <>
                  <SupporterTitle>Become a Supporter</SupporterTitle>
                  <SupporterDescription>
                    Subscribe to unlock exclusive features and support my work.
                  </SupporterDescription>
                </>
              )}
            </SupporterInfo>
            <SupporterLink href="/support">
              {subscription ? "Manage" : "View Plans"}
            </SupporterLink>
          </SupporterCard>
        </Section>

        <SignOutButton onClick={() => signOut({ redirectUrl: "/" })}>
          Sign Out
        </SignOutButton>
      </ContentContainer>

      <Head>
        <title>Account - Nevulo</title>
        <meta name="description" content="Manage your Nevulo account" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
    </AccountView>
  );
}

// Styled components
const AccountView = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${(props) => props.theme.background};
  padding-bottom: 4rem;
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Inter", sans-serif;
  color: ${(props) => props.theme.contrast};
`;

const ContentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  width: 100%;
`;

const PageTitle = styled.h1`
  font-family: "Sixtyfour", monospace;
  font-weight: 400;
  font-size: clamp(32px, 5vw, 48px);
  color: ${(props) => props.theme.contrast};
  margin: 0 0 2rem 0;
  letter-spacing: -1px;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;
`;

const SectionTitle = styled.h2`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 0.5rem 0;
`;

const SectionDescription = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: ${(props) => props.theme.contrast};
  opacity: 0.7;
  margin: 0 0 1rem 0;
`;

const ProfileCard = styled.div`
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(79, 77, 193, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
`;

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(79, 77, 193, 0.3);
`;

const ProfileDetails = styled.div``;

const ProfileName = styled.div`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 18px;
  color: ${(props) => props.theme.contrast};
`;

const ProfileEmail = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: ${(props) => props.theme.contrast};
  opacity: 0.8;
`;

const ConnectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const ConnectionCard = styled.div<{ $connected?: boolean }>`
  background: ${(props) => props.theme.postBackground};
  border: 1.5px solid
    ${(props) =>
      props.$connected
        ? "rgba(79, 77, 193, 0.5)"
        : "rgba(79, 77, 193, 0.2)"};
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(79, 77, 193, 0.4);
  }
`;

const ConnectionIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ConnectionInfo = styled.div`
  flex: 1;
`;

const ConnectionName = styled.div`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: ${(props) => props.theme.contrast};
`;

const ConnectionStatus = styled.div<{ $connected?: boolean }>`
  font-family: "Inter", sans-serif;
  font-size: 13px;
  color: ${(props) =>
    props.$connected ? "#4f4dc1" : props.theme.contrast};
  opacity: ${(props) => (props.$connected ? 1 : 0.7)};
`;

const ConnectButton = styled.button`
  background: rgba(79, 77, 193, 0.2);
  border: 1.5px solid rgba(79, 77, 193, 0.4);
  color: ${(props) => props.theme.contrast};
  padding: 8px 16px;
  border-radius: 8px;
  font-family: "SF Mono", monospace;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.3);
    border-color: rgba(79, 77, 193, 0.6);
  }
`;

const SyncButton = styled.button<{ $status?: string }>`
  background: ${(props) =>
    props.$status === "success"
      ? "rgba(34, 197, 94, 0.2)"
      : props.$status === "error"
        ? "rgba(239, 68, 68, 0.2)"
        : "rgba(88, 101, 242, 0.2)"};
  border: 1.5px solid
    ${(props) =>
      props.$status === "success"
        ? "rgba(34, 197, 94, 0.4)"
        : props.$status === "error"
          ? "rgba(239, 68, 68, 0.4)"
          : "rgba(88, 101, 242, 0.4)"};
  color: ${(props) =>
    props.$status === "success"
      ? "#22c55e"
      : props.$status === "error"
        ? "#ef4444"
        : "#5865F2"};
  padding: 8px 16px;
  border-radius: 8px;
  font-family: "SF Mono", monospace;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(88, 101, 242, 0.3);
    border-color: rgba(88, 101, 242, 0.6);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SyncError = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 11px;
  color: #ef4444;
  margin-top: 4px;
`;

const SupporterCard = styled.div<{ $hasSubscription?: boolean }>`
  background: ${(props) => props.theme.postBackground};
  border: 1.5px solid
    ${(props) =>
      props.$hasSubscription
        ? "rgba(79, 77, 193, 0.5)"
        : "rgba(79, 77, 193, 0.2)"};
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const SupporterIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SupporterInfo = styled.div`
  flex: 1;
`;

const SupporterTitle = styled.div`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: ${(props) => props.theme.contrast};
`;

const SupporterDescription = styled.div`
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: ${(props) => props.theme.contrast};
  opacity: 0.8;
  margin-top: 2px;
`;

const SubscriptionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const SubscriptionStatus = styled.span<{ $status?: string }>`
  font-family: "SF Mono", monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 8px;
  border-radius: 4px;
  background: ${(props) =>
    props.$status === "active"
      ? "rgba(34, 197, 94, 0.2)"
      : props.$status === "past_due"
        ? "rgba(251, 191, 36, 0.2)"
        : "rgba(79, 77, 193, 0.2)"};
  color: ${(props) =>
    props.$status === "active"
      ? "#22c55e"
      : props.$status === "past_due"
        ? "#fbbf24"
        : "#4f4dc1"};
`;

const NextPayment = styled.span`
  font-family: "Inter", sans-serif;
  font-size: 12px;
  color: ${(props) => props.theme.contrast};
  opacity: 0.6;
`;

const SupporterLink = styled(Link)`
  background: rgba(79, 77, 193, 0.2);
  border: 1.5px solid rgba(79, 77, 193, 0.4);
  color: ${(props) => props.theme.contrast};
  padding: 10px 20px;
  border-radius: 8px;
  font-family: "SF Mono", monospace;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(79, 77, 193, 0.3);
    border-color: rgba(79, 77, 193, 0.6);
  }
`;

const SignOutButton = styled.button`
  width: 100%;
  background: rgba(200, 50, 50, 0.2);
  border: 1.5px solid rgba(200, 50, 50, 0.4);
  color: #ff6b6b;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 2rem;

  &:hover {
    background: rgba(200, 50, 50, 0.3);
    border-color: rgba(200, 50, 50, 0.6);
  }
`;

// SVG Icons
const DiscordIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const StarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#4f4dc1">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const SparklesIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4f4dc1"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
    <path d="M19 10l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z" />
  </svg>
);

const TwitchIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#9147ff">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

// Badges section styled components
const BadgesCard = styled.div`
  background: ${(props) => props.theme.postBackground};
  border: 1.5px solid rgba(79, 77, 193, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NoBadgesMessage = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: ${(props) => props.theme.contrast};
  opacity: 0.7;
  margin: 0;
`;

const BadgesActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SyncBadgesButton = styled.button`
  background: rgba(79, 77, 193, 0.2);
  border: 1.5px solid rgba(79, 77, 193, 0.4);
  color: ${(props) => props.theme.contrast};
  padding: 8px 16px;
  border-radius: 8px;
  font-family: "SF Mono", monospace;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(79, 77, 193, 0.3);
    border-color: rgba(79, 77, 193, 0.6);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const LastSynced = styled.span`
  font-family: "Inter", sans-serif;
  font-size: 12px;
  color: ${(props) => props.theme.contrast};
  opacity: 0.6;
`;
