import Head from "next/head";
import styled from "styled-components";
import { useQuery, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { LoungeLayout } from "../../components/lounge/layout/LoungeLayout";
import { useTierAccess } from "../../hooks/lounge/useTierAccess";
import { useContentFormStore } from "../../hooks/lounge/useContentFormStore";
import { LOUNGE_COLORS } from "../../constants/lounge";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Hash,
  Ban,
  UserX,
  Crown,
  Star,
  Plus,
  Edit2,
  Trash2,
  Send,
  Link,
  RefreshCw,
  Gift,
  Package,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { RARITY_COLORS, REWARD_TYPES } from "../../constants/lounge";
import type { ItemRarity } from "../../types/lounge";
import type { Id } from "../../convex/_generated/dataModel";

export const getServerSideProps = () => ({ props: {} });

type TabType = "analytics" | "channels" | "users" | "announcements" | "discord" | "rewards";

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("analytics");
  const { isLoading, isCreator, user, tier, displayName, avatarUrl } = useTierAccess();

  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading || !user || !tier || userReady) return;

    const discordAccount = user.externalAccounts?.find(
      (account) => account.provider === "discord"
    );
    // Clerk stores Discord user ID in providerUserId (preferred) or externalId
    const discordId = (discordAccount as any)?.providerUserId || (discordAccount as any)?.externalId;

    getOrCreateUser({
      displayName: displayName || "Anonymous",
      avatarUrl: avatarUrl,
      tier: tier,
      discordId: discordId,
    }).then(() => setUserReady(true)).catch(() => setUserReady(true));
  }, [mounted, isLoading, user, tier, displayName, avatarUrl, userReady, getOrCreateUser]);

  if (isLoading || !userReady) {
    return (
      <LoungeLayout>
        <Container><p>Loading...</p></Container>
      </LoungeLayout>
    );
  }

  if (!isCreator) {
    return (
      <>
        <Head><title>Access Denied | nevulounge</title></Head>
        <LoungeLayout>
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access the admin panel.</Text>
          </Container>
        </LoungeLayout>
      </>
    );
  }

  return (
    <>
      <Head><title>Admin Panel | nevulounge</title></Head>
      <LoungeLayout>
        <AdminContainer>
          <Header>
            <Title>Admin Panel</Title>
            <Text>Manage your lounge</Text>
          </Header>

          <TabBar>
            <Tab $active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>
              <TrendingUp size={16} /> Analytics
            </Tab>
            <Tab $active={activeTab === "channels"} onClick={() => setActiveTab("channels")}>
              <Hash size={16} /> Channels
            </Tab>
            <Tab $active={activeTab === "users"} onClick={() => setActiveTab("users")}>
              <Users size={16} /> Users
            </Tab>
            <Tab $active={activeTab === "announcements"} onClick={() => setActiveTab("announcements")}>
              <MessageSquare size={16} /> Announce
            </Tab>
            <Tab $active={activeTab === "discord"} onClick={() => setActiveTab("discord")}>
              <Link size={16} /> Discord
            </Tab>
            <Tab $active={activeTab === "rewards"} onClick={() => setActiveTab("rewards")}>
              <Gift size={16} /> Rewards
            </Tab>
          </TabBar>

          <TabContent>
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "channels" && <ChannelsTab />}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "announcements" && <AnnouncementsTab />}
            {activeTab === "discord" && <DiscordTab />}
            {activeTab === "rewards" && <RewardsTab />}
          </TabContent>
        </AdminContainer>
      </LoungeLayout>
    </>
  );
}

// Analytics Tab
function AnalyticsTab() {
  const analytics = useQuery(api.users.getAnalytics);

  if (!analytics) return <Loading>Loading analytics...</Loading>;

  return (
    <div>
      <SectionTitle>Overview</SectionTitle>
      <StatsGrid>
        <StatCard>
          <StatIcon><Users size={24} /></StatIcon>
          <StatValue>{analytics.users.total}</StatValue>
          <StatLabel>Total Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $color={LOUNGE_COLORS.tier1}><Star size={24} /></StatIcon>
          <StatValue>{analytics.users.tier1}</StatValue>
          <StatLabel>Tier 1</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $color={LOUNGE_COLORS.tier2}><Crown size={24} /></StatIcon>
          <StatValue>{analytics.users.tier2}</StatValue>
          <StatLabel>Tier 2 (VIP)</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $color="#3ba55d"><Users size={24} /></StatIcon>
          <StatValue>{analytics.users.activeToday}</StatValue>
          <StatLabel>Active Today</StatLabel>
        </StatCard>
      </StatsGrid>

      <SectionTitle>Messages</SectionTitle>
      <StatsGrid>
        <StatCard>
          <StatValue>{analytics.messages.total}</StatValue>
          <StatLabel>Total Messages</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{analytics.messages.today}</StatValue>
          <StatLabel>Today</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{analytics.messages.week}</StatValue>
          <StatLabel>This Week</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{analytics.messages.month}</StatValue>
          <StatLabel>This Month</StatLabel>
        </StatCard>
      </StatsGrid>

      <SectionTitle>Top Contributors</SectionTitle>
      <ContributorsList>
        {analytics.topContributors.map((contrib, i) => (
          <ContributorItem key={contrib.userId}>
            <ContributorRank>#{i + 1}</ContributorRank>
            <ContributorAvatar src={contrib.avatarUrl} />
            <ContributorName>{contrib.displayName}</ContributorName>
            <ContributorCount>{contrib.messageCount} msgs</ContributorCount>
          </ContributorItem>
        ))}
        {analytics.topContributors.length === 0 && (
          <EmptyText>No messages yet</EmptyText>
        )}
      </ContributorsList>
    </div>
  );
}

// Sortable Channel Item Component
function SortableChannelItem({
  channel,
  onEdit,
  onArchive,
}: {
  channel: any;
  onEdit: (channel: any) => void;
  onArchive: (channelId: Id<"channels">) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: channel._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ChannelItem ref={setNodeRef} style={style} $isDragging={isDragging}>
      <DragHandle {...attributes} {...listeners}>
        <GripVertical size={14} />
      </DragHandle>
      <ChannelInfo>
        <ChannelName>#{channel.name}</ChannelName>
        <ChannelMeta>
          {channel.type} | {channel.requiredTier === "free" ? "Everyone" : channel.requiredTier === "tier2" ? "Tier 2 Only" : "Tier 1+"}
        </ChannelMeta>
      </ChannelInfo>
      <ChannelActions>
        <IconButton onClick={() => onEdit(channel)} title="Edit"><Edit2 size={14} /></IconButton>
        <IconButton onClick={() => onArchive(channel._id)} title="Archive" $danger><Trash2 size={14} /></IconButton>
      </ChannelActions>
    </ChannelItem>
  );
}

