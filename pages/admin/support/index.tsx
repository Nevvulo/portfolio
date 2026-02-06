import {
  useQuery as useRQ,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Crown,
  FileText,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import Head from "next/head";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { getMe } from "@/src/db/client/me";
import {
  getQuickStats,
  listSuperLegends,
  getSubscriberVerification,
  getContentDeliveryStats,
  listNotifications,
  sendNotification,
} from "@/src/db/client/admin-support";

export const getServerSideProps = () => ({ props: {} });

type TabType = "subscribers" | "content" | "notifications";

export default function SupportAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("subscribers");
  const { data: me } = useRQ({
    queryKey: ["me"],
    queryFn: () => getMe(),
  });
  const isCreator = me?.isCreator ?? false;
  const isLoading = me === undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Super Legends" />
        <Container>
          <p>Loading...</p>
        </Container>
      </BlogView>
    );
  }

  if (!isCreator) {
    return (
      <>
        <Head>
          <title>Access Denied | Super Legends</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Super Legends" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access this page.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Super Legends | Admin</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Super Legends" />
        <AdminContainer>
          <Header>
            <HeaderTop>
              <Crown size={32} />
              <div>
                <Title>Ground Control</Title>
                <Text>Super Legend management dashboard</Text>
              </div>
            </HeaderTop>
          </Header>

          <QuickStats />

          <TabBar>
            <Tab $active={activeTab === "subscribers"} onClick={() => setActiveTab("subscribers")}>
              <Users size={16} />
              Subscribers
            </Tab>
            <Tab $active={activeTab === "content"} onClick={() => setActiveTab("content")}>
              <FileText size={16} />
              Content Delivery
            </Tab>
            <Tab
              $active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
            >
              <Bell size={16} />
              Notifications
            </Tab>
          </TabBar>

          <TabContent>
            {activeTab === "subscribers" && <SubscribersTab />}
            {activeTab === "content" && <ContentDeliveryTab />}
            {activeTab === "notifications" && <NotificationsTab />}
          </TabContent>
        </AdminContainer>
      </BlogView>
    </>
  );
}

// ============================================
// Quick Stats Component
// ============================================

function QuickStats() {
  const { data: stats } = useRQ({
    queryKey: ["admin", "support", "quickStats"],
    queryFn: () => getQuickStats(),
  });

  if (!stats) {
    return (
      <StatsBar>
        <StatCard>
          <StatValue>-</StatValue>
          <StatLabel>Total Subscribers</StatLabel>
        </StatCard>
      </StatsBar>
    );
  }

  return (
    <StatsBar>
      <StatCard>
        <StatValue>{stats.tier1 + stats.tier2}</StatValue>
        <StatLabel>Total Subscribers</StatLabel>
      </StatCard>
      <StatCard $accent="purple">
        <StatValue>{stats.tier1}</StatValue>
        <StatLabel>Super Legend I</StatLabel>
      </StatCard>
      <StatCard $accent="gold">
        <StatValue>{stats.tier2}</StatValue>
        <StatLabel>Super Legend II</StatLabel>
      </StatCard>
      <StatCard>
        <StatValue>{stats.total}</StatValue>
        <StatLabel>Total Users</StatLabel>
      </StatCard>
    </StatsBar>
  );
}

// ============================================
// Subscribers Tab
// ============================================

