import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Check, Crown, ExternalLink, Loader2 } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import SuperLegendIcon from "../../assets/img/super-legend.png";
import SuperLegend2Icon from "../../assets/img/super-legend-2.png";
import { AnimatedMinimalView } from "../../components/layout/minimal";

type ClerkPlan = "super_legend" | "super_legend_2" | null;

export default function SupportThanks() {
  const { user } = useUser();
  const [syncStatus, setSyncStatus] = useState<"syncing" | "synced" | "error">("syncing");
  const [founderNumber, setFounderNumber] = useState<number | null>(null);
  const [clerkPlan, setClerkPlan] = useState<ClerkPlan>(null);

  // Sync supporter status on mount
  useEffect(() => {
    if (!user) return;

    const doSync = async () => {
      try {
        const res = await fetch("/api/supporter/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          setSyncStatus("synced");
          if (data.status?.founderNumber) {
            setFounderNumber(data.status.founderNumber);
          }
          if (data.status?.clerkPlan) {
            setClerkPlan(data.status.clerkPlan);
          }
        } else {
          setSyncStatus("error");
        }
      } catch {
        setSyncStatus("error");
      }
    };

    // Small delay to ensure Clerk billing has processed
    const timeout = setTimeout(doSync, 1500);
    return () => clearTimeout(timeout);
  }, [user]);

  const isSuperLegend2 = clerkPlan === "super_legend_2";
  const tierIcon = isSuperLegend2 ? SuperLegend2Icon : SuperLegendIcon;
  const tierName = isSuperLegend2 ? "Super Legend II" : "Super Legend";

  return (
    <ThanksView>
      <ContentContainer>
        <SignedIn>
          <SuccessIcon>
            <Check size={48} strokeWidth={3} />
          </SuccessIcon>

          <Title>
            you are a<br />
            <TierHighlight>{tierName}</TierHighlight>
          </Title>

          <Subtitle>
            Thank you so much for your support, {user?.firstName || "friend"}!
            <br />
            Your subscription means the world to me.
          </Subtitle>

          {syncStatus === "synced" && clerkPlan && (
            <IconWrapper>
              <Image src={tierIcon} alt={tierName} width={80} height={80} />
            </IconWrapper>
          )}

          {syncStatus === "syncing" && (
            <SyncStatus>
              <Spinner>
                <Loader2 size={18} />
              </Spinner>
              <span>Setting up your perks...</span>
            </SyncStatus>
          )}

          {syncStatus === "synced" && founderNumber && (
            <FounderCard>
              <FounderBadge>
                <Crown size={20} />
                Founder #{founderNumber}
              </FounderBadge>
              <FounderText>
                Congratulations! You&apos;re one of the first 10 supporters and have earned the
                exclusive <strong>Founder</strong> badge. This badge is permanent and will be
                displayed on your profile forever.
              </FounderText>
            </FounderCard>
          )}

          {syncStatus === "synced" && !founderNumber && (
            <SyncStatus $success>
              <Check size={18} />
              <span>Your perks are ready!</span>
            </SyncStatus>
          )}

          <WhatNext>
            <WhatNextTitle>What&apos;s next?</WhatNextTitle>
            <WhatNextItems>
              <WhatNextItem
                href="https://discord.gg/nevulo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ItemCheck>
                  <Check size={14} />
                </ItemCheck>
                <ItemContent>
                  <ItemText>Join the exclusive Discord channel for supporters</ItemText>
                </ItemContent>
                <ExternalLink size={14} />
              </WhatNextItem>

              <WhatNextItem href="/lounge">
                <ItemCheck>
                  <Check size={14} />
                </ItemCheck>
                <ItemContent>
                  <ItemText>
                    Visit the Nevulounge for special {isSuperLegend2 ? "tier 2" : "supporter"}{" "}
                    access
                  </ItemText>
                </ItemContent>
              </WhatNextItem>

              <WhatNextItem href="/vault">
                <ItemCheck>
                  <Check size={14} />
                </ItemCheck>
                <ItemContent>
                  <ItemText>Check out the Legend Vault for downloadables</ItemText>
                </ItemContent>
              </WhatNextItem>

              <WhatNextItemStatic>
                <ItemCheck>
                  <Check size={14} />
                </ItemCheck>
                <ItemContent>
                  <ItemText>Your badge will appear on your profile</ItemText>
                </ItemContent>
              </WhatNextItemStatic>

              <WhatNextItemStatic>
                <ItemCheck>
                  <Check size={14} />
                </ItemCheck>
                <ItemContent>
                  <ItemText>Look out for early access content + drops in the Nevulounge</ItemText>
                </ItemContent>
              </WhatNextItemStatic>
            </WhatNextItems>
          </WhatNext>

          <ButtonRow>
            <PrimaryButton href="/">Back to Home</PrimaryButton>
            <SecondaryButton href="/support">View Subscription</SecondaryButton>
          </ButtonRow>
        </SignedIn>

        <SignedOut>
          <Title>Thank You!</Title>
          <Subtitle>Please sign in to view your subscription details.</Subtitle>
          <ButtonRow>
            <PrimaryButton href="/sign-in?redirect_url=/support/thanks">Sign In</PrimaryButton>
          </ButtonRow>
        </SignedOut>
      </ContentContainer>

      <Head>
        <title>Thank You! - Nevulo</title>
        <meta name="description" content="Thank you for becoming a Super Legend supporter!" />
      </Head>
    </ThanksView>
  );
}

