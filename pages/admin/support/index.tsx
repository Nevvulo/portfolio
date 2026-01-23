import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Crown,
  Download,
  ExternalLink,
  FileText,
  Gift,
  MessageSquare,
  Package,
  RefreshCw,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useTierAccess } from "../../../hooks/lounge/useTierAccess";

export const getServerSideProps = () => ({ props: {} });

type TabType = "subscribers" | "content" | "lootbox" | "notifications";

export default function SupportAdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("subscribers");
  const { isLoading, isCreator } = useTierAccess();

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
            <Tab $active={activeTab === "lootbox"} onClick={() => setActiveTab("lootbox")}>
              <Gift size={16} />
              Monthly Boxes
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
            {activeTab === "lootbox" && <LootBoxTab />}
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
  const stats = useQuery(api.supportAdmin.getQuickStats);

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
        <StatValue>{stats.totalSubscribers}</StatValue>
        <StatLabel>Total Subscribers</StatLabel>
      </StatCard>
      <StatCard $accent="purple">
        <StatValue>{stats.tier1Count}</StatValue>
        <StatLabel>Super Legend I</StatLabel>
      </StatCard>
      <StatCard $accent="gold">
        <StatValue>{stats.tier2Count}</StatValue>
        <StatLabel>Super Legend II</StatLabel>
      </StatCard>
      <StatCard>
        <StatValue>{stats.discordLinkedPercent}%</StatValue>
        <StatLabel>Discord Linked</StatLabel>
      </StatCard>
      <StatCard $accent={stats.tier2LootDelivered ? "green" : "red"}>
        <StatValue>
          {stats.tier2LootDelivered ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        </StatValue>
        <StatLabel>{stats.currentMonth} Loot</StatLabel>
      </StatCard>
    </StatsBar>
  );
}

// ============================================
// Subscribers Tab
// ============================================

