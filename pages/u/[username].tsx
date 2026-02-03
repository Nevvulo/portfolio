import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ArrowLeft, Camera, FileText, ImagePlus, Pencil } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import styled from "styled-components";
import { SimpleNavbar } from "@/components/navbar/simple";
import { SupporterBadges } from "../../components/badges/supporter-badges";
import { ContributionsModal } from "../../components/profile/ContributionsModal";
import { ProfileLinkButton } from "../../components/profile/ProfileLinkButton";
import { ProfileLinkEditor } from "../../components/profile/ProfileLinkEditor";
import { LOUNGE_COLORS, TIER_INFO } from "../../constants/theme";
import { api } from "../../convex/_generated/api";
import type { Tier } from "../../types/tiers";

export const getServerSideProps = () => ({ props: {} });

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { isSignedIn } = useUser();
  const [showContributions, setShowContributions] = useState(false);
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const user = useQuery(
    api.users.getByUsername,
    typeof username === "string" ? { username } : "skip",
  );

  const currentUser = useQuery(api.users.getMe, isSignedIn ? {} : "skip");

  const isOwnProfile = currentUser?._id === user?._id;

  const contributions = useQuery(
    api.blogPosts.getByUserContributions,
    user?._id ? { userId: user._id } : "skip",
  );

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/user/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, focalY: 50 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      console.error("Banner upload failed:", err);
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  if (!username || typeof username !== "string") {
    return null;
  }

  if (user === undefined) {
    return (
      <Container>
        <LoadingText>Loading profile...</LoadingText>
      </Container>
    );
  }

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
    month: "short",
    year: "numeric",
  });

  const tierColor = TIER_INFO[user.tier as Tier]?.color || "#9CA3AF";
  const tierName = TIER_INFO[user.tier as Tier]?.name || "Member";
  const isFreeTier = user.tier === "free";

  const nameColor =
    isFreeTier && user.discordHighestRole?.color
      ? `#${user.discordHighestRole.color.toString(16).padStart(6, "0")}`
      : tierColor;

  const profileLinks = user.profileLinks ?? [];

  return (
    <>
      <Head>
        <title>
          {user.displayName} (@{user.username}) | nevulo
        </title>
        <meta name="description" content={user.bio || `${user.displayName}'s profile on nevulo`} />
        <meta property="og:title" content={`${user.displayName} | nevulo`} />
        <meta property="og:description" content={user.bio || `${user.displayName}'s profile`} />
        {user.avatarUrl && <meta property="og:image" content={user.avatarUrl} />}
      </Head>

      <Container>
        {/* Banner */}
        <BannerWrapper>
          <Banner $url={user.bannerUrl} $focalY={user.bannerFocalY ?? 50}>
            {!user.bannerUrl && <BannerGradient $tier={user.tier as Tier} />}
            <BannerOverlay />
          </Banner>
          {isOwnProfile && (
            <BannerEditButton
              onClick={() => bannerInputRef.current?.click()}
              disabled={bannerUploading}
              title="Change banner"
            >
              {bannerUploading ? "..." : user.bannerUrl ? <Camera size={16} /> : <ImagePlus size={16} />}
            </BannerEditButton>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: "none" }}
            onChange={handleBannerUpload}
          />
        </BannerWrapper>

        {/* Avatar */}
        <AvatarWrapper>
          <Avatar src={user.avatarUrl} alt={user.displayName} />
        </AvatarWrapper>

        {/* Profile Info */}
        <ProfileInfo>
          <NameRow>
            <DisplayName $color={nameColor}>{user.displayName}</DisplayName>
            {user.isCreator && <StaffBadge>staff</StaffBadge>}
          </NameRow>
          <UsernameRow>
            <span>@{user.username}</span>
            <Dot />
            <span>{memberSince}</span>
          </UsernameRow>

          <BadgesLine>
            {!isFreeTier && <TierBadge $tier={user.tier as Tier}>{tierName}</TierBadge>}
            <SupporterBadges
              size="medium"
              supporterData={{
                discordHighestRole: user.discordHighestRole,
                discordBooster: user.discordBooster,
              }}
            />
          </BadgesLine>

          {user.bio && <Bio>{user.bio}</Bio>}
        </ProfileInfo>

        {/* Links Section */}
        <LinksSection>
          {profileLinks.length > 0 && (
            <LinksStack>
              {profileLinks.map((link: any, index: number) => (
                <ProfileLinkButton
                  key={`${link.type}-${link.serviceKey ?? link.title}-${index}`}
                  type={link.type}
                  serviceKey={link.serviceKey}
                  url={link.url}
                  title={link.title}
                />
              ))}
            </LinksStack>
          )}

          {isOwnProfile && (
            <EditLinksButton onClick={() => setShowLinkEditor(true)}>
              <Pencil size={16} />
              {profileLinks.length > 0 ? "Edit Links" : "Add Links"}
            </EditLinksButton>
          )}
        </LinksSection>

        {/* Article Contributions */}
        {contributions && contributions.length > 0 && (
          <ContributionsSection>
            <ContributionsButton onClick={() => setShowContributions(true)}>
              <FileText size={18} />
              <span>
                {contributions.length} article contribution{contributions.length !== 1 ? "s" : ""}
              </span>
            </ContributionsButton>
          </ContributionsSection>
        )}

        {/* Spacer to push footer down */}
        <Spacer />

        {/* Modals */}
        <ContributionsModal
          isOpen={showContributions}
          onClose={() => setShowContributions(false)}
          userId={user._id}
          userName={user.displayName}
        />

        {isOwnProfile && (
          <ProfileLinkEditor
            isOpen={showLinkEditor}
            onClose={() => setShowLinkEditor(false)}
            currentLinks={profileLinks}
            userTier={user.tier as "free" | "tier1" | "tier2"}
          />
        )}

        <Footer>
          <SimpleNavbar />
        </Footer>
      </Container>
    </>
  );
}

