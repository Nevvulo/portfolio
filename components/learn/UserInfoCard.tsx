import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Bell } from "lucide-react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { api } from "../../convex/_generated/api";

interface UserInfoCardProps {
  className?: string;
}

export function UserInfoCard({ className }: UserInfoCardProps) {
  const { isSignedIn, user, isLoaded } = useUser();
  const experienceData = useQuery(api.experience.getMyExperience);
  const notifications = useQuery(api.notifications.getUnreadCount, isSignedIn ? {} : "skip");

  if (!isLoaded) {
    return (
      <CardContainer className={className}>
        <LoadingState />
      </CardContainer>
    );
  }

  if (!isSignedIn) {
    return (
      <CardContainer className={className}>
        <SignedOutState />
      </CardContainer>
    );
  }

  const level = experienceData?.level ?? 1;
  const currentXp = experienceData?.currentXp ?? 0;
  const xpForNextLevel = experienceData?.xpForNextLevel ?? 10;
  const progressPercent = experienceData?.progressPercent ?? 0;
  const unreadCount = notifications ?? 0;

  return (
    <CardContainer className={className}>
      <CardContent>
        <CircularProgress progress={progressPercent}>
          <AvatarWrapper>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: {
                    width: 32,
                    height: 32,
                  },
                  userButtonPopoverCard: {
                    pointerEvents: "auto",
                  },
                },
              }}
            />
          </AvatarWrapper>
        </CircularProgress>

        <DisplayName>{user?.firstName || user?.username || "User"}</DisplayName>

        <XpDisplay>
          <LevelText>lv {level}</LevelText>
          <XpNumbers>
            {currentXp}/{xpForNextLevel}
          </XpNumbers>
        </XpDisplay>

        <NotificationButton href="/lounge/notifications">
          <Bell size={14} />
          {unreadCount > 0 && (
            <NotificationBadge>{unreadCount > 99 ? "99+" : unreadCount}</NotificationBadge>
          )}
        </NotificationButton>
      </CardContent>
    </CardContainer>
  );
}

function LoadingState() {
  return (
    <LoadingContainer>
      <LoadingAvatar />
      <LoadingText />
    </LoadingContainer>
  );
}

function SignedOutState() {
  return (
    <SignedOutContainer>
      <SignedOutText>Sign in for a personalized experience</SignedOutText>
      <SignInButton mode="modal">
        <SignInBtn>Sign In</SignInBtn>
      </SignInButton>
    </SignedOutContainer>
  );
}

// Circular progress SVG component
function CircularProgress({ progress, children }: { progress: number; children: React.ReactNode }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <ProgressContainer>
      <ProgressSvg viewBox="0 0 48 48">
        {/* Background circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        {/* Progress circle */}
        <ProgressCircle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="url(#xpGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9074f2" />
            <stop offset="100%" stopColor="#b794f6" />
          </linearGradient>
        </defs>
      </ProgressSvg>
      <AvatarCenter>{children}</AvatarCenter>
    </ProgressContainer>
  );
}

// Styled Components
const CardContainer = styled.div`
  background: linear-gradient(135deg, rgba(144, 116, 242, 0.15) 0%, rgba(144, 116, 242, 0.05) 100%);
  border: 1px solid rgba(144, 116, 242, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
  margin-top: 50px;
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProgressContainer = styled.div`
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
`;

const ProgressSvg = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  transform: rotate(-90deg);
`;

const ProgressCircle = styled.circle`
  transition: stroke-dashoffset 0.5s ease;
`;

const AvatarCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const AvatarWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
`;

const XpDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  height: 28px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
`;

const XpNumbers = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  font-family: var(--font-mono);
  opacity: 0.7;
`;

const LevelText = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #9074f2;
  font-family: var(--font-mono);
`;

const DisplayName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-family: var(--font-sans);
`;

const NotificationButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: ${(props) => props.theme.textColor};
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  margin-left: auto;

  &:hover {
    background: rgba(144, 116, 242, 0.2);
    color: ${(props) => props.theme.contrast};
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e74c3c;
  color: white;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 8px;
  min-width: 14px;
  text-align: center;
`;

// Loading state styles
const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LoadingAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: ${pulse} 1.5s ease-in-out infinite;
  flex-shrink: 0;
`;

const LoadingText = styled.div`
  width: 80px;
  height: 16px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

// Signed out state styles
const SignedOutContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SignedOutText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
`;

const SignInBtn = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #9074f2, #7c5ce0);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4);
  }
`;

export default UserInfoCard;