function SubscribersTab() {
  const [tierFilter, setTierFilter] = useState<"all" | "tier1" | "tier2">("all");
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const { data: subscribers } = useRQ({
    queryKey: ["admin", "support", "superLegends", tierFilter],
    queryFn: () => listSuperLegends(tierFilter === "all" ? undefined : tierFilter),
  });

  const { data: verification } = useRQ({
    queryKey: ["admin", "support", "verification", expandedUserId],
    queryFn: () => getSubscriberVerification(expandedUserId!),
    enabled: !!expandedUserId,
  });

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Subscribers</SectionTitle>
        <FilterDropdown value={tierFilter} onChange={(e) => setTierFilter(e.target.value as any)}>
          <option value="all">All Tiers</option>
          <option value="tier1">Super Legend I</option>
          <option value="tier2">Super Legend II</option>
        </FilterDropdown>
      </SectionHeader>

      {!subscribers ? (
        <LoadingText>Loading subscribers...</LoadingText>
      ) : subscribers.length === 0 ? (
        <EmptyText>No subscribers found</EmptyText>
      ) : (
        <SubscriberList>
          {subscribers.map((sub) => (
            <SubscriberCard key={sub.id}>
              <SubscriberMain
                onClick={() => setExpandedUserId(expandedUserId === sub.id ? null : sub.id)}
              >
                <SubscriberAvatar>
                  {sub.avatarUrl ? (
                    <Avatar src={sub.avatarUrl} alt={sub.displayName ?? ""} />
                  ) : (
                    <AvatarPlaceholder>{sub.displayName?.charAt(0) || "?"}</AvatarPlaceholder>
                  )}
                </SubscriberAvatar>
                <SubscriberInfo>
                  <SubscriberName>
                    {sub.displayName}
                    {sub.founderNumber && (
                      <FounderBadge>
                        <Crown size={10} /> #{sub.founderNumber}
                      </FounderBadge>
                    )}
                  </SubscriberName>
                  {sub.username && <SubscriberUsername>@{sub.username}</SubscriberUsername>}
                </SubscriberInfo>
                <TierBadge $tier={sub.clerkPlan === "super_legend_2" ? "tier2" : "tier1"}>
                  {sub.clerkPlan === "super_legend_2" ? "II" : "I"}
                </TierBadge>
                <ExpandIcon>
                  {expandedUserId === sub.id ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </ExpandIcon>
              </SubscriberMain>

              {expandedUserId === sub.id && verification && (
                <SubscriberDetails>
                  <ChecklistTitle>Deliverables Checklist</ChecklistTitle>
                  <Checklist>
                    <ChecklistItem $checked={!!verification.discordHighestRole}>
                      {verification.discordHighestRole ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Discord linked
                    </ChecklistItem>
                    <ChecklistItem $checked={verification.clerkPlanStatus === "active"}>
                      {verification.clerkPlanStatus === "active" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Plan status: {verification.clerkPlanStatus ?? "unknown"}
                      {verification.clerkPlan && (
                        <ChecklistDetail>
                          Plan: {verification.clerkPlan}
                        </ChecklistDetail>
                      )}
                    </ChecklistItem>
                    <ChecklistItem $checked={!!verification.tier}>
                      {verification.tier ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Tier: {verification.tier ?? "none"}
                    </ChecklistItem>
                    <ChecklistItem $checked={!!verification.supporterSyncedAt}>
                      {verification.supporterSyncedAt ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Last synced:{" "}
                      {verification.supporterSyncedAt
                        ? new Date(verification.supporterSyncedAt).toLocaleDateString()
                        : "Never"}
                    </ChecklistItem>
                  </Checklist>
                </SubscriberDetails>
              )}
            </SubscriberCard>
          ))}
        </SubscriberList>
      )}
    </Section>
  );
}

// ============================================
// Content Delivery Tab
// ============================================

function ContentDeliveryTab() {
  const { data: stats } = useRQ({
    queryKey: ["admin", "support", "contentDelivery"],
    queryFn: () => getContentDeliveryStats(),
  });

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Content Delivery</SectionTitle>
      </SectionHeader>

      {!stats ? (
        <LoadingText>Loading content stats...</LoadingText>
      ) : (
        <>
          <StatsBar>
            <StatCard>
              <StatValue>{stats.totalPublished}</StatValue>
              <StatLabel>Total Published</StatLabel>
            </StatCard>
            <StatCard $accent="purple">
              <StatValue>{stats.tier1Posts}</StatValue>
              <StatLabel>Tier I Posts</StatLabel>
            </StatCard>
            <StatCard $accent="gold">
              <StatValue>{stats.tier2Posts}</StatValue>
              <StatLabel>Tier II Posts</StatLabel>
            </StatCard>
            <StatCard $accent="green">
              <StatValue>{stats.vaultFiles}</StatValue>
              <StatLabel>Vault Files</StatLabel>
            </StatCard>
          </StatsBar>
        </>
      )}
    </Section>
  );
}

// ============================================
// Notifications Tab
// ============================================

function NotificationsTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetTier, setTargetTier] = useState<"tier1" | "tier2" | "all">("all");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: sentNotifications } = useRQ({
    queryKey: ["admin", "support", "notifications"],
    queryFn: () => listNotifications(),
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (data: { title: string; message: string; targetTier: string }) =>
      sendNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "notifications"] });
    },
  });

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please enter a title and message");
      return;
    }

    setSending(true);
    try {
      const result = await sendNotificationMutation.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        targetTier,
      });
      alert(`Notification sent to ${result.recipientCount} subscribers!`);
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Send Notification</SectionTitle>
      </SectionHeader>

      <NotificationForm>
        <FormGroup>
          <FormLabel>Title</FormLabel>
          <FormInput
            type="text"
            placeholder="e.g., New content available!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Message</FormLabel>
          <FormTextarea
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </FormGroup>

        <FormRow>
          <FormGroup>
            <FormLabel>Target Tier</FormLabel>
            <FilterDropdown
              value={targetTier}
              onChange={(e) => setTargetTier(e.target.value as any)}
            >
              <option value="all">All Super Legends</option>
              <option value="tier1">Tier I & II</option>
              <option value="tier2">Tier II Only</option>
            </FilterDropdown>
          </FormGroup>
        </FormRow>

        <SendButton onClick={handleSend} disabled={sending}>
          <Send size={16} />
          {sending ? "Sending..." : "Send Notification"}
        </SendButton>
      </NotificationForm>

      {/* History */}
      <HistorySection>
        <HistoryTitle>Sent Notifications</HistoryTitle>
        {!sentNotifications ? (
          <LoadingText>Loading history...</LoadingText>
        ) : sentNotifications.length === 0 ? (
          <EmptyText>No notifications sent yet</EmptyText>
        ) : (
          <NotificationHistory>
            {sentNotifications.map((notif) => (
              <NotificationHistoryItem key={notif.id}>
                <NotificationHistoryHeader>
                  <NotificationHistoryTitle>{notif.title}</NotificationHistoryTitle>
                  <NotificationHistoryMeta>
                    {new Date(notif.sentAt).toLocaleDateString()} &bull; {notif.recipientCount}{" "}
                    recipients
                  </NotificationHistoryMeta>
                </NotificationHistoryHeader>
                <NotificationHistoryMessage>{notif.message}</NotificationHistoryMessage>
                <NotificationHistoryTags>
                  <Tag $variant={notif.targetTier}>{notif.targetTier}</Tag>
                  {notif.discordWebhookSent && <Tag $variant="discord">Discord</Tag>}
                </NotificationHistoryTags>
              </NotificationHistoryItem>
            ))}
          </NotificationHistory>
        )}
      </HistorySection>
    </Section>
  );
}

