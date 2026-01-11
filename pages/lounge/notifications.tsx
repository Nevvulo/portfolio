import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";
import { useQuery, useMutation, useAction } from "convex/react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellOff,
  AtSign,
  Reply,
  Gift,
  MessageCircle,
  Sparkles,
  Trophy,
  Check,
  CheckCheck,
  Trash2,
  Heart,
  UserPlus,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { LoungeLayout } from "../../components/lounge/layout/LoungeLayout";
import { useTierAccess } from "../../hooks/lounge/useTierAccess";
import { LOUNGE_COLORS } from "../../constants/lounge";
import type { Id } from "../../convex/_generated/dataModel";

export const getServerSideProps = () => ({ props: {} });

type NotificationType =
  | "mention"
  | "reply"
  | "new_content"
  | "reward"
  | "giveaway_win"
  | "channel_message"
  | "comment_reply"
  | "collaborator_added"
  | "comment_reaction"
  | "feed_reply"
  | "feed_reaction";

interface Notification {
  _id: Id<"notifications">;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number;
  channelId?: Id<"channels">;
  referenceType?: "message" | "contentPost" | "reward" | "blogComment" | "blogPost" | "feedPost";
  referenceId?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  mention: AtSign,
  reply: Reply,
  new_content: Sparkles,
  reward: Gift,
  giveaway_win: Trophy,
  channel_message: MessageCircle,
  comment_reply: Reply,
  collaborator_added: UserPlus,
  comment_reaction: Heart,
  feed_reply: Reply,
  feed_reaction: Heart,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  mention: LOUNGE_COLORS.tier2,
  reply: LOUNGE_COLORS.tier1,
  new_content: "#22c55e",
  reward: "#f97316",
  giveaway_win: "#eab308",
  channel_message: "rgba(255, 255, 255, 0.5)",
  comment_reply: "#60a5fa",      // Blue
  collaborator_added: "#34d399", // Green
  comment_reaction: "#f472b6",   // Pink
  feed_reply: "#a78bfa",         // Purple
  feed_reaction: "#fb923c",      // Orange
};

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [userReady, setUserReady] = useState(false);

  const { isLoading, user, tier, displayName, avatarUrl } = useTierAccess();

  const getOrCreateUser = useAction(api.users.getOrCreateUser);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const removeNotification = useMutation(api.notifications.remove);
  const clearAll = useMutation(api.notifications.clearAll);

  const notifications = useQuery(
    api.notifications.list,
    userReady ? { limit: 100 } : "skip"
  ) as Notification[] | undefined;

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    userReady ? {} : "skip"
  ) as number | undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  // SECURITY: Server fetches verified discordId and tier from Clerk
  useEffect(() => {
    if (!mounted || isLoading || !user || userReady) return;

    getOrCreateUser({
      displayName: displayName || "Anonymous",
      avatarUrl: avatarUrl,
    })
      .then(() => setUserReady(true))
      .catch(() => setUserReady(true));
  }, [mounted, isLoading, user, displayName, avatarUrl, userReady, getOrCreateUser]);

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleRemove = async (notificationId: Id<"notifications">) => {
    try {
      await removeNotification({ notificationId });
    } catch (error) {
      console.error("Failed to remove notification:", error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Clear all notifications?")) {
      try {
        await clearAll();
      } catch (error) {
        console.error("Failed to clear all:", error);
      }
    }
  };

  if (isLoading || !userReady) {
    return (
      <LoungeLayout channelName="Notifications" customIcon={Bell}>
        <Container>
          <LoadingContainer>
            <LoadingText>Loading notifications...</LoadingText>
          </LoadingContainer>
        </Container>
      </LoungeLayout>
    );
  }

  const unreadNotifications = notifications?.filter((n) => !n.isRead) ?? [];
  const readNotifications = notifications?.filter((n) => n.isRead) ?? [];
  const hasNotifications = notifications && notifications.length > 0;

  return (
    <>
      <Head>
        <title>Notifications | nevulounge</title>
      </Head>
      <LoungeLayout channelName="Notifications" customIcon={Bell}>
        <Container>
          <ContentWrapper>
          <Header>
            <HeaderTitle>
              <Bell size={24} />
              Notifications
              {unreadCount !== undefined && unreadCount > 0 && (
                <UnreadBadge>{unreadCount}</UnreadBadge>
              )}
            </HeaderTitle>
            {hasNotifications && (
              <HeaderActions>
                {unreadNotifications.length > 0 && (
                  <ActionButton onClick={handleMarkAllAsRead}>
                    <CheckCheck size={16} />
                    Mark all read
                  </ActionButton>
                )}
                <ActionButton onClick={handleClearAll} $danger>
                  <Trash2 size={16} />
                  Clear all
                </ActionButton>
              </HeaderActions>
            )}
          </Header>

          {hasNotifications ? (
            <NotificationList>
              {/* Unread notifications */}
              {unreadNotifications.length > 0 && (
                <Section>
                  <SectionHeader>New</SectionHeader>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onMarkRead={handleMarkAsRead}
                      onRemove={handleRemove}
                    />
                  ))}
                </Section>
              )}

              {/* Read notifications */}
              {readNotifications.length > 0 && (
                <Section>
                  <SectionHeader>Earlier</SectionHeader>
                  {readNotifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onMarkRead={handleMarkAsRead}
                      onRemove={handleRemove}
                    />
                  ))}
                </Section>
              )}
            </NotificationList>
          ) : (
            <EmptyState>
              <BellOff size={48} />
              <EmptyTitle>No notifications</EmptyTitle>
              <EmptyText>
                When you receive mentions, replies, or rewards, they'll appear here.
              </EmptyText>
            </EmptyState>
          )}
          </ContentWrapper>
        </Container>
      </LoungeLayout>
    </>
  );
}

