import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import { useUserPopout } from "../../../hooks/lounge/useUserPopout";
import { useUserProfile } from "../../../hooks/lounge/useUserProfile";
import { SupporterBadges } from "../../badges/supporter-badges";
import { UserAvatar } from "./UserAvatar";
import { UserBanner } from "./UserBanner";
import { UserBio } from "./UserBio";
import { UserConnections } from "./UserConnections";
import { UserMetadata } from "./UserMetadata";
import { UserName } from "./UserName";

/**
 * Main UserPopout component
 * Displays user profile in a floating popout when clicking on user names
 */
export function UserPopout() {
  const { state, close } = useUserPopout();
  const { isOpen, targetUserId, anchorEl } = state;

  const popoutRef = useRef<HTMLDivElement>(null);

  const {
    profile,
    isLoading,
    isOwnProfile,
    updateBio,
    togglePrivacy,
    connectedAccounts,
    showConnections,
  } = useUserProfile(targetUserId);

  // Handle click outside to close
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        popoutRef.current &&
        !popoutRef.current.contains(e.target as Node) &&
        !anchorEl?.contains(e.target as Node)
      ) {
        close();
      }
    },
    [anchorEl, close],
  );

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    },
    [close],
  );

  // Add event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClickOutside, handleKeyDown]);

  // Calculate position relative to anchor
  const getPosition = () => {
    if (!anchorEl) return { top: 0, left: 0 };

    const rect = anchorEl.getBoundingClientRect();
    const popoutWidth = 300;
    const popoutHeight = 450; // Approximate max height
    const padding = 12;

    let left = rect.left;
    let top = rect.bottom + padding;

    // Check if popout would go off right edge
    if (left + popoutWidth > window.innerWidth - padding) {
      left = window.innerWidth - popoutWidth - padding;
    }

    // Check if popout would go off bottom edge
    if (top + popoutHeight > window.innerHeight - padding) {
      // Position above the anchor instead
      top = rect.top - popoutHeight - padding;
      if (top < padding) {
        top = padding;
      }
    }

    // Ensure not off left edge
    if (left < padding) {
      left = padding;
    }

    return { top, left };
  };

  const position = getPosition();

  return (
    <AnimatePresence>
      {isOpen && (
        <PopoutContainer
          ref={popoutRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ top: position.top, left: position.left }}
        >
          {/* Close button */}
          <CloseButton onClick={close}>
            <X size={16} />
          </CloseButton>

          {isLoading ? (
            <LoadingState>
              <LoadingSpinner />
            </LoadingState>
          ) : profile ? (
            <>
              {/* Banner */}
              <UserBanner
                bannerUrl={profile.bannerUrl}
                bannerFocalY={profile.bannerFocalY}
                isEditable={isOwnProfile}
              />

              {/* Avatar - positioned to overlap banner */}
              <AvatarWrapper>
                <UserAvatar
                  avatarUrl={profile.avatarUrl}
                  displayName={profile.displayName}
                  status={profile.status}
                  size={72}
                />
              </AvatarWrapper>

              {/* Profile content */}
              <ProfileContent>
                {/* Name and badges */}
                <NameSection>
                  <UserName
                    displayName={profile.displayName}
                    tier={profile.tier}
                    isCreator={profile.isCreator}
                  />
                  <BadgesWrapper>
                    <SupporterBadges
                      size="small"
                      supporterData={{
                        discordHighestRole: profile.discordHighestRole,
                        twitchSubTier: profile.twitchSubTier,
                        discordBooster: profile.discordBooster,
                        clerkPlan: profile.clerkPlan,
                        clerkPlanStatus: profile.clerkPlanStatus,
                      }}
                    />
                  </BadgesWrapper>
                </NameSection>

                {/* Divider */}
                <Divider />

                {/* Bio */}
                <Section>
                  <UserBio bio={profile.bio} isEditable={isOwnProfile} onSave={updateBio} />
                </Section>

                {/* Connections */}
                {(connectedAccounts.length > 0 || isOwnProfile) && (
                  <Section>
                    <UserConnections
                      connections={connectedAccounts}
                      showConnections={showConnections}
                      isOwnProfile={isOwnProfile}
                      onTogglePrivacy={togglePrivacy}
                    />
                  </Section>
                )}

                {/* Metadata */}
                <Section>
                  <UserMetadata
                    createdAt={profile.createdAt}
                    discordHighestRole={profile.discordHighestRole}
                  />
                </Section>
              </ProfileContent>
            </>
          ) : (
            <ErrorState>User not found</ErrorState>
          )}
        </PopoutContainer>
      )}
    </AnimatePresence>
  );
}

const PopoutContainer = styled(m.div)`
  position: fixed;
  width: 300px;
  max-height: calc(100vh - 24px);
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  box-shadow: ${LOUNGE_COLORS.glassShadow};
  backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  margin-top: -40px;
  margin-left: 16px;
  z-index: 5;
`;

const ProfileContent = styled.div`
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
`;

const NameSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BadgesWrapper = styled.div`
  display: flex;
`;

const Divider = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
`;

const Section = styled.div``;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
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

const ErrorState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
`;

export default UserPopout;