// ============================================
// STYLED COMPONENTS
// ============================================

const ThanksView = styled(AnimatedMinimalView)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
`;

const ContentContainer = styled.div`
  max-width: 600px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  margin-bottom: 1.5rem;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const Title = styled.h1`
  font-family: var(--font-display);
  font-size: clamp(28px, 5vw, 40px);
  font-weight: 400;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1rem 0;
  letter-spacing: -1px;
  line-height: 1.2;
`;

const TierHighlight = styled.span`
  font-family: var(--font-sixtyfour);
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 400;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
`;

const Subtitle = styled.p`
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.8;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 2rem 0;
  opacity: 0.9;
`;

const IconWrapper = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 16px;
  background: rgba(79, 77, 193, 0.1);
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.span`
  display: flex;
  animation: ${spin} 1s linear infinite;
`;

const SyncStatus = styled.div<{ $success?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-sans);
  font-size: 14px;
  color: ${(p) => (p.$success ? "#22c55e" : p.theme.textColor)};
  margin-bottom: 2rem;
  padding: 12px 20px;
  background: ${(p) => (p.$success ? "rgba(34, 197, 94, 0.1)" : "rgba(79, 77, 193, 0.1)")};
  border-radius: 8px;
`;

const founderGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 15px rgba(255, 110, 180, 0.4);
  }
  50% {
    box-shadow: 0 0 25px rgba(255, 110, 180, 0.6);
  }
`;

const FounderCard = styled.div`
  background: rgba(255, 110, 180, 0.08);
  border: 1.5px solid rgba(255, 110, 180, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  animation: ${founderGlow} 3s ease-in-out infinite;
  width: 100%;
`;

const FounderBadge = styled.div`
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: #ff6eb4;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const FounderText = styled.p`
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: ${(props) => props.theme.textColor};
  margin: 0;

  strong {
    color: #ff6eb4;
  }
`;

const WhatNext = styled.div`
  background: rgba(79, 77, 193, 0.08);
  border: 1px solid rgba(79, 77, 193, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
  width: 100%;
`;

const WhatNextTitle = styled.h3`
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  margin: 0 0 1rem 0;
`;

const WhatNextItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const itemBaseStyles = `
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
`;

const WhatNextItem = styled(Link)`
  ${itemBaseStyles}
  text-decoration: none;
  color: inherit;

  &:hover {
    background: rgba(79, 77, 193, 0.15);
    transform: translateX(4px);
  }
`;

const WhatNextItemStatic = styled.div`
  ${itemBaseStyles}
  opacity: 0.8;
`;

const ItemCheck = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  flex-shrink: 0;
`;

const ItemContent = styled.div`
  flex: 1;
`;

const ItemText = styled.span`
  font-family: var(--font-sans);
  font-size: 14px;
  color: ${(props) => props.theme.textColor};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const PrimaryButton = styled(Link)`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #4f4dc1, #6b69d6);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 77, 193, 0.4);
  }
`;

const SecondaryButton = styled(Link)`
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 14px;
  padding: 0.875rem 1.5rem;
  background: transparent;
  color: ${(props) => props.theme.textColor};
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;
