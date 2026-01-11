import Head from "next/head";
import styled from "styled-components";
import { useQuery, useMutation, useAction } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { BlogView } from "../../../components/layout/blog";
import { SimpleNavbar } from "../../../components/navbar/simple";
import { useTierAccess } from "../../../hooks/lounge/useTierAccess";
import {
  Youtube,
  Settings,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Hash,
  MessagesSquare,
} from "lucide-react";

export const getServerSideProps = () => ({ props: {} });

export default function AdminSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { isLoading, isCreator } = useTierAccess();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <BlogView>
        <SimpleNavbar title="Admin Settings" />
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
          <title>Access Denied | Admin Settings</title>
        </Head>
        <BlogView>
          <SimpleNavbar title="Admin Settings" />
          <Container>
            <Title>Access Denied</Title>
            <Text>You don't have permission to access admin settings.</Text>
          </Container>
        </BlogView>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Settings | Nevulo</title>
      </Head>
      <BlogView>
        <SimpleNavbar title="Admin Settings" />
        <AdminContainer>
          <Header>
            <Title>
              <Settings size={28} /> Admin Settings
            </Title>
            <Text>Configure integrations and site settings</Text>
          </Header>

          <YouTubeSection />
          <DiscordBlogSection />
        </AdminContainer>
      </BlogView>
    </>
  );
}

