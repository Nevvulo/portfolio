import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LoungeLayout } from "../../components/lounge/layout/LoungeLayout";
import { useTierAccess } from "../../hooks/lounge/useTierAccess";
import type { ChannelWithAccess } from "../../types/lounge";

// Use getServerSideProps to prevent static generation
export const getServerSideProps = () => ({ props: {} });

export default function LoungePage() {
  const [mounted, setMounted] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const router = useRouter();
  const { isLoading, user, tier, displayName, avatarUrl } = useTierAccess();

  const getOrCreateUser = useAction(api.users.getOrCreateUser);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure user exists in Convex before making queries
  // SECURITY: Server fetches verified discordId and tier from Clerk
  useEffect(() => {
    if (!mounted || isLoading || !user || userReady) return;

    getOrCreateUser({
      displayName: displayName || "Anonymous",
      avatarUrl: avatarUrl,
    }).then(() => {
      setUserReady(true);
    }).catch((err) => {
      console.error("Failed to create user:", err);
      setUserReady(true);
    });
  }, [mounted, isLoading, user, displayName, avatarUrl, userReady, getOrCreateUser]);

  // Only query after user is ready
  const channels = useQuery(
    api.channels.list,
    userReady ? {} : "skip"
  ) as ChannelWithAccess[] | undefined;

  // Redirect to first accessible channel
  useEffect(() => {
    if (isLoading || !userReady || !channels || channels.length === 0) return;

    // Find first accessible channel
    const firstChannel = channels.find((c) => c.hasAccess);
    if (firstChannel) {
      router.replace(`/lounge/${firstChannel.slug}`);
    }
  }, [isLoading, userReady, channels, router]);

  return (
    <>
      <Head>
        <title>nevulounge</title>
        <meta name="description" content="Exclusive member-only lounge for Super Legend supporters" />
      </Head>

      <LoungeLayout>
        <WelcomeContainer>
          <WelcomeTitle>welcome to the nevulounge</WelcomeTitle>
        </WelcomeContainer>
      </LoungeLayout>
    </>
  );
}

import styled from "styled-components";

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
`;


const WelcomeTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.75rem;
  font-family: var(--font-display);
`;