function SubscribersTab() {
  const [tierFilter, setTierFilter] = useState<"all" | "tier1" | "tier2">("all");
  const [expandedUserId, setExpandedUserId] = useState<Id<"users"> | null>(null);

  const subscribers = useQuery(api.supportAdmin.listSuperLegends, {
    tierFilter,
    limit: 50,
  });

  const verification = useQuery(
    api.supportAdmin.getSubscriberVerification,
    expandedUserId ? { userId: expandedUserId } : "skip",
  );

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
      ) : subscribers.subscribers.length === 0 ? (
        <EmptyText>No subscribers found</EmptyText>
      ) : (
        <SubscriberList>
          {subscribers.subscribers.map((sub) => (
            <SubscriberCard key={sub._id}>
              <SubscriberMain
                onClick={() => setExpandedUserId(expandedUserId === sub._id ? null : sub._id)}
              >
                <SubscriberAvatar>
                  {sub.avatarUrl ? (
                    <Avatar src={sub.avatarUrl} alt={sub.displayName} />
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
                  {expandedUserId === sub._id ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </ExpandIcon>
              </SubscriberMain>

              {expandedUserId === sub._id && verification && (
                <SubscriberDetails>
                  <ChecklistTitle>Deliverables Checklist</ChecklistTitle>
                  <Checklist>
                    <ChecklistItem $checked={verification.verification.discordLinked}>
                      {verification.verification.discordLinked ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Discord linked
                      {verification.verification.discordUsername && (
                        <ChecklistDetail>
                          @{verification.verification.discordUsername}
                        </ChecklistDetail>
                      )}
                    </ChecklistItem>
                    <ChecklistItem $checked={verification.verification.badgeVerified}>
                      {verification.verification.badgeVerified ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Badge verified
                      {!verification.verification.badgeVerified && (
                        <ChecklistDetail>
                          Expected: {verification.verification.expectedTier}, Actual:{" "}
                          {verification.verification.actualTier}
                        </ChecklistDetail>
                      )}
                    </ChecklistItem>
                    <ChecklistItem $checked={true}>
                      <CheckCircle2 size={14} />
                      Vault downloads: {verification.analytics.vaultDownloads}
                    </ChecklistItem>
                    <ChecklistItem $checked={verification.verification.showOnCredits}>
                      {verification.verification.showOnCredits ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Credits opt-in: {verification.verification.showOnCredits ? "Yes" : "No"}
                    </ChecklistItem>
                  </Checklist>
                </SubscriberDetails>
              )}
            </SubscriberCard>
          ))}
        </SubscriberList>
      )}

      {subscribers && subscribers.hasMore && (
        <LoadMoreText>
          Showing {subscribers.subscribers.length} of {subscribers.totalCount}
        </LoadMoreText>
      )}
    </Section>
  );
}

// ============================================
// Content Delivery Tab
// ============================================

function ContentDeliveryTab() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  const stats = useQuery(api.supportAdmin.getContentDeliveryStats, {
    month: selectedMonth,
  });

  // Generate month options for the last 12 months
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    monthOptions.push({ value, label });
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Content Delivery</SectionTitle>
        <FilterDropdown value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterDropdown>
      </SectionHeader>

      {!stats ? (
        <LoadingText>Loading content stats...</LoadingText>
      ) : (
        <>
          {/* Quota Progress */}
          <QuotaSection>
            <QuotaCard>
              <QuotaHeader>
                <QuotaTier $tier="tier1">Tier I</QuotaTier>
                <QuotaCount>
                  {stats.quotaProgress.tier1.totalDelivered} / {stats.quotaProgress.tier1.quota}
                </QuotaCount>
              </QuotaHeader>
              <QuotaBar>
                <QuotaFill
                  $percent={Math.min(
                    100,
                    (stats.quotaProgress.tier1.totalDelivered / stats.quotaProgress.tier1.quota) *
                      100,
                  )}
                  $tier="tier1"
                />
              </QuotaBar>
              <QuotaDetails>
                <span>Early Drops: {stats.quotaProgress.tier1.earlyDrops}</span>
                <span>Special Access: {stats.quotaProgress.tier1.specialAccess}</span>
              </QuotaDetails>
            </QuotaCard>

            <QuotaCard>
              <QuotaHeader>
                <QuotaTier $tier="tier2">Tier II</QuotaTier>
                <QuotaCount>
                  {stats.quotaProgress.tier2.totalDelivered} / {stats.quotaProgress.tier2.quota}
                </QuotaCount>
              </QuotaHeader>
              <QuotaBar>
                <QuotaFill
                  $percent={Math.min(
                    100,
                    (stats.quotaProgress.tier2.totalDelivered / stats.quotaProgress.tier2.quota) *
                      100,
                  )}
                  $tier="tier2"
                />
              </QuotaBar>
              <QuotaDetails>
                <span>Early Drops: {stats.quotaProgress.tier2.earlyDrops}</span>
                <span>Special Access: {stats.quotaProgress.tier2.specialAccess}</span>
              </QuotaDetails>
            </QuotaCard>
          </QuotaSection>

          {/* Early Drops Section */}
          <ContentSection>
            <ContentSectionHeader>
              <MessageSquare size={18} />
              Early Drops (Lounge)
            </ContentSectionHeader>
            <ContentSectionDesc>Posts in tier-locked announcement channels</ContentSectionDesc>
            {stats.earlyDrops.recent.length === 0 ? (
              <EmptyText>No early drops this month</EmptyText>
            ) : (
              <ContentList>
                {stats.earlyDrops.recent.map((drop) => (
                  <ContentItem key={drop.messageId}>
                    <ContentItemIcon>
                      <MessageSquare size={14} />
                    </ContentItemIcon>
                    <ContentItemInfo>
                      <ContentItemTitle>#{drop.channelName}</ContentItemTitle>
                      <ContentItemDesc>{drop.content}...</ContentItemDesc>
                    </ContentItemInfo>
                    <ContentItemDate>
                      {new Date(drop.createdAt).toLocaleDateString()}
                    </ContentItemDate>
                  </ContentItem>
                ))}
              </ContentList>
            )}
          </ContentSection>

          {/* Special Access Section */}
          <ContentSection>
            <ContentSectionHeader>
              <FileText size={18} />
              Special Access (/learn)
            </ContentSectionHeader>
            <ContentSectionDesc>Tier-locked articles and videos</ContentSectionDesc>
            {stats.specialAccess.posts.length === 0 ? (
              <EmptyText>No special access posts this month</EmptyText>
            ) : (
              <ContentList>
                {stats.specialAccess.posts.map((post) => (
                  <ContentItem
                    key={post._id}
                    as={Link}
                    href={`/learn/${post.slug}`}
                    target="_blank"
                  >
                    <ContentItemIcon>
                      <FileText size={14} />
                    </ContentItemIcon>
                    <ContentItemInfo>
                      <ContentItemTitle>{post.title}</ContentItemTitle>
                      <ContentItemDesc>
                        {post.contentType} &bull; {post.visibility}
                      </ContentItemDesc>
                    </ContentItemInfo>
                    <ContentItemDate>
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "-"}
                    </ContentItemDate>
                    <ExternalLink size={14} style={{ opacity: 0.5 }} />
                  </ContentItem>
                ))}
              </ContentList>
            )}
          </ContentSection>
        </>
      )}
    </Section>
  );
}