// Channels Tab
function ChannelsTab() {
  const channels = useQuery(api.channels.list);
  const createChannel = useMutation(api.channels.create);
  const updateChannel = useMutation(api.channels.update);
  const archiveChannel = useMutation(api.channels.archive);
  const reorderChannels = useMutation(api.channels.reorder);
  const seedChannels = useMutation(api.channels.seedDefaultChannels);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<Id<"channels"> | null>(null);
  const [localChannels, setLocalChannels] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    type: "chat" as "chat" | "announcements" | "content",
    requiredTier: "tier1" as "free" | "tier1" | "tier2",
    icon: "hash",
    discordChannelId: "",
    discordWebhookUrl: "",
  });

  // Sync local channels with server data
  useEffect(() => {
    if (channels) {
      setLocalChannels([...channels].sort((a, b) => a.order - b.order));
    }
  }, [channels]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localChannels.findIndex((c) => c._id === active.id);
      const newIndex = localChannels.findIndex((c) => c._id === over.id);

      const newOrder = arrayMove(localChannels, oldIndex, newIndex);
      setLocalChannels(newOrder);

      // Persist the new order to the database
      try {
        await reorderChannels({
          channelIds: newOrder.map((c) => c._id),
        });
      } catch (err: any) {
        // Revert on error
        setLocalChannels([...(channels ?? [])].sort((a, b) => a.order - b.order));
        alert("Failed to reorder channels: " + err.message);
      }
    }
  };

  const handleCreate = async () => {
    try {
      await createChannel({
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description || undefined,
        type: formData.type,
        requiredTier: formData.requiredTier,
        icon: formData.icon || undefined,
        discordChannelId: formData.discordChannelId || undefined,
        discordWebhookUrl: formData.discordWebhookUrl || undefined,
      });
      setShowCreate(false);
      setFormData({ name: "", slug: "", description: "", type: "chat", requiredTier: "tier1", icon: "hash", discordChannelId: "", discordWebhookUrl: "" });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateChannel({
        channelId: editingId,
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        requiredTier: formData.requiredTier,
        icon: formData.icon || undefined,
        discordChannelId: formData.discordChannelId || undefined,
        discordWebhookUrl: formData.discordWebhookUrl || undefined,
      });
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (channel: any) => {
    setEditingId(channel._id);
    setFormData({
      name: channel.name,
      slug: channel.slug,
      description: channel.description || "",
      type: channel.type,
      requiredTier: channel.requiredTier,
      icon: channel.icon || "hash",
      discordChannelId: channel.discordChannelId || "",
      discordWebhookUrl: channel.discordWebhookUrl || "",
    });
  };

  const handleArchive = async (channelId: Id<"channels">) => {
    if (!confirm("Archive this channel? It will be hidden from users.")) return;
    await archiveChannel({ channelId });
  };

  const handleSeed = async () => {
    try {
      await seedChannels({});
      alert("Default channels created!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <SectionHeader>
        <SectionTitle>Channels</SectionTitle>
        <ButtonGroup>
          <ActionButton onClick={() => setShowCreate(true)}><Plus size={14} /> New Channel</ActionButton>
          <SecondaryButton onClick={handleSeed}><RefreshCw size={14} /> Seed Defaults</SecondaryButton>
        </ButtonGroup>
      </SectionHeader>

      <HelpText style={{ marginBottom: "0.75rem" }}>
        Drag channels to reorder them. Changes are saved automatically.
      </HelpText>

      {(showCreate || editingId) && (
        <FormCard>
          <FormTitle>{editingId ? "Edit Channel" : "Create Channel"}</FormTitle>
          <FormGrid>
            <FormGroup>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="general" />
            </FormGroup>
            {!editingId && (
              <FormGroup>
                <Label>Slug</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated" />
              </FormGroup>
            )}
            <FormGroup>
              <Label>Type</Label>
              <Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                <option value="chat">Chat</option>
                <option value="announcements">Announcements</option>
                <option value="content">Content</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Required Tier</Label>
              <Select value={formData.requiredTier} onChange={(e) => setFormData({ ...formData, requiredTier: e.target.value as any })}>
                <option value="free">Everyone (Free)</option>
                <option value="tier1">Tier 1+</option>
                <option value="tier2">Tier 2 Only</option>
              </Select>
            </FormGroup>
            <FormGroup $fullWidth>
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description" />
            </FormGroup>
            <FormGroup>
              <Label>Icon</Label>
              <Select value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })}>
                <option value="hash">Hash #</option>
                <option value="megaphone">Megaphone</option>
                <option value="sparkles">Sparkles</option>
                <option value="crown">Crown</option>
                <option value="star">Star</option>
                <option value="message-circle">Message</option>
              </Select>
            </FormGroup>
          </FormGrid>
          <FormActions>
            <SecondaryButton onClick={() => { setShowCreate(false); setEditingId(null); }}>Cancel</SecondaryButton>
            <ActionButton onClick={editingId ? handleUpdate : handleCreate}>{editingId ? "Save" : "Create"}</ActionButton>
          </FormActions>
        </FormCard>
      )}

      <ChannelList>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localChannels.map((c) => c._id)}
            strategy={verticalListSortingStrategy}
          >
            {localChannels.map((channel) => (
              <SortableChannelItem
                key={channel._id}
                channel={channel}
                onEdit={startEdit}
                onArchive={handleArchive}
              />
            ))}
          </SortableContext>
        </DndContext>
        {!localChannels.length && <EmptyText>No channels. Click "Seed Defaults" to create some.</EmptyText>}
      </ChannelList>
    </div>
  );
}

