import Head from "next/head";
import Link from "next/link";
import styled from "styled-components";
import { useQuery, useMutation } from "convex/react";
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
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { LoungeLayout } from "../../components/lounge/layout/LoungeLayout";
import { useTierAccess } from "../../hooks/lounge/useTierAccess";
import { LOUNGE_COLORS } from "../../constants/lounge";
import type { Id } from "../../convex/_generated/dataModel";

export const getServerSideProps = () => ({ props: {} });

type NotificationType = "mention" | "reply" | "new_content" | "reward" | "giveaway_win" | "channel_message";

interface Notification {
  _id: Id<"notifications">;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number;
  channelId?: Id<"channels">;
  referenceType?: "message" | "contentPost" | "reward";
  referenceId?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  mention: AtSign,
  reply: Reply,
  new_content: Sparkles,
  reward: Gift,
  giveaway_win: Trophy,
  channel_message: MessageCircle,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  mention: LOUNGE_COLORS.tier2,
  reply: LOUNGE_COLORS.tier1,
  new_content: "#22c55e",
  reward: "#f97316",
  giveaway_win: "#eab308",
  channel_message: "rgba(255, 255, 255, 0.5)",
};

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [userReady, setUserReady] = useState(false);

  const { isLoading, user, tier, displayName, avatarUrl } = useTierAccess();

  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
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

  useEffect(() => {
    if (!mounted || isLoading || !user || !tier || userReady) return;

    const discordAccount = user.externalAccounts?.find(
      (account) => account.provider === "discord"
    );
    const discordId =
      (discordAccount as any)?.providerUserId ||
      (discordAccount as any)?.externalId;

    getOrCreateUser({
      displayName: displayName || "Anonymous",
      avatarUrl: avatarUrl,
      tier: tier,
      discordId: discordId,
    })
      .then(() => setUserReady(true))
      .catch(() => setUserReady(true));
  }, [mounted, isLoading, user, tier, displayName, avatarUrl, userReady, getOrCreateUser]);

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
          <LoadingText>Loading notifications...</LoadingText>
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
  padding: 1.5rem;
  max-width: 700px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const HeaderTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const UnreadBadge = styled.span`
  padding: 2px 8px;
  background: #ed4245;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 10px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${(props) => (props.$danger ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.05)")};
  border: 1px solid ${(props) => (props.$danger ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 6px;
  color: ${(props) => (props.$danger ? "#ef4444" : "rgba(255, 255, 255, 0.7)")};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${(props) => (props.$danger ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)")};
  }
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Section = styled.div``;

const SectionHeader = styled.h2`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 0.75rem;
`;

const NotificationCard = styled.div<{ $isRead: boolean }>`
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: ${(props) =>
    props.$isRead ? "rgba(255, 255, 255, 0.02)" : "rgba(144, 116, 242, 0.05)"};
  border: 1px solid ${(props) =>
    props.$isRead ? "rgba(255, 255, 255, 0.05)" : "rgba(144, 116, 242, 0.15)"};
  border-radius: 10px;
  transition: all 0.15s;

  &:hover {
    background: ${(props) =>
      props.$isRead ? "rgba(255, 255, 255, 0.04)" : "rgba(144, 116, 242, 0.08)"};
  }
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  background: ${(props) => props.$color}22;
  border-radius: 8px;
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
  font-size: 0.9rem;
  font-weight: ${(props) => (props.$isRead ? 500 : 600)};
  color: ${(props) => (props.$isRead ? "rgba(255, 255, 255, 0.7)" : "#fff")};
  margin: 0 0 0.25rem;
`;

const Body = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 0.25rem;
  line-height: 1.4;
`;

const Time = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s;

  ${NotificationCard}:hover & {
    opacity: 1;
  }
`;

const SmallButton = styled.button<{ $danger?: boolean }>`
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: ${(props) => (props.$danger ? "#ef4444" : "rgba(255, 255, 255, 0.5)")};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${(props) =>
      props.$danger ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)"};
    color: ${(props) => (props.$danger ? "#ef4444" : "#fff")};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
`;

const EmptyTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 1rem 0 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  max-width: 300px;
`;
