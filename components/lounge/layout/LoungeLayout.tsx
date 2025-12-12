import { useState, useCallback } from "react";
import styled from "styled-components";
import { m, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { Menu, X, type LucideIcon } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { LOUNGE_LAYOUT, LOUNGE_COLORS } from "../../../constants/lounge";
import { useTierAccess } from "../../../hooks/lounge/useTierAccess";
import { Sidebar } from "./Sidebar";
import { MembersPanel } from "./MembersPanel";
import { TopBar } from "./TopBar";
import { UserPopoutProvider, UserPopout } from "../user-popout";
import { UsernameSetup } from "../UsernameSetup";

interface LoungeLayoutProps {
  children: React.ReactNode;
  channelSlug?: string;
  channelName?: string;
  channelType?: "chat" | "announcements" | "content";
  customIcon?: LucideIcon;
}

export function LoungeLayout({
  children,
  channelSlug,
  channelName,
  channelType,
  customIcon,
}: LoungeLayoutProps) {
  const { isLoading, isSupporter, tier, isCreator, displayName, avatarUrl } = useTierAccess();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(true);
  const [usernameSkipped, setUsernameSkipped] = useState(false);

  // Get current user from Convex to check for username
  const currentUser = useQuery(api.users.getMe);

  // Handle username setup completion
  const handleUsernameComplete = useCallback(() => {
    // User set their username, continue to lounge
  }, []);

  // Handle username setup skip
  const handleUsernameSkip = useCallback(() => {
    setUsernameSkipped(true);
  }, []);

  // Show loading state
  if (isLoading || currentUser === undefined) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading the lounge...</LoadingText>
      </LoadingContainer>
    );
  }

  // Not a supporter - show upgrade prompt
  if (!isSupporter) {
    return (
      <AccessDeniedContainer>
        <AccessDeniedContent>
          <AccessDeniedIcon>🔒</AccessDeniedIcon>
          <AccessDeniedTitle>nevulounge</AccessDeniedTitle>
          <AccessDeniedText>
            The nevulounge is an exclusive space for Super Legends.
            <br />
            Become a Super Legend to unlock access!
          </AccessDeniedText>
          <UpgradeButton href="/support">
            Get access now
          </UpgradeButton>
        </AccessDeniedContent>
      </AccessDeniedContainer>
    );
  }

  // Show username setup if user doesn't have a username yet
  if (currentUser && !currentUser.username && !usernameSkipped) {
    return (
      <UsernameSetupContainer>
        <UsernameSetup
          onComplete={handleUsernameComplete}
          onSkip={handleUsernameSkip}
        />
      </UsernameSetupContainer>
    );
  }

  return (
    <UserPopoutProvider>
      <LayoutContainer>
        {/* Mobile sidebar toggle */}
        <MobileMenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </MobileMenuButton>

        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || typeof window !== "undefined" && window.innerWidth >= LOUNGE_LAYOUT.mobileBreakpoint) && (
            <SidebarWrapper
              initial={false}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <Sidebar
                currentChannelSlug={channelSlug}
                onChannelSelect={() => setIsSidebarOpen(false)}
                userTier={tier}
                isCreator={isCreator}
                displayName={displayName}
                avatarUrl={avatarUrl}
              />
            </SidebarWrapper>
          )}
        </AnimatePresence>

        {/* Mobile overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <MobileOverlay
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main content area */}
        <MainContent>
          <TopBar
            channelName={channelName}
            channelType={channelType}
            customIcon={customIcon}
            onToggleMembers={() => setIsMembersPanelOpen(!isMembersPanelOpen)}
            isMembersPanelOpen={isMembersPanelOpen}
          />
          <ContentArea>{children}</ContentArea>
        </MainContent>

        {/* Members panel (desktop only) */}
        <AnimatePresence>
          {isMembersPanelOpen && (
            <MembersPanelWrapper
              initial={false}
              animate={{ width: LOUNGE_LAYOUT.membersPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <MembersPanel />
            </MembersPanelWrapper>
          )}
        </AnimatePresence>

        {/* User Popout (renders as portal) */}
        <UserPopout />
      </LayoutContainer>
    </UserPopoutProvider>
  );
}

// Styled Components
const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background: ${(props) => props.theme.background};
  overflow: hidden;
`;

const SidebarWrapper = styled(m.div)`
  width: ${LOUNGE_LAYOUT.sidebarWidth};
  min-width: ${LOUNGE_LAYOUT.sidebarWidth};
  height: 100%;
  background: ${LOUNGE_COLORS.glassBackground};
  border-right: 1px solid ${LOUNGE_COLORS.glassBorder};
  z-index: 100;

  @media (max-width: ${LOUNGE_LAYOUT.mobileBreakpoint}px) {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Allow flex shrinking */
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const MembersPanelWrapper = styled(m.div)`
  height: 100%;
  background: ${LOUNGE_COLORS.glassBackground};
  border-left: 1px solid ${LOUNGE_COLORS.glassBorder};
  overflow: hidden;

  @media (max-width: ${LOUNGE_LAYOUT.mobileBreakpoint}px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 150;
  padding: 8px;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(144, 116, 242, 0.2);
  }

  @media (max-width: ${LOUNGE_LAYOUT.mobileBreakpoint}px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileOverlay = styled(m.div)`
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;

  @media (max-width: ${LOUNGE_LAYOUT.mobileBreakpoint}px) {
    display: block;
  }
`;

// Loading state
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: ${(props) => props.theme.background};
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
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

const LoadingText = styled.p`
  color: ${(props) => props.theme.textColor};
  font-size: 0.9rem;
  opacity: 0.7;
`;

// Access denied state
const AccessDeniedContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: ${(props) => props.theme.background};
  padding: 2rem;
`;

const AccessDeniedContent = styled.div`
  text-align: center;
  max-width: 400px;
  padding: 2rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  backdrop-filter: blur(10px);
`;

const AccessDeniedIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const AccessDeniedTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.5rem;
`;

const AccessDeniedText = styled.p`
  color: ${(props) => props.theme.textColor};
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
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

// Username setup container
const UsernameSetupContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${(props) => props.theme.background};
  padding: 2rem;
`;