function YouTubeSection() {
  const settings = useQuery(api.youtube.getYouTubeSettings);
  const updateSettings = useMutation(api.youtube.updateYouTubeSettings);
  const subscribeAction = useAction(api.youtube.subscribeToChannel);

  const [form, setForm] = useState({
    channelId: "",
    autoPublish: false,
    defaultLabels: "",
    defaultVisibility: "public" as const,
  });
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load existing settings
  useEffect(() => {
    if (settings) {
      setForm({
        channelId: settings.channelId || "",
        autoPublish: settings.autoPublish || false,
        defaultLabels: settings.defaultLabels?.join(", ") || "",
        defaultVisibility: settings.defaultVisibility || "public",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!form.channelId.trim()) {
      setMessage({ type: "error", text: "Channel ID is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await updateSettings({
        channelId: form.channelId.trim(),
        autoPublish: form.autoPublish,
        defaultLabels: form.defaultLabels
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        defaultVisibility: form.defaultVisibility,
      });
      setMessage({ type: "success", text: "Settings saved!" });
    } catch (error) {
      setMessage({ type: "error", text: `Failed to save: ${error}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async () => {
    if (!form.channelId.trim()) {
      setMessage({ type: "error", text: "Save settings with a channel ID first" });
      return;
    }

    setSubscribing(true);
    setMessage(null);

    try {
      // Use current URL as base for callback
      const baseUrl = window.location.origin;
      const callbackUrl = `${baseUrl}/api/webhooks/youtube`;

      await subscribeAction({ callbackUrl });
      setMessage({ type: "success", text: "Subscribed to YouTube notifications!" });
    } catch (error) {
      setMessage({ type: "error", text: `Failed to subscribe: ${error}` });
    } finally {
      setSubscribing(false);
    }
  };

  const expiresAt = settings?.subscriptionExpiresAt;
  const isExpired = !expiresAt || expiresAt < Date.now();
  const expiresIn = expiresAt ? Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <Youtube size={20} /> YouTube Integration
        </SectionTitle>
        <HelpLink
          href="https://developers.google.com/youtube/v3/guides/push_notifications"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs <ExternalLink size={14} />
        </HelpLink>
      </SectionHeader>

      <SectionDescription>
        Automatically create blog posts when you upload videos to YouTube using PubSubHubbub.
      </SectionDescription>

      {message && (
        <Message $type={message.type}>
          {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </Message>
      )}

      <FormGrid>
        <FormGroup>
          <Label>YouTube Channel ID</Label>
          <Input
            value={form.channelId}
            onChange={(e) => setForm({ ...form, channelId: e.target.value })}
            placeholder="UC..."
          />
          <HelpText>
            Find your channel ID in YouTube Studio → Settings → Advanced settings
          </HelpText>
        </FormGroup>

        <FormGroup>
          <Label>Default Visibility</Label>
          <Select
            value={form.defaultVisibility}
            onChange={(e) =>
              setForm({
                ...form,
                defaultVisibility: e.target.value as typeof form.defaultVisibility,
              })
            }
          >
            <option value="public">Public</option>
            <option value="members">Members Only</option>
            <option value="tier1">Tier 1+</option>
            <option value="tier2">Tier 2 Only</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Default Labels</Label>
          <Input
            value={form.defaultLabels}
            onChange={(e) => setForm({ ...form, defaultLabels: e.target.value })}
            placeholder="video, tutorial, coding"
          />
          <HelpText>Comma-separated labels to auto-apply</HelpText>
        </FormGroup>

        <FormGroup>
          <ToggleRow>
            <ToggleLabel>
              <span>Auto-publish videos</span>
              <ToggleHelpText>
                {form.autoPublish
                  ? "Videos will be published immediately"
                  : "Videos will be saved as drafts"}
              </ToggleHelpText>
            </ToggleLabel>
            <Toggle
              type="checkbox"
              checked={form.autoPublish}
              onChange={(e) => setForm({ ...form, autoPublish: e.target.checked })}
            />
          </ToggleRow>
        </FormGroup>
      </FormGrid>

      <ActionRow>
        <ActionButton onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </ActionButton>
        <ActionButton onClick={handleSubscribe} disabled={subscribing} $secondary>
          <RefreshCw size={16} className={subscribing ? "spin" : ""} />
          {subscribing ? "Subscribing..." : "Subscribe Now"}
        </ActionButton>
      </ActionRow>

      <StatusBox>
        <StatusLabel>Subscription Status</StatusLabel>
        <StatusRow>
          <StatusIndicator $active={!isExpired} />
          <StatusText>
            {!settings?.channelId
              ? "Not configured"
              : isExpired
                ? "Expired or not subscribed"
                : `Active - expires in ${expiresIn} days`}
          </StatusText>
        </StatusRow>
        {expiresAt && !isExpired && (
          <StatusMeta>Expires: {new Date(expiresAt).toLocaleDateString()}</StatusMeta>
        )}
      </StatusBox>

      <InfoBox>
        <strong>Setup Instructions:</strong>
        <ol>
          <li>
            Get a YouTube API key from{" "}
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
              Google Cloud Console
            </a>
          </li>
          <li>Enable YouTube Data API v3</li>
          <li>Add <code>YOUTUBE_API_KEY</code> to your environment variables</li>
          <li>Enter your channel ID above and save</li>
          <li>Click "Subscribe Now" to start receiving notifications</li>
        </ol>
      </InfoBox>
    </Section>
  );
}

type ChannelConfig = {
  channelId: string;
  channelType: "forum" | "text";
  webhookUrl: string;
};

function DiscordBlogSection() {
  const settings = useQuery(api.blogDiscord.getDiscordSettings);
  const updateSettings = useMutation(api.blogDiscord.updateDiscordSettings);

  const [form, setForm] = useState({
    botEnabled: false,
    useUserToken: false,
    articleChannelId: "",
    articleChannelType: "forum" as "forum" | "text",
    articleWebhookUrl: "",
    videoChannelId: "",
    videoChannelType: "text" as "forum" | "text",
    videoWebhookUrl: "",
    newsChannelId: "",
    newsChannelType: "text" as "forum" | "text",
    newsWebhookUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load existing settings
  useEffect(() => {
    if (settings) {
      setForm({
        botEnabled: settings.botEnabled || false,
        useUserToken: settings.useUserToken || false,
        articleChannelId: settings.channels?.article?.channelId || "",
        articleChannelType: settings.channels?.article?.channelType || "forum",
        articleWebhookUrl: settings.channels?.article?.webhookUrl || "",
        videoChannelId: settings.channels?.video?.channelId || "",
        videoChannelType: settings.channels?.video?.channelType || "text",
        videoWebhookUrl: settings.channels?.video?.webhookUrl || "",
        newsChannelId: settings.channels?.news?.channelId || "",
        newsChannelType: settings.channels?.news?.channelType || "text",
        newsWebhookUrl: settings.channels?.news?.webhookUrl || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const channels: {
        article?: ChannelConfig;
        video?: ChannelConfig;
        news?: ChannelConfig;
      } = {};

      if (form.articleChannelId.trim()) {
        channels.article = {
          channelId: form.articleChannelId.trim(),
          channelType: form.articleChannelType,
          webhookUrl: form.articleWebhookUrl.trim() || undefined,
        } as ChannelConfig;
      }

      if (form.videoChannelId.trim()) {
        channels.video = {
          channelId: form.videoChannelId.trim(),
          channelType: form.videoChannelType,
          webhookUrl: form.videoWebhookUrl.trim() || undefined,
        } as ChannelConfig;
      }

      if (form.newsChannelId.trim()) {
        channels.news = {
          channelId: form.newsChannelId.trim(),
          channelType: form.newsChannelType,
          webhookUrl: form.newsWebhookUrl.trim() || undefined,
        } as ChannelConfig;
      }

      await updateSettings({
        useUserToken: form.useUserToken,
        botEnabled: form.botEnabled,
        channels,
      });
      setMessage({ type: "success", text: "Discord settings saved!" });
    } catch (error) {
      setMessage({ type: "error", text: `Failed to save: ${error}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>
          <MessageCircle size={20} /> Discord Blog Integration
        </SectionTitle>
        <HelpLink
          href="https://discord.com/developers/docs/topics/threads"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs <ExternalLink size={14} />
        </HelpLink>
      </SectionHeader>

      <SectionDescription>
        Automatically publish blog posts to Discord and sync comments bidirectionally with forum threads.
      </SectionDescription>

      {message && (
        <Message $type={message.type}>
          {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </Message>
      )}

      {/* Master toggles */}
      <FormGrid>
        <FormGroup>
          <ToggleRow>
            <ToggleLabel>
              <span>Enable Discord Integration</span>
              <ToggleHelpText>
                {form.botEnabled
                  ? "Posts will be published to Discord"
                  : "Discord publishing disabled"}
              </ToggleHelpText>
            </ToggleLabel>
            <Toggle
              type="checkbox"
              checked={form.botEnabled}
              onChange={(e) => setForm({ ...form, botEnabled: e.target.checked })}
            />
          </ToggleRow>
        </FormGroup>

        <FormGroup>
          <ToggleRow>
            <ToggleLabel>
              <span>Post as User Account</span>
              <ToggleHelpText>
                {form.useUserToken
                  ? "Uses DISCORD_USER_TOKEN env var"
                  : "Posts via bot account"}
              </ToggleHelpText>
            </ToggleLabel>
            <Toggle
              type="checkbox"
              checked={form.useUserToken}
              onChange={(e) => setForm({ ...form, useUserToken: e.target.checked })}
            />
          </ToggleRow>
        </FormGroup>
      </FormGrid>

      {/* Channel configs */}
      <SubSection>
        <SubSectionTitle>
          <MessagesSquare size={16} /> Articles Channel
        </SubSectionTitle>
        <ChannelHelpText>
          Forum channels enable threaded discussions. Text channels are announcement-only.
        </ChannelHelpText>
        <FormGrid>
          <FormGroup>
            <Label>Channel ID</Label>
            <Input
              value={form.articleChannelId}
              onChange={(e) => setForm({ ...form, articleChannelId: e.target.value })}
              placeholder="123456789..."
            />
          </FormGroup>
          <FormGroup>
            <Label>Channel Type</Label>
            <Select
              value={form.articleChannelType}
              onChange={(e) =>
                setForm({ ...form, articleChannelType: e.target.value as "forum" | "text" })
              }
            >
              <option value="forum">Forum (threaded comments)</option>
              <option value="text">Text (announcements only)</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Webhook URL {form.articleChannelType === "forum" && "(for comment sync)"}</Label>
            <Input
              value={form.articleWebhookUrl}
              onChange={(e) => setForm({ ...form, articleWebhookUrl: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..."
            />
            {form.articleChannelType === "forum" && (
              <FieldHint>Required to sync website comments to Discord threads</FieldHint>
            )}
          </FormGroup>
        </FormGrid>
      </SubSection>

      <SubSection>
        <SubSectionTitle>
          <Hash size={16} /> Videos Channel
        </SubSectionTitle>
        <ChannelHelpText>Recommended: Text channel for video announcements.</ChannelHelpText>
        <FormGrid>
          <FormGroup>
            <Label>Channel ID</Label>
            <Input
              value={form.videoChannelId}
              onChange={(e) => setForm({ ...form, videoChannelId: e.target.value })}
              placeholder="123456789..."
            />
          </FormGroup>
          <FormGroup>
            <Label>Channel Type</Label>
            <Select
              value={form.videoChannelType}
              onChange={(e) =>
                setForm({ ...form, videoChannelType: e.target.value as "forum" | "text" })
              }
            >
              <option value="forum">Forum (threaded comments)</option>
              <option value="text">Text (announcements only)</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Webhook URL {form.videoChannelType === "forum" && "(for comment sync)"}</Label>
            <Input
              value={form.videoWebhookUrl}
              onChange={(e) => setForm({ ...form, videoWebhookUrl: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..."
            />
            {form.videoChannelType === "forum" && (
              <FieldHint>Required to sync website comments to Discord threads</FieldHint>
            )}
          </FormGroup>
        </FormGrid>
      </SubSection>

      <SubSection>
        <SubSectionTitle>
          <Hash size={16} /> News Channel
        </SubSectionTitle>
        <ChannelHelpText>Short news snippets, typically text channel.</ChannelHelpText>
        <FormGrid>
          <FormGroup>
            <Label>Channel ID</Label>
            <Input
              value={form.newsChannelId}
              onChange={(e) => setForm({ ...form, newsChannelId: e.target.value })}
              placeholder="123456789..."
            />
          </FormGroup>
          <FormGroup>
            <Label>Channel Type</Label>
            <Select
              value={form.newsChannelType}
              onChange={(e) =>
                setForm({ ...form, newsChannelType: e.target.value as "forum" | "text" })
              }
            >
              <option value="forum">Forum (threaded comments)</option>
              <option value="text">Text (announcements only)</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Webhook URL {form.newsChannelType === "forum" && "(for comment sync)"}</Label>
            <Input
              value={form.newsWebhookUrl}
              onChange={(e) => setForm({ ...form, newsWebhookUrl: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..."
            />
            {form.newsChannelType === "forum" && (
              <FieldHint>Required to sync website comments to Discord threads</FieldHint>
            )}
          </FormGroup>
        </FormGrid>
      </SubSection>

      <ActionRow>
        <ActionButton onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </ActionButton>
      </ActionRow>

      <InfoBox>
        <strong>Setup Instructions:</strong>
        <ol>
          <li>Ensure the Discord bot is running with forum thread permissions</li>
          <li>Get channel IDs by right-clicking channels in Discord (Developer Mode)</li>
          <li>For text channels, create a webhook and paste the URL</li>
          <li>Forum channels use the bot directly (no webhook needed)</li>
          <li>
            Add <code>BOT_API_URL</code> and <code>DISCORD_WORMHOLE_SECRET</code> to Convex
            environment
          </li>
          <li>
            Optional: Add <code>DISCORD_USER_TOKEN</code> to post as your user account
          </li>
        </ol>
      </InfoBox>
    </Section>
  );
}

// Styled Components
const Container = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const AdminContainer = styled(Container)`
  padding-top: 20px;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 8px;
`;

const Text = styled.p`
  color: ${(p) => p.theme.textColor};
  margin: 0;
`;

const Section = styled.section`
  background: ${(p) => p.theme.borderColor || "#222"};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0;
`;

const SectionDescription = styled.p`
  color: ${(p) => p.theme.textColor};
  font-size: 14px;
  margin: 0 0 20px;
`;

const HelpLink = styled.a`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${(p) => p.theme.textColor};
  font-size: 13px;
  text-decoration: none;

  &:hover {
    color: ${(p) => p.theme.contrast};
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${(p) => p.theme.contrast};
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${(p) => p.theme.background};
  border-radius: 8px;
  background: ${(p) => p.theme.background};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.contrast};
  }

  &::placeholder {
    color: ${(p) => p.theme.textColor};
    opacity: 0.6;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${(p) => p.theme.background};
  border-radius: 8px;
  background: ${(p) => p.theme.background};
  color: ${(p) => p.theme.contrast};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.contrast};
  }
`;

const HelpText = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
`;

const FieldHint = styled.span`
  display: block;
  font-size: 11px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.6;
  margin-top: 4px;
`;

const ToggleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: ${(p) => p.theme.background};
  border-radius: 8px;
`;

const ToggleLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: 14px;
    color: ${(p) => p.theme.contrast};
  }
`;

const ToggleHelpText = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
`;

const Toggle = styled.input`
  width: 44px;
  height: 24px;
  appearance: none;
  background: ${(p) => p.theme.textColor};
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;

  &:checked {
    background: #22c55e;
  }

  &::after {
    content: "";
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
  }

  &:checked::after {
    transform: translateX(20px);
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const ActionButton = styled.button<{ $secondary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$secondary ? p.theme.background : p.theme.contrast)};
  color: ${(p) => (p.$secondary ? p.theme.contrast : p.theme.background)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const StatusBox = styled.div`
  padding: 16px;
  background: ${(p) => p.theme.background};
  border-radius: 8px;
  margin-bottom: 20px;
`;

const StatusLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${(p) => p.theme.textColor};
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIndicator = styled.div<{ $active?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(p) => (p.$active ? "#22c55e" : "#ef4444")};
`;

const StatusText = styled.span`
  font-size: 14px;
  color: ${(p) => p.theme.contrast};
`;

const StatusMeta = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  margin-top: 4px;
`;

const Message = styled.div<{ $type: "success" | "error" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  background: ${(p) => (p.$type === "success" ? "#22c55e20" : "#ef444420")};
  color: ${(p) => (p.$type === "success" ? "#22c55e" : "#ef4444")};
  border: 1px solid ${(p) => (p.$type === "success" ? "#22c55e40" : "#ef444440")};
`;

const InfoBox = styled.div`
  padding: 16px;
  background: ${(p) => p.theme.background};
  border-radius: 8px;
  font-size: 14px;
  color: ${(p) => p.theme.textColor};

  strong {
    color: ${(p) => p.theme.contrast};
  }

  ol {
    margin: 12px 0 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 8px;
  }

  a {
    color: ${(p) => p.theme.contrast};
  }

  code {
    background: ${(p) => p.theme.borderColor || "#333"};
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
`;

const SubSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background: ${(p) => p.theme.background};
  border-radius: 12px;
`;

const SubSectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 4px;
`;

const ChannelHelpText = styled.p`
  font-size: 12px;
  color: ${(p) => p.theme.textColor};
  opacity: 0.7;
  margin: 0 0 16px;
`;