// Users Tab
function UsersTab() {
  const users = useQuery(api.users.listAll, {});
  const banUser = useMutation(api.users.banUser);
  const unbanUser = useMutation(api.users.unbanUser);
  const kickUser = useMutation(api.users.kickUser);
  const setUserRole = useMutation(api.users.setUserRole);

  const [filter, setFilter] = useState<"all" | "tier1" | "tier2" | "banned">("all");

  const filteredUsers = users?.filter((u) => {
    if (filter === "banned") return u.isBanned;
    if (filter === "tier1") return u.tier === "tier1";
    if (filter === "tier2") return u.tier === "tier2";
    return true;
  });

  const handleBan = async (userId: Id<"users">) => {
    const reason = prompt("Ban reason (optional):");
    if (reason === null) return;
    await banUser({ userId, reason: reason || undefined });
  };

  const handleUnban = async (userId: Id<"users">) => {
    if (!confirm("Unban this user?")) return;
    await unbanUser({ userId });
  };

  const handleKick = async (userId: Id<"users">) => {
    if (!confirm("Kick this user?")) return;
    await kickUser({ userId });
  };

  const handleSetTier = async (userId: Id<"users">, tier: "tier1" | "tier2") => {
    await setUserRole({ userId, tier });
  };

  return (
    <div>
      <SectionHeader>
        <SectionTitle>Users ({users?.length ?? 0})</SectionTitle>
        <FilterGroup>
          <FilterButton $active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
          <FilterButton $active={filter === "tier1"} onClick={() => setFilter("tier1")}>Tier 1</FilterButton>
          <FilterButton $active={filter === "tier2"} onClick={() => setFilter("tier2")}>VIP</FilterButton>
          <FilterButton $active={filter === "banned"} onClick={() => setFilter("banned")}>Banned</FilterButton>
        </FilterGroup>
      </SectionHeader>

      <UserList>
        {filteredUsers?.map((u) => (
          <UserItem key={u._id} $banned={u.isBanned}>
            <UserAvatar src={u.avatarUrl} />
            <UserInfo>
              <UserName>
                {u.displayName}
                {u.isCreator && <CreatorBadge>Creator</CreatorBadge>}
                {u.isBanned && <BannedBadge>Banned</BannedBadge>}
              </UserName>
              <UserMeta>
                {u.tier === "tier2" ? "VIP" : "Member"} | Last seen: {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleDateString() : "Never"}
              </UserMeta>
            </UserInfo>
            {!u.isCreator && (
              <UserActions>
                <Select
                  value={u.tier}
                  onChange={(e) => handleSetTier(u._id, e.target.value as "tier1" | "tier2")}
                  style={{ width: 90, fontSize: "0.75rem" }}
                >
                  <option value="tier1">Tier 1</option>
                  <option value="tier2">VIP</option>
                </Select>
                <IconButton onClick={() => handleKick(u._id)} title="Kick"><UserX size={14} /></IconButton>
                {u.isBanned ? (
                  <IconButton onClick={() => handleUnban(u._id)} title="Unban" $success><RefreshCw size={14} /></IconButton>
                ) : (
                  <IconButton onClick={() => handleBan(u._id)} title="Ban" $danger><Ban size={14} /></IconButton>
                )}
              </UserActions>
            )}
          </UserItem>
        ))}
        {!filteredUsers?.length && <EmptyText>No users found</EmptyText>}
      </UserList>
    </div>
  );
}

// Content types with their info
const CONTENT_TYPES = [
  { value: "news", label: "News Update", icon: "📰", description: "General news and updates" },
  { value: "music", label: "Music", icon: "🎵", description: "Audio tracks and music releases" },
  { value: "video", label: "Video", icon: "🎬", description: "Video content and clips" },
  { value: "writing", label: "Writing/Blog", icon: "📝", description: "Articles and blog posts" },
  { value: "game_build", label: "Game Build", icon: "🎮", description: "Game releases and updates" },
  { value: "tools", label: "Tools/Resources", icon: "🔧", description: "Useful tools and resources" },
  { value: "event", label: "Event", icon: "📅", description: "Upcoming events and streams" },
  { value: "advice", label: "Advice/Tips", icon: "💡", description: "Tips and recommendations" },
  { value: "giveaway", label: "Giveaway", icon: "🎁", description: "Prize giveaways" },
  { value: "poll", label: "Poll", icon: "📊", description: "Community polls" },
  { value: "emoji", label: "Emoji Blast", icon: "😀", description: "Fun emoji announcement" },
] as const;