// ============================================
// Styled Components
// ============================================

const Container = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const AdminContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  svg {
    color: #ffd700;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
`;

const Text = styled.p`
  margin: 4px 0 0;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

// Stats Bar
const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

const StatCard = styled.div<{ $accent?: string }>`
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  text-align: center;

  ${(props) =>
    props.$accent === "purple" &&
    `
    border-color: rgba(147, 51, 234, 0.3);
    background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, transparent 100%);
  `}

  ${(props) =>
    props.$accent === "gold" &&
    `
    border-color: rgba(255, 215, 0, 0.3);
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%);
  `}

  ${(props) =>
    props.$accent === "green" &&
    `
    border-color: rgba(34, 197, 94, 0.3);
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%);
  `}

  ${(props) =>
    props.$accent === "red" &&
    `
    border-color: rgba(239, 68, 68, 0.3);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%);
  `}
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${(props) => props.theme.contrast};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  margin-top: 4px;
`;

// Tabs
const TabBar = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 24px;
  overflow-x: auto;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${(props) => (props.$active ? props.theme.linkColor : "transparent")};
  color: ${(props) => (props.$active ? props.theme.contrast : props.theme.textColor)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: ${(props) => props.theme.contrast};
  }
`;

const TabContent = styled.div``;

// Section
const Section = styled.section`
  background: ${(props) => props.theme.postBackground};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