// ── Styled Components ──

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #0f0a1f 0%, #1a0f2e 50%, #0d0a1a 100%);
`;

const Spacer = styled.div`
  flex: 1;
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4rem;
`;

const NotFoundCard = styled.div`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  max-width: 400px;
  margin-top: 4rem;
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

// ── Banner ──

const BannerWrapper = styled.div`
  width: 100%;
  max-width: 100%;
  position: relative;
`;

const Banner = styled.div<{ $url?: string; $focalY: number }>`
  height: 220px;
  background: ${(p) =>
    p.$url ? `url(${p.$url}) center ${p.$focalY}% / cover no-repeat` : "transparent"};
  position: relative;

  @media (max-width: 640px) {
    height: 140px;
  }
`;

const BannerGradient = styled.div<{ $tier: Tier }>`
  position: absolute;
  inset: 0;
  background: ${(p) =>
    p.$tier === "tier2"
      ? `linear-gradient(135deg, ${LOUNGE_COLORS.tier2}44 0%, ${LOUNGE_COLORS.tier1}44 100%)`
      : p.$tier === "tier1"
        ? `linear-gradient(135deg, ${LOUNGE_COLORS.tier1}44 0%, rgba(144, 116, 242, 0.2) 100%)`
        : `linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(55, 65, 81, 0.3) 100%)`};
`;

const BannerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 10, 31, 0.95) 0%, transparent 60%);
`;

const BannerEditButton = styled.button`
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.15s ease;
  z-index: 2;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.7);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

// ── Avatar ──

const AvatarWrapper = styled.div`
  margin-top: -52px;
  position: relative;
  z-index: 1;

  @media (max-width: 640px) {
    margin-top: -42px;
  }
`;

const Avatar = styled.img`
  width: 104px;
  height: 104px;
  border-radius: 50%;
  border: 4px solid #0f0a1f;
  background: rgba(16, 13, 27, 0.85);
  object-fit: cover;

  @media (max-width: 640px) {
    width: 80px;
    height: 80px;
  }
`;

// ── Profile Info ──

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px 24px 0;
  max-width: 600px;
  width: 100%;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const DisplayName = styled.h1<{ $color: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(p) => p.$color};
  margin: 0;
`;

const StaffBadge = styled.span`
  padding: 2px 8px;
  font-size: 0.6rem;
  font-family: var(--font-display);
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const UsernameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0.25rem 0 0.75rem;
`;

const Dot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
`;

const BadgesLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const TierBadge = styled.span<{ $tier: Tier }>`
  display: inline-block;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(p) => TIER_INFO[p.$tier]?.color || "#9CA3AF"};
  background: ${(p) =>
    p.$tier === "tier2"
      ? LOUNGE_COLORS.tier2Background
      : p.$tier === "tier1"
        ? LOUNGE_COLORS.tier1Background
        : "rgba(107, 114, 128, 0.1)"};
  border-radius: 6px;
`;

const Bio = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin: 0 0 0.75rem;
  max-width: 480px;
`;

// ── Links Section ──

const LinksSection = styled.section`
  width: 100%;
  max-width: 600px;
  padding: 20px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LinksStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EditLinksButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
    border-color: rgba(144, 116, 242, 0.3);
    color: ${LOUNGE_COLORS.tier1};
  }
`;

// ── Contributions ──

const ContributionsSection = styled.section`
  width: 100%;
  max-width: 600px;
  padding: 16px 24px 0;
`;

const ContributionsButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.1);
    border-color: rgba(144, 116, 242, 0.3);
    color: ${LOUNGE_COLORS.tier1};
  }

  svg {
    color: ${LOUNGE_COLORS.tier1};
  }
`;

const Footer = styled.footer`
  padding: 2rem 0;
`;