// Announcements Tab
function AnnouncementsTab() {
  const channels = useQuery(api.channels.list);
  const createContentPost = useMutation(api.contentPosts.create);

  // Use Zustand store for all form state
  const form = useContentFormStore();
  const {
    selectedChannel, contentType, title, content, requiredTier, sendToDiscord,
    sending, uploadingMedia, mediaUrl, mediaThumbnail, mediaDuration, mediaFile, soundcloudUrl,
    eventStartTime, eventEndTime, eventTimezone, eventLocation,
    giveawayEndsAt, giveawayPrize, giveawayMaxEntries,
    pollOptions, pollEndsAt, pollAllowMultiple,
    emojiEmoji, emojiMessage,
    // Actions
    setSelectedChannel, setContentType, setTitle, setContent, setRequiredTier,
    setSendToDiscord, setSending, setUploadingMedia, setMediaUrl, setMediaThumbnail,
    setMediaDuration, setMediaFile, setSoundcloudUrl, setEventStartTime, setEventEndTime, setEventTimezone,
    setEventLocation, setGiveawayEndsAt, setGiveawayPrize, setGiveawayMaxEntries,
    updatePollOption, addPollOption, removePollOption, setPollEndsAt, setPollAllowMultiple,
    setEmojiEmoji, setEmojiMessage, resetForm,
  } = form;

  const handleSend = async () => {
    if (!selectedChannel) {
      alert("Please select a channel");
      return;
    }

    // Types that don't require title/content
    const flexibleTypes = ["poll", "emoji", "video", "game_build", "giveaway", "music"];

    if (!flexibleTypes.includes(contentType) && !title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!flexibleTypes.includes(contentType) && !content.trim()) {
      alert("Please enter content");
      return;
    }

    setSending(true);
    try {
      // Build type-specific data
      let media = undefined;
      let eventData = undefined;
      let giveawayData = undefined;
      let pollData = undefined;
      let emojiData = undefined;

      if (contentType === "music" || contentType === "video") {
        let finalMediaUrl = mediaUrl;

        // If file is selected, upload it first
        if (mediaFile) {
          setUploadingMedia(true);
          try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(mediaFile);
            });

            // Upload to Vercel Blob via API
            const uploadRes = await fetch("/api/lounge/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file: base64,
                filename: mediaFile.name,
                mimeType: mediaFile.type,
              }),
            });

            if (!uploadRes.ok) {
              const data = await uploadRes.json();
              throw new Error(data.error || "Failed to upload file");
            }

            const uploadData = await uploadRes.json();
            finalMediaUrl = uploadData.url;
          } catch (err: any) {
            setUploadingMedia(false);
            alert(`Upload failed: ${err.message}`);
            setSending(false);
            return;
          }
          setUploadingMedia(false);
        }

        if (!finalMediaUrl) {
          alert("Please provide a media file or URL");
          setSending(false);
          return;
        }
        media = {
          type: contentType === "music" ? "audio" : "video",
          url: finalMediaUrl,
          thumbnail: mediaThumbnail || undefined,
          duration: mediaDuration ? parseInt(mediaDuration) : undefined,
          soundcloudUrl: contentType === "music" && soundcloudUrl ? soundcloudUrl : undefined,
        };
      }

      if (contentType === "event") {
        if (!eventStartTime) {
          alert("Please provide event start time");
          setSending(false);
          return;
        }
        eventData = {
          startTime: new Date(eventStartTime).getTime(),
          endTime: eventEndTime ? new Date(eventEndTime).getTime() : undefined,
          timezone: eventTimezone,
          location: eventLocation || undefined,
        };
      }

      if (contentType === "giveaway") {
        if (!giveawayEndsAt || !giveawayPrize) {
          alert("Please fill in giveaway details");
          setSending(false);
          return;
        }
        giveawayData = {
          endsAt: new Date(giveawayEndsAt).getTime(),
          prize: giveawayPrize,
          maxEntries: giveawayMaxEntries ? parseInt(giveawayMaxEntries) : undefined,
        };
      }

      if (contentType === "poll") {
        const validOptions = pollOptions.filter((o) => o.trim());
        if (validOptions.length < 2) {
          alert("Please add at least 2 poll options");
          setSending(false);
          return;
        }
        pollData = {
          options: validOptions.map((text, i) => ({ id: `opt_${i}`, text })),
          endsAt: pollEndsAt ? new Date(pollEndsAt).getTime() : undefined,
          allowMultiple: pollAllowMultiple,
        };
      }

      if (contentType === "emoji") {
        emojiData = {
          emoji: emojiEmoji,
          message: emojiMessage || undefined,
        };
      }

      await createContentPost({
        channelId: selectedChannel as Id<"channels">,
        type: contentType,
        title: title.trim(),
        content: content.trim(),
        requiredTier,
        media,
        eventData,
        giveawayData,
        pollData,
        emojiData,
        sendToDiscord,
      });

      resetForm();
      alert("Content posted successfully!");
    } catch (err: any) {
      alert(err.message);
    }
    setSending(false);
  };

  const selectedTypeInfo = CONTENT_TYPES.find((t) => t.value === contentType);

  return (
    <div>
      <SectionTitle>Create Content Drop</SectionTitle>

      <FormCard>
        {/* Channel Selection */}
        <FormGroup>
          <Label>Channel *</Label>
          <Select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value as Id<"channels"> | "")}
          >
            <option value="">Select a channel...</option>
            {channels?.map((channel) => (
              <option key={channel._id} value={channel._id}>
                #{channel.name}
              </option>
            ))}
          </Select>
        </FormGroup>

        {/* Content Type Selection */}
        <FormGroup>
          <Label>Content Type *</Label>
          <ContentTypeGrid>
            {CONTENT_TYPES.map((type) => (
              <ContentTypeCard
                key={type.value}
                $selected={contentType === type.value}
                onClick={() => setContentType(type.value)}
              >
                <ContentTypeIcon>{type.icon}</ContentTypeIcon>
                <ContentTypeLabel>{type.label}</ContentTypeLabel>
              </ContentTypeCard>
            ))}
          </ContentTypeGrid>
          {selectedTypeInfo && (
            <TypeDescription>{selectedTypeInfo.description}</TypeDescription>
          )}
        </FormGroup>

        {/* Basic Fields - hide for emoji type */}
        {contentType !== "emoji" && (
          <FormGrid>
            <FormGroup $fullWidth>
              <Label>Title {!["poll", "video", "game_build", "giveaway", "music"].includes(contentType) && "*"}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title..."
              />
            </FormGroup>

            <FormGroup $fullWidth>
              <Label>Content {!["poll", "emoji", "video", "game_build", "giveaway", "music"].includes(contentType) && "*"}</Label>
              <TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your content... (supports markdown)"
                rows={5}
              />
            </FormGroup>

            <FormGroup>
              <Label>Access Tier</Label>
              <Select
                value={requiredTier}
                onChange={(e) => setRequiredTier(e.target.value as "free" | "tier1" | "tier2")}
              >
                <option value="free">Everyone (Free)</option>
                <option value="tier1">Tier 1+</option>
                <option value="tier2">Tier 2 Only</option>
              </Select>
            </FormGroup>
          </FormGrid>
        )}

        {/* Access Tier for emoji (since basic fields are hidden) */}
        {contentType === "emoji" && (
          <FormGroup>
            <Label>Access Tier</Label>
            <Select
              value={requiredTier}
              onChange={(e) => setRequiredTier(e.target.value as "free" | "tier1" | "tier2")}
            >
              <option value="free">Everyone (Free)</option>
              <option value="tier1">Tier 1+</option>
              <option value="tier2">Tier 2 Only</option>
            </Select>
          </FormGroup>
        )}

        {/* Type-specific Fields */}
        {(contentType === "music" || contentType === "video") && (
          <TypeSpecificSection>
            <SectionLabel>
              {contentType === "music" ? "🎵" : "🎬"} Media Details
            </SectionLabel>
            <FormGrid>
              <FormGroup $fullWidth>
                <Label>Upload File {contentType === "music" ? "(MP3, WAV, OGG - max 15MB)" : "(MP4, WebM - max 25MB)"}</Label>
                <FileInputWrapper>
                  <FileInput
                    type="file"
                    accept={contentType === "music" ? "audio/mpeg,audio/mp3,audio/wav,audio/ogg" : "video/mp4,video/webm"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setMediaFile(file);
                        setMediaUrl(""); // Clear URL when file selected
                      }
                    }}
                  />
                  <FileInputLabel>
                    {mediaFile ? mediaFile.name : `Choose ${contentType === "music" ? "audio" : "video"} file...`}
                  </FileInputLabel>
                </FileInputWrapper>
                {mediaFile && (
                  <FileInfo>
                    Selected: {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)
                    <RemoveFileButton onClick={() => setMediaFile(null)}>Remove</RemoveFileButton>
                  </FileInfo>
                )}
              </FormGroup>
              <FormGroup $fullWidth>
                <Label>Or enter URL directly</Label>
                <Input
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    setMediaFile(null); // Clear file when URL entered
                  }}
                  placeholder={contentType === "music" ? "https://example.com/track.mp3" : "https://example.com/video.mp4"}
                  disabled={!!mediaFile}
                />
              </FormGroup>
              <FormGroup>
                <Label>Thumbnail URL</Label>
                <Input
                  value={mediaThumbnail}
                  onChange={(e) => setMediaThumbnail(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </FormGroup>
              <FormGroup>
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  value={mediaDuration}
                  onChange={(e) => setMediaDuration(e.target.value)}
                  placeholder="180"
                />
              </FormGroup>
              {contentType === "music" && (
                <FormGroup $fullWidth>
                  <Label>SoundCloud Link (optional)</Label>
                  <Input
                    value={soundcloudUrl}
                    onChange={(e) => setSoundcloudUrl(e.target.value)}
                    placeholder="https://soundcloud.com/artist/track"
                  />
                  <HelpText>If provided, users can choose between SoundCloud or direct download</HelpText>
                </FormGroup>
              )}
            </FormGrid>
          </TypeSpecificSection>
        )}

        {contentType === "event" && (
          <TypeSpecificSection>
            <SectionLabel>📅 Event Details</SectionLabel>
            <FormGrid>
              <FormGroup>
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Timezone</Label>
                <Select value={eventTimezone} onChange={(e) => setEventTimezone(e.target.value)}>
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Location</Label>
                <Input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Twitch, Discord, etc."
                />
              </FormGroup>
            </FormGrid>
          </TypeSpecificSection>
        )}

        {contentType === "giveaway" && (
          <TypeSpecificSection>
            <SectionLabel>🎁 Giveaway Details</SectionLabel>
            <FormGrid>
              <FormGroup $fullWidth>
                <Label>Prize *</Label>
                <Input
                  value={giveawayPrize}
                  onChange={(e) => setGiveawayPrize(e.target.value)}
                  placeholder="What are you giving away?"
                />
              </FormGroup>
              <FormGroup>
                <Label>Ends At *</Label>
                <Input
                  type="datetime-local"
                  value={giveawayEndsAt}
                  onChange={(e) => setGiveawayEndsAt(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Max Entries (optional)</Label>
                <Input
                  type="number"
                  value={giveawayMaxEntries}
                  onChange={(e) => setGiveawayMaxEntries(e.target.value)}
                  placeholder="Unlimited"
                />
              </FormGroup>
            </FormGrid>
          </TypeSpecificSection>
        )}

        {contentType === "poll" && (
          <TypeSpecificSection>
            <SectionLabel>📊 Poll Options</SectionLabel>
            <PollOptionsContainer>
              {pollOptions.map((option, index) => (
                <PollOptionRow key={index}>
                  <PollOptionNumber>{index + 1}</PollOptionNumber>
                  <Input
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <IconButton onClick={() => removePollOption(index)} $danger>
                      <Trash2 size={14} />
                    </IconButton>
                  )}
                </PollOptionRow>
              ))}
              {pollOptions.length < 10 && (
                <SecondaryButton type="button" onClick={addPollOption} style={{ marginTop: "0.5rem" }}>
                  <Plus size={14} /> Add Option
                </SecondaryButton>
              )}
            </PollOptionsContainer>
            <FormGrid style={{ marginTop: "1rem" }}>
              <FormGroup>
                <Label>Ends At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={pollEndsAt}
                  onChange={(e) => setPollEndsAt(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <CheckboxLabel style={{ marginTop: "1.5rem" }}>
                  <input
                    type="checkbox"
                    checked={pollAllowMultiple}
                    onChange={(e) => setPollAllowMultiple(e.target.checked)}
                  />
                  Allow multiple selections
                </CheckboxLabel>
              </FormGroup>
            </FormGrid>
          </TypeSpecificSection>
        )}

        {contentType === "emoji" && (
          <TypeSpecificSection>
            <SectionLabel>😀 Emoji Blast</SectionLabel>
            <FormGrid>
              <FormGroup>
                <Label>Emoji *</Label>
                <Input
                  value={emojiEmoji}
                  onChange={(e) => setEmojiEmoji(e.target.value)}
                  placeholder="🎉"
                  style={{ fontSize: "2rem", textAlign: "center" }}
                />
              </FormGroup>
              <FormGroup>
                <Label>Message (optional)</Label>
                <Input
                  value={emojiMessage}
                  onChange={(e) => setEmojiMessage(e.target.value)}
                  placeholder="sent @everyone a"
                />
              </FormGroup>
            </FormGrid>
          </TypeSpecificSection>
        )}

        {/* Discord Option */}
        <FormGroup style={{ marginTop: "1rem" }}>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={sendToDiscord}
              onChange={(e) => setSendToDiscord(e.target.checked)}
            />
            Also send to Discord (if webhook configured)
          </CheckboxLabel>
        </FormGroup>

        <ActionButton onClick={handleSend} disabled={sending || uploadingMedia} style={{ marginTop: "1rem" }}>
          <Send size={14} /> {uploadingMedia ? "Uploading file..." : sending ? "Posting..." : "Post Content Drop"}
        </ActionButton>
      </FormCard>
    </div>
  );
}