// Notification Item Component
function NotificationItem({
  notification,
  onMarkRead,
  onRemove,
}: {
  notification: Notification;
  onMarkRead: (id: Id<"notifications">) => void;
  onRemove: (id: Id<"notifications">) => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const color = NOTIFICATION_COLORS[notification.type];

  const timeAgo = formatDistanceToNow(notification.createdAt, { addSuffix: true });

  // Determine link based on notification type
  const getLink = () => {
    if (notification.type === "reward") return "/lounge/rewards";
    if (notification.channelId) return `/lounge`; // Could link to specific channel

    // Blog/content notifications
    if (notification.type === "comment_reply" || notification.type === "comment_reaction") {
      // referenceId is the comment ID, would need slug lookup for full link
      // For now, link to learn page (could be enhanced later)
      return "/learn";
    }
    if (notification.type === "collaborator_added") {
      // referenceId is the post ID
      return "/learn";
    }

    // Feed notifications
    if (notification.type === "feed_reply" || notification.type === "feed_reaction") {
      return "/lounge"; // Feed is in the lounge
    }

    return null;
  };

  const link = getLink();
  const Wrapper = link ? LinkWrapper : "div";

  return (
    <NotificationCard $isRead={notification.isRead}>
      <IconWrapper $color={color}>
        <Icon size={18} />
      </IconWrapper>
      <Content as={Wrapper} {...(link ? { href: link } : {})}>
        <Title $isRead={notification.isRead}>{notification.title}</Title>
        <Body>{notification.body}</Body>
        <Time>{timeAgo}</Time>
      </Content>
      <Actions>
        {!notification.isRead && (
          <SmallButton onClick={() => onMarkRead(notification._id)} title="Mark as read">
            <Check size={14} />
          </SmallButton>
        )}
        <SmallButton onClick={() => onRemove(notification._id)} title="Remove" $danger>
          <Trash2 size={14} />
        </SmallButton>
      </Actions>
    </NotificationCard>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 2.5rem;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 300px;
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  letter-spacing: -0.01em;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-sans);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0;
`;

const UnreadBadge = styled.span`
  padding: 3px 10px;
  background: ${LOUNGE_COLORS.tier1};
  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: ${(props) => (props.$danger ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.04)")};
  border: 1px solid ${(props) => (props.$danger ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.08)")};
  border-radius: 8px;
  color: ${(props) => (props.$danger ? "#f87171" : "rgba(255, 255, 255, 0.7)")};
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$danger ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.08)")};
    border-color: ${(props) => (props.$danger ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.12)")};
  }
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionHeader = styled.h2`
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 0.5rem;
  padding-left: 0.25rem;
`;

const NotificationCard = styled.div<{ $isRead: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: ${(props) =>
    props.$isRead ? "rgba(255, 255, 255, 0.02)" : "rgba(144, 116, 242, 0.04)"};
  border: 1px solid ${(props) =>
    props.$isRead ? "rgba(255, 255, 255, 0.04)" : "rgba(144, 116, 242, 0.12)"};
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$isRead ? "rgba(255, 255, 255, 0.04)" : "rgba(144, 116, 242, 0.06)"};
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  background: ${(props) => props.$color}15;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.$color};
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const LinkWrapper = styled(Link)`
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: inherit;
`;

const Title = styled.h3<{ $isRead: boolean }>`
  font-family: var(--font-sans);
  font-size: 0.95rem;
  font-weight: ${(props) => (props.$isRead ? 500 : 600)};
  letter-spacing: -0.01em;
  color: ${(props) => (props.$isRead ? "rgba(255, 255, 255, 0.6)" : "#fff")};
  margin: 0 0 0.375rem;
`;

const Body = styled.p`
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 0.5rem;
  line-height: 1.5;
  letter-spacing: -0.01em;
`;

const Time = styled.span`
  font-family: var(--font-sans);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: -0.01em;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${NotificationCard}:hover & {
    opacity: 1;
  }

  @media (max-width: 768px) {
    opacity: 1;
  }
`;

const SmallButton = styled.button<{ $danger?: boolean }>`
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${(props) => (props.$danger ? "rgba(248, 113, 113, 0.8)" : "rgba(255, 255, 255, 0.4)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.$danger ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.08)"};
    color: ${(props) => (props.$danger ? "#f87171" : "#fff")};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.25);
`;

const EmptyTitle = styled.h2`
  font-family: var(--font-sans);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.5);
  margin: 1.25rem 0 0.5rem;
`;

const EmptyText = styled.p`
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
  max-width: 320px;
  line-height: 1.5;
  letter-spacing: -0.01em;
`;