// Filter Dropdown
const FilterDropdown = styled.select`
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 13px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.linkColor};
  }
`;

// Loading/Empty states
const LoadingText = styled.p`
  text-align: center;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  padding: 40px;
`;

const EmptyText = styled.p`
  text-align: center;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  padding: 20px;
`;

// Subscriber List
const SubscriberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SubscriberCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  overflow: hidden;
`;

const SubscriberMain = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const SubscriberAvatar = styled.div`
  flex-shrink: 0;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => props.theme.linkColor}33;
  color: ${(props) => props.theme.linkColor};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
`;

const SubscriberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SubscriberName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;
`;

const SubscriberUsername = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const FounderBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
`;

const TierBadge = styled.span<{ $tier: "tier1" | "tier2" }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;

  ${(props) =>
    props.$tier === "tier1"
      ? `
    background: rgba(147, 51, 234, 0.2);
    color: #a855f7;
    border: 1px solid rgba(147, 51, 234, 0.3);
  `
      : `
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
    border: 1px solid rgba(255, 215, 0, 0.3);
  `}
`;

const ExpandIcon = styled.div`
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
`;

const SubscriberDetails = styled.div`
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.2);
`;

const ChecklistTitle = styled.h4`
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Checklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ChecklistItem = styled.div<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${(props) => (props.$checked ? props.theme.contrast : props.theme.textColor)};

  svg {
    color: ${(props) => (props.$checked ? "#22c55e" : "#ef4444")};
  }
`;

const ChecklistDetail = styled.span`
  font-size: 11px;
  opacity: 0.6;
  margin-left: auto;
`;

// History
const HistorySection = styled.div`
  margin-top: 24px;
`;

const HistoryTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

// Notifications
const NotificationForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FormInput = styled.input`
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.linkColor};
  }

  &::placeholder {
    color: ${(props) => props.theme.textColor};
    opacity: 0.5;
  }
`;

const FormTextarea = styled.textarea`
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.linkColor};
  }

  &::placeholder {
    color: ${(props) => props.theme.textColor};
    opacity: 0.5;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${(props) => props.theme.linkColor};
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const NotificationHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NotificationHistoryItem = styled.div`
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
`;

const NotificationHistoryHeader = styled.div`
  margin-bottom: 8px;
`;

const NotificationHistoryTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const NotificationHistoryMeta = styled.p`
  margin: 2px 0 0;
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const NotificationHistoryMessage = styled.p`
  margin: 0 0 10px;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
`;

const NotificationHistoryTags = styled.div`
  display: flex;
  gap: 6px;
`;

const Tag = styled.span<{ $variant: string }>`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;

  ${(props) =>
    props.$variant === "tier1"
      ? `background: rgba(147, 51, 234, 0.2); color: #a855f7;`
      : props.$variant === "tier2"
        ? `background: rgba(255, 215, 0, 0.2); color: #ffd700;`
        : props.$variant === "all"
          ? `background: rgba(59, 130, 246, 0.2); color: #3b82f6;`
          : props.$variant === "discord"
            ? `background: rgba(88, 101, 242, 0.2); color: #5865f2;`
            : `background: rgba(255, 255, 255, 0.1); color: inherit;`}
`;