// Discord Tab
function DiscordTab() {
  const channels = useQuery(api.channels.list);
  const updateChannel = useMutation(api.channels.update);

  const [editingId, setEditingId] = useState<Id<"channels"> | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [discordChannelId, setDiscordChannelId] = useState("");

  const startEdit = (channel: any) => {
    setEditingId(channel._id);
    setWebhookUrl(channel.discordWebhookUrl || "");
    setDiscordChannelId(channel.discordChannelId || "");
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      await updateChannel({
        channelId: editingId,
        discordWebhookUrl: webhookUrl || undefined,
        discordChannelId: discordChannelId || undefined,
      });
      setEditingId(null);
      setWebhookUrl("");
      setDiscordChannelId("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <SectionTitle>Discord Wormhole</SectionTitle>
      <Text style={{ marginBottom: "1.5rem" }}>
        Connect lounge channels to Discord for two-way message sync.
      </Text>

      <ChannelList>
        {channels?.map((channel) => (
          <ChannelItem key={channel._id}>
            <ChannelInfo>
              <ChannelName>#{channel.name}</ChannelName>
              <ChannelMeta>
                {channel.discordWebhookUrl ? (
                  <span style={{ color: "#3ba55d" }}>Connected</span>
                ) : (
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>Not connected</span>
                )}
              </ChannelMeta>
            </ChannelInfo>
            <IconButton onClick={() => startEdit(channel)} title="Configure">
              <Edit2 size={14} />
            </IconButton>
          </ChannelItem>
        ))}
      </ChannelList>

      {editingId && (
        <FormCard style={{ marginTop: "1rem" }}>
          <FormTitle>Configure Discord Connection</FormTitle>
          <FormGroup>
            <Label>Discord Webhook URL</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
            />
            <HelpText>Create a webhook in Discord channel settings</HelpText>
          </FormGroup>
          <FormGroup>
            <Label>Discord Channel ID (for incoming messages)</Label>
            <Input
              value={discordChannelId}
              onChange={(e) => setDiscordChannelId(e.target.value)}
              placeholder="123456789012345678"
            />
            <HelpText>Enable Developer Mode in Discord, right-click channel, Copy ID</HelpText>
          </FormGroup>
          <FormActions>
            <SecondaryButton onClick={() => setEditingId(null)}>Cancel</SecondaryButton>
            <ActionButton onClick={handleSave}>Save</ActionButton>
          </FormActions>
        </FormCard>
      )}
    </div>
  );
}

// Rewards Tab
function RewardsTab() {
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipping, setShipping] = useState(false);

  // Form state for shipping
  const [shipType, setShipType] = useState<"monthly_drop" | "special">("special");
  const [shipTarget, setShipTarget] = useState<"all" | "tier1" | "tier2" | "individual">("tier1");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [items, setItems] = useState<Array<{
    type: string;
    name: string;
    description: string;
    rarity: ItemRarity;
    assetUrl: string;
    code: string;
    expiresAfterDays: string;
  }>>([{
    type: "wallpaper",
    name: "",
    description: "",
    rarity: "rare",
    assetUrl: "",
    code: "",
    expiresAfterDays: "",
  }]);

  // Queries
  const analytics = useQuery(api.rewards.getRewardsAnalytics);
  const users = useQuery(api.rewards.getUsersForShipping);
  const allRewards = useQuery(api.rewards.getAllRewards);

  // Mutations
  const shipRewards = useMutation(api.rewards.shipRewards);
  const deleteReward = useMutation(api.rewards.deleteReward);

  const addItem = () => {
    if (items.length >= 3) return;
    setItems([...items, {
      type: "wallpaper",
      name: "",
      description: "",
      rarity: "rare",
      assetUrl: "",
      code: "",
      expiresAfterDays: "",
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    const item = updated[index];
    if (item) {
      (item as any)[field] = value;
      setItems(updated);
    }
  };

  const handleShip = async () => {
    // Validate items
    for (const item of items) {
      if (!item.name || !item.description) {
        alert("Please fill in all required fields for each item");
        return;
      }
    }

    setShipping(true);
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const formattedItems = items.map((item) => ({
        type: item.type,
        name: item.name,
        description: item.description,
        rarity: item.rarity as ItemRarity,
        assetUrl: item.assetUrl || undefined,
        code: item.code || undefined,
        expiresAfterDays: item.expiresAfterDays ? parseInt(item.expiresAfterDays) : undefined,
      }));

      await shipRewards({
        items: formattedItems,
        type: shipType,
        revealType: "mystery_box",
        targetUserIds: shipTarget === "individual" && selectedUserId ? [selectedUserId] : undefined,
        targetTier: shipTarget !== "individual" ? shipTarget : undefined,
        month,
      });

      alert("Mystery boxes shipped successfully!");
      setShowShipModal(false);
      setItems([{
        type: "wallpaper",
        name: "",
        description: "",
        rarity: "rare",
        assetUrl: "",
        code: "",
        expiresAfterDays: "",
      }]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setShipping(false);
    }
  };

  const handleDeleteReward = async (rewardId: Id<"rewards">) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;
    try {
      await deleteReward({ rewardId });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <SectionHeader>
        <SectionTitle>Rewards Dashboard</SectionTitle>
        <ActionButton onClick={() => setShowShipModal(true)}>
          <Package size={14} /> Ship Mystery Box
        </ActionButton>
      </SectionHeader>

      {/* Analytics */}
      {analytics && (
        <StatsGrid>
          <StatCard>
            <StatIcon><Package size={24} /></StatIcon>
            <StatValue>{analytics.totalBoxes}</StatValue>
            <StatLabel>Total Boxes</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon $color="#22c55e"><Gift size={24} /></StatIcon>
            <StatValue>{analytics.openedBoxes}</StatValue>
            <StatLabel>Opened</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon $color="#f59e0b"><Package size={24} /></StatIcon>
            <StatValue>{analytics.pendingBoxes}</StatValue>
            <StatLabel>Pending</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon $color={LOUNGE_COLORS.tier1}><Sparkles size={24} /></StatIcon>
            <StatValue>{analytics.totalItems}</StatValue>
            <StatLabel>Total Items</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      {/* Rarity breakdown */}
      {analytics && (
        <>
          <SectionTitle>Items by Rarity</SectionTitle>
          <RarityGrid>
            {(["legendary", "epic", "rare", "uncommon", "common"] as ItemRarity[]).map((rarity) => {
              const colors = RARITY_COLORS[rarity];
              const count = analytics.rarityStats[rarity] || 0;
              return (
                <RarityCard key={rarity} $color={colors.color}>
                  <RarityCount>{count}</RarityCount>
                  <RarityLabel>{colors.label}</RarityLabel>
                </RarityCard>
              );
            })}
          </RarityGrid>
        </>
      )}

      {/* Recent Rewards */}
      <SectionTitle style={{ marginTop: "1.5rem" }}>Recent Shipments</SectionTitle>
      {allRewards && allRewards.length > 0 ? (
        <RewardsList>
          {allRewards.slice(0, 20).map((reward: any) => (
            <RewardItem key={reward._id}>
              <RewardInfo>
                <RewardUserInfo>
                  {reward.user?.avatarUrl && (
                    <UserAvatar src={reward.user.avatarUrl} alt="" />
                  )}
                  <div>
                    <RewardUserName>{reward.user?.displayName || "Unknown"}</RewardUserName>
                    <RewardMeta>
                      {reward.items.length} items • {reward.isRevealed ? "Opened" : "Unopened"} •{" "}
                      {new Date(reward.deliveredAt).toLocaleDateString()}
                    </RewardMeta>
                  </div>
                </RewardUserInfo>
                <RewardItems>
                  {reward.items.map((item: any, i: number) => (
                    <RewardItemBadge key={i} $color={RARITY_COLORS[item.rarity as ItemRarity]?.color || "#9CA3AF"}>
                      {item.name}
                    </RewardItemBadge>
                  ))}
                </RewardItems>
              </RewardInfo>
              <IconButton $danger onClick={() => handleDeleteReward(reward._id)} title="Delete">
                <Trash2 size={14} />
              </IconButton>
            </RewardItem>
          ))}
        </RewardsList>
      ) : (
        <EmptyText>No rewards shipped yet</EmptyText>
      )}

      {/* Ship Modal */}
      {showShipModal && (
        <ModalOverlay onClick={() => setShowShipModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <FormTitle>Ship Mystery Box</FormTitle>

            <FormGrid>
              <FormGroup>
                <Label>Box Type</Label>
                <Select value={shipType} onChange={(e) => setShipType(e.target.value as any)}>
                  <option value="special">Special Drop</option>
                  <option value="monthly_drop">Monthly Drop</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Send To</Label>
                <Select value={shipTarget} onChange={(e) => setShipTarget(e.target.value as any)}>
                  <option value="tier1">All Tier 1 Members</option>
                  <option value="tier2">All Tier 2 Members</option>
                  <option value="all">Everyone</option>
                  <option value="individual">Individual User</option>
                </Select>
              </FormGroup>
            </FormGrid>

            {shipTarget === "individual" && (
              <FormGroup>
                <Label>Select User</Label>
                <Select
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(e.target.value as Id<"users">)}
                >
                  <option value="">Select a user...</option>
                  {users?.map((u: any) => (
                    <option key={u._id} value={u._id}>
                      {u.displayName} ({u.tier})
                    </option>
                  ))}
                </Select>
              </FormGroup>
            )}

            <SectionLabel style={{ marginTop: "1rem" }}>Items (1-3)</SectionLabel>

            {items.map((item, index) => (
              <ItemEditor key={index}>
                <ItemEditorHeader>
                  <span>Item {index + 1}</span>
                  {items.length > 1 && (
                    <IconButton $danger onClick={() => removeItem(index)}>
                      <Trash2 size={14} />
                    </IconButton>
                  )}
                </ItemEditorHeader>

                <FormGrid>
                  <FormGroup>
                    <Label>Type</Label>
                    <Select
                      value={item.type}
                      onChange={(e) => updateItem(index, "type", e.target.value)}
                    >
                      {Object.entries(REWARD_TYPES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>Rarity</Label>
                    <Select
                      value={item.rarity}
                      onChange={(e) => updateItem(index, "rarity", e.target.value)}
                    >
                      {(["common", "uncommon", "rare", "epic", "legendary"] as ItemRarity[]).map((r) => (
                        <option key={r} value={r}>{RARITY_COLORS[r].label}</option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup $fullWidth>
                    <Label>Name *</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                      placeholder="e.g., Exclusive Wallpaper Pack"
                    />
                  </FormGroup>
                  <FormGroup $fullWidth>
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="A short description of the item"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Asset URL (for downloads)</Label>
                    <Input
                      value={item.assetUrl}
                      onChange={(e) => updateItem(index, "assetUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Code (for discounts)</Label>
                    <Input
                      value={item.code}
                      onChange={(e) => updateItem(index, "code", e.target.value)}
                      placeholder="DISCOUNT20"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Expires After (days)</Label>
                    <Input
                      type="number"
                      value={item.expiresAfterDays}
                      onChange={(e) => updateItem(index, "expiresAfterDays", e.target.value)}
                      placeholder="Never"
                    />
                  </FormGroup>
                </FormGrid>
              </ItemEditor>
            ))}

            {items.length < 3 && (
              <SecondaryButton onClick={addItem} style={{ marginTop: "0.5rem" }}>
                <Plus size={14} /> Add Item
              </SecondaryButton>
            )}

            <FormActions>
              <SecondaryButton onClick={() => setShowShipModal(false)}>Cancel</SecondaryButton>
              <ActionButton onClick={handleShip} disabled={shipping}>
                <Send size={14} /> {shipping ? "Shipping..." : "Ship Rewards"}
              </ActionButton>
            </FormActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}

// Styled Components
const AdminContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
`;

const Container = styled.div`padding: 2rem;`;

const Header = styled.div`margin-bottom: 1.5rem;`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.25rem;
`;

const Text = styled.p`
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-size: 0.9rem;
`;

const TabBar = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
  padding-bottom: 0.5rem;
  overflow-x: auto;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${(p) => (p.$active ? LOUNGE_COLORS.channelActive : "transparent")};
  border: none;
  border-radius: 6px;
  color: ${(p) => (p.$active ? "#fff" : "rgba(255,255,255,0.6)")};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: ${LOUNGE_COLORS.channelHover}; color: #fff; }
`;

const TabContent = styled.div``;

const Loading = styled.div`
  color: rgba(255, 255, 255, 0.5);
  padding: 2rem;
  text-align: center;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  padding: 1rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
  text-align: center;
`;

const StatIcon = styled.div<{ $color?: string }>`
  color: ${(p) => p.$color || "rgba(255,255,255,0.5)"};
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
`;

const ContributorsList = styled.div`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
  overflow: hidden;
`;

const ContributorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
  &:last-child { border-bottom: none; }
`;

const ContributorRank = styled.div`
  font-weight: 600;
  color: ${LOUNGE_COLORS.tier1};
  width: 30px;
`;

const ContributorAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${LOUNGE_COLORS.glassBorder};
`;

const ContributorName = styled.div`
  flex: 1;
  color: #fff;
  font-weight: 500;
`;

const ContributorCount = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  &:hover { background: ${LOUNGE_COLORS.channelHover}; color: #fff; }
`;

const FormCard = styled.div`
  padding: 1.25rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
  margin-bottom: 1rem;
`;

const FormTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  grid-column: ${(p) => (p.$fullWidth ? "1 / -1" : "auto")};
`;

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.35rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  &:focus { outline: none; border-color: ${LOUNGE_COLORS.tier1}; }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  font-family: inherit;
  resize: vertical;
  &:focus { outline: none; border-color: ${LOUNGE_COLORS.tier1}; }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  &:focus { outline: none; border-color: ${LOUNGE_COLORS.tier1}; }
`;

const FileInputWrapper = styled.label`
  display: block;
  position: relative;
  cursor: pointer;
`;

const FileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
`;

const FileInputLabel = styled.div`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px dashed ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${LOUNGE_COLORS.tier1};
    color: #fff;
    background: rgba(0, 0, 0, 0.4);
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const RemoveFileButton = styled.button`
  background: none;
  border: none;
  color: ${LOUNGE_COLORS.tier1};
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ChannelList = styled.div`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
  overflow: hidden;
`;

const ChannelItem = styled.div<{ $isDragging?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
  background: ${(p) => p.$isDragging ? LOUNGE_COLORS.channelActive : "transparent"};
  &:last-child { border-bottom: none; }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  color: rgba(255, 255, 255, 0.4);
  cursor: grab;
  border-radius: 4px;
  transition: color 0.15s ease, background 0.15s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    cursor: grabbing;
  }
`;

const ChannelInfo = styled.div`flex: 1;`;

const ChannelName = styled.div`
  font-weight: 500;
  color: #fff;
`;

const ChannelMeta = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.15rem;
`;

const ChannelActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const IconButton = styled.button<{ $danger?: boolean; $success?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: ${(p) => (p.$danger ? "#ed4245" : p.$success ? "#3ba55d" : "rgba(255,255,255,0.6)")};
  cursor: pointer;
  &:hover {
    background: ${(p) => (p.$danger ? "rgba(237,66,69,0.2)" : p.$success ? "rgba(59,165,93,0.2)" : "rgba(255,255,255,0.1)")};
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 0.35rem 0.75rem;
  background: ${(p) => (p.$active ? LOUNGE_COLORS.channelActive : "transparent")};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 4px;
  color: ${(p) => (p.$active ? "#fff" : "rgba(255,255,255,0.6)")};
  font-size: 0.75rem;
  cursor: pointer;
  &:hover { background: ${LOUNGE_COLORS.channelHover}; }
`;

const UserList = styled.div`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
  overflow: hidden;
`;

const UserItem = styled.div<{ $banned?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
  opacity: ${(p) => (p.$banned ? 0.5 : 1)};
  &:last-child { border-bottom: none; }
`;

const UserAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${LOUNGE_COLORS.glassBorder};
`;

const UserInfo = styled.div`flex: 1; min-width: 0;`;

const UserName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #fff;
`;

const CreatorBadge = styled.span`
  font-size: 0.65rem;
  padding: 2px 6px;
  background: ${LOUNGE_COLORS.tier2};
  border-radius: 4px;
  color: #fff;
`;

const BannedBadge = styled.span`
  font-size: 0.65rem;
  padding: 2px 6px;
  background: #ed4245;
  border-radius: 4px;
  color: #fff;
`;

const UserMeta = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  input { cursor: pointer; }
`;

const HelpText = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.25rem;
`;

const EmptyText = styled.div`
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 1.5rem;
  font-size: 0.9rem;
`;

// Content Type Picker Styles
const ContentTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ContentTypeCard = styled.div<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem 0.5rem;
  background: ${(p) => (p.$selected ? LOUNGE_COLORS.channelActive : "rgba(0, 0, 0, 0.2)")};
  border: 1px solid ${(p) => (p.$selected ? LOUNGE_COLORS.tier1 : LOUNGE_COLORS.glassBorder)};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(p) => (p.$selected ? LOUNGE_COLORS.channelActive : LOUNGE_COLORS.channelHover)};
    border-color: ${(p) => (p.$selected ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.3)")};
  }
`;

const ContentTypeIcon = styled.span`
  font-size: 1.5rem;
`;

const ContentTypeLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;

const TypeDescription = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
  font-style: italic;
`;

const TypeSpecificSection = styled.div`
  margin-top: 1.25rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
`;

const SectionLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.75rem;
`;

const PollOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PollOptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PollOptionNumber = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
`;

// Rewards Tab Styled Components
const RarityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const RarityCard = styled.div<{ $color: string }>`
  padding: 0.75rem;
  background: ${(p) => `${p.$color}15`};
  border: 1px solid ${(p) => `${p.$color}40`};
  border-radius: 8px;
  text-align: center;
`;

const RarityCount = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
`;

const RarityLabel = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: capitalize;
  margin-top: 0.25rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const RewardsList = styled.div`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 10px;
  overflow: hidden;
`;

const RewardItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};

  &:last-child {
    border-bottom: none;
  }
`;

const RewardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RewardUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const RewardUserName = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: #fff;
`;

const RewardMeta = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
`;

const RewardItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const RewardItemBadge = styled.span<{ $color: string }>`
  padding: 0.125rem 0.375rem;
  background: ${(p) => `${p.$color}25`};
  color: ${(p) => p.$color};
  font-size: 0.65rem;
  font-weight: 500;
  border-radius: 4px;
`;

const ItemEditor = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
`;

const ItemEditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
`;