// ============================================
// Loot Box Tab
// ============================================

function LootBoxTab() {
  const status = useQuery(api.supportAdmin.getLootBoxStatus, {});

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Monthly Loot Boxes</SectionTitle>
        <TierBadge $tier="tier2">Tier II Only</TierBadge>
      </SectionHeader>

      {!status ? (
        <LoadingText>Loading loot box status...</LoadingText>
      ) : (
        <>
          {/* Current Month Status */}
          <LootStatusCard $status={status.status} $overdue={status.isOverdue}>
            <LootStatusHeader>
              <LootStatusIcon>
                {status.status === "delivered" ? (
                  <CheckCircle2 size={24} />
                ) : status.isOverdue ? (
                  <AlertTriangle size={24} />
                ) : (
                  <Package size={24} />
                )}
              </LootStatusIcon>
              <LootStatusInfo>
                <LootStatusTitle>
                  {new Date(status.currentMonth + "-01").toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </LootStatusTitle>
                <LootStatusDesc>
                  {status.status === "delivered"
                    ? `Delivered on ${status.completedDrop?.processedAt ? new Date(status.completedDrop.processedAt).toLocaleDateString() : "unknown"}`
                    : status.status === "pending"
                      ? "Scheduled for delivery"
                      : status.isOverdue
                        ? `${status.daysOverdue} days overdue!`
                        : "Not yet scheduled"}
                </LootStatusDesc>
              </LootStatusInfo>
              {status.completedDrop && (
                <LootStatusCount>
                  {status.completedDrop.processedCount} / {status.completedDrop.totalCount}{" "}
                  delivered
                </LootStatusCount>
              )}
            </LootStatusHeader>

            {status.isOverdue && (
              <OverdueWarning>
                <AlertTriangle size={16} />
                Super Legends have not received their monthly box!
                <Link href="/admin/rewards">
                  <DeliverButton>
                    <Gift size={14} />
                    Deliver Now
                  </DeliverButton>
                </Link>
              </OverdueWarning>
            )}
          </LootStatusCard>

          {/* History */}
          <HistorySection>
            <HistoryTitle>Delivery History</HistoryTitle>
            <HistoryList>
              {status.history.map((item) => (
                <HistoryItem key={item.month} $status={item.status}>
                  <HistoryMonth>
                    {new Date(item.month + "-01").toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </HistoryMonth>
                  <HistoryStatus $status={item.status}>
                    {item.status === "completed" ? (
                      <>
                        <CheckCircle2 size={12} /> Delivered
                      </>
                    ) : item.status === "pending" ? (
                      <>
                        <RefreshCw size={12} /> Pending
                      </>
                    ) : item.status === "failed" ? (
                      <>
                        <XCircle size={12} /> Failed
                      </>
                    ) : (
                      item.status
                    )}
                  </HistoryStatus>
                  {item.processedCount !== undefined && (
                    <HistoryCount>
                      {item.processedCount}/{item.totalCount}
                    </HistoryCount>
                  )}
                </HistoryItem>
              ))}
            </HistoryList>
          </HistorySection>
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
  const [sendToDiscord, setSendToDiscord] = useState(false);
  const [sending, setSending] = useState(false);

  const sentNotifications = useQuery(api.supportAdmin.listNotifications, { limit: 20 });
  const sendNotification = useMutation(api.supportAdmin.sendSubscriberNotification);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please enter a title and message");
      return;
    }

    setSending(true);
    try {
      const result = await sendNotification({
        title: title.trim(),
        message: message.trim(),
        targetTier,
        sendToDiscord,
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

          <FormGroup>
            <FormLabel>&nbsp;</FormLabel>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={sendToDiscord}
                onChange={(e) => setSendToDiscord(e.target.checked)}
              />
              Also send to Discord webhook
            </CheckboxLabel>
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
              <NotificationHistoryItem key={notif._id}>
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

const LoadMoreText = styled.p`
  text-align: center;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
  font-size: 12px;
  margin-top: 16px;
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

// Quota Section
const QuotaSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const QuotaCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
`;

const QuotaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const QuotaTier = styled.span<{ $tier: "tier1" | "tier2" }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.$tier === "tier1" ? "#a855f7" : "#ffd700")};
`;

const QuotaCount = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const QuotaBar = styled.div`
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const QuotaFill = styled.div<{ $percent: number; $tier: "tier1" | "tier2" }>`
  height: 100%;
  width: ${(props) => props.$percent}%;
  background: ${(props) => (props.$tier === "tier1" ? "#a855f7" : "#ffd700")};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const QuotaDetails = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

// Content Section
const ContentSection = styled.div`
  margin-top: 24px;
`;

const ContentSectionHeader = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const ContentSectionDesc = styled.p`
  margin: 0 0 12px;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
`;

const ContentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ContentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const ContentItemIcon = styled.div`
  color: ${(props) => props.theme.linkColor};
  opacity: 0.7;
`;

const ContentItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContentItemTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContentItemDesc = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContentItemDate = styled.div`
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.5;
  white-space: nowrap;
`;

// Loot Box
const LootStatusCard = styled.div<{ $status: string; $overdue: boolean }>`
  background: ${(props) =>
    props.$overdue
      ? "rgba(239, 68, 68, 0.1)"
      : props.$status === "delivered"
        ? "rgba(34, 197, 94, 0.1)"
        : "rgba(255, 255, 255, 0.02)"};
  border: 1px solid
    ${(props) =>
      props.$overdue
        ? "rgba(239, 68, 68, 0.3)"
        : props.$status === "delivered"
          ? "rgba(34, 197, 94, 0.3)"
          : "rgba(255, 255, 255, 0.05)"};
  border-radius: 12px;
  padding: 20px;
`;

const LootStatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LootStatusIcon = styled.div`
  color: ${(props) => props.theme.linkColor};
`;

const LootStatusInfo = styled.div`
  flex: 1;
`;

const LootStatusTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
`;

const LootStatusDesc = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
`;

const LootStatusCount = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
`;

const OverdueWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.15);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
`;

const DeliverButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 8px 14px;
  background: #ef4444;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #dc2626;
  }
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

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const HistoryItem = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
`;

const HistoryMonth = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.theme.contrast};
  min-width: 80px;
`;

const HistoryStatus = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${(props) =>
    props.$status === "completed"
      ? "#22c55e"
      : props.$status === "failed"
        ? "#ef4444"
        : props.theme.textColor};
`;

const HistoryCount = styled.div`
  margin-left: auto;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.6;
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

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  cursor: pointer;
  height: 42px;

  input {
    width: 16px;
    height: 16px;
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
