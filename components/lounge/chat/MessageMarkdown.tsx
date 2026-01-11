/**
 * Lightweight Markdown Parser for Chat Messages
 *
 * Supports Discord-style markdown:
 * - **bold** and __bold__
 * - *italic* and _italic_
 * - ~~strikethrough~~
 * - `inline code`
 * - ```code blocks```
 * - > blockquotes
 * - [links](url)
 * - Discord emojis <:name:id>
 * - User mentions <@discordId> or <@n:clerkId>
 *
 * Designed for performance - no heavy dependencies, just regex parsing.
 */

import { useQuery } from "convex/react";
import { Highlight, themes } from "prism-react-renderer";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { UserPopoutTrigger } from "../user-popout/UserPopoutTrigger";

// Discord emoji regex
const DISCORD_EMOJI_REGEX = /<(a?):(\w+):(\d+)>/g;

interface MarkdownProps {
  content: string;
  mega?: boolean;
}

// Check if message is emoji-only (1-5 emojis, no other text)
const UNICODE_EMOJI_REGEX = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

function isEmojiOnlyMessage(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  // Remove Discord custom emojis and unicode emojis, check if anything remains
  const withoutDiscordEmojis = trimmed.replace(DISCORD_EMOJI_REGEX, "");
  const withoutAllEmojis = withoutDiscordEmojis.replace(UNICODE_EMOJI_REGEX, "").trim();

  if (withoutAllEmojis.length > 0) return false;

  // Count total emojis
  const discordEmojiCount = (trimmed.match(DISCORD_EMOJI_REGEX) || []).length;
  const unicodeEmojiCount = (trimmed.match(UNICODE_EMOJI_REGEX) || []).length;
  const totalEmojis = discordEmojiCount + unicodeEmojiCount;

  return totalEmojis >= 1 && totalEmojis <= 5;
}

// Token types for our simple parser
interface BaseToken {
  type: string;
  content: string;
}

interface TextToken extends BaseToken {
  type: "text" | "bold" | "italic" | "strikethrough" | "code" | "blockquote" | "newline";
}

interface CodeBlockToken extends BaseToken {
  type: "codeblock";
  language: string;
}

interface LinkToken extends BaseToken {
  type: "link";
  url: string;
}

interface AudioToken extends BaseToken {
  type: "audio";
  url: string;
}

interface VideoToken extends BaseToken {
  type: "video";
  url: string;
}

interface DiscordEmojiToken extends BaseToken {
  type: "discordEmoji";
  animated: boolean;
  emojiId: string;
  emojiName: string;
}

interface UserMentionToken extends BaseToken {
  type: "userMention";
  mentionType: "discord" | "clerk";
  userId: string; // Discord ID or Clerk ID
}

type Token =
  | TextToken
  | CodeBlockToken
  | LinkToken
  | AudioToken
  | VideoToken
  | DiscordEmojiToken
  | UserMentionToken;

// Audio file extensions to detect
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|m4a|flac)$/i;

// Video file extensions to detect
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv)$/i;

// Parse markdown into tokens
function parseMarkdown(text: string): Token[] {
  const tokens: Token[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let matched = false;

    // Code blocks (```lang\ncode```)
    const codeBlockMatch = remaining.match(/^```(\w*)\n?([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[2] !== undefined) {
      const token: CodeBlockToken = {
        type: "codeblock",
        content: codeBlockMatch[2],
        language: codeBlockMatch[1] || "text",
      };
      tokens.push(token);
      remaining = remaining.slice(codeBlockMatch[0].length);
      matched = true;
      continue;
    }

    // Inline code (`code`)
    const inlineCodeMatch = remaining.match(/^`([^`\n]+)`/);
    if (inlineCodeMatch && inlineCodeMatch[1]) {
      tokens.push({ type: "code", content: inlineCodeMatch[1] });
      remaining = remaining.slice(inlineCodeMatch[0].length);
      matched = true;
      continue;
    }

    // User mentions: <@discordId> or <@n:clerkId>
    const userMentionMatch = remaining.match(/^<@(n:)?(\d+|[a-zA-Z0-9_]+)>/);
    if (userMentionMatch && userMentionMatch[2]) {
      const isClerkId = userMentionMatch[1] === "n:";
      const token: UserMentionToken = {
        type: "userMention",
        content: userMentionMatch[0],
        mentionType: isClerkId ? "clerk" : "discord",
        userId: userMentionMatch[2],
      };
      tokens.push(token);
      remaining = remaining.slice(userMentionMatch[0].length);
      matched = true;
      continue;
    }

    // Discord custom emoji
    const discordEmojiMatch = remaining.match(/^<(a?):(\w+):(\d+)>/);
    if (discordEmojiMatch && discordEmojiMatch[2] && discordEmojiMatch[3]) {
      const token: DiscordEmojiToken = {
        type: "discordEmoji",
        content: discordEmojiMatch[0],
        animated: discordEmojiMatch[1] === "a",
        emojiName: discordEmojiMatch[2],
        emojiId: discordEmojiMatch[3],
      };
      tokens.push(token);
      remaining = remaining.slice(discordEmojiMatch[0].length);
      matched = true;
      continue;
    }

    // Links [text](url) - only allow http/https URLs for security
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch[1] && linkMatch[2]) {
      const linkUrl = linkMatch[2];
      // Security: Only allow http/https URLs to prevent javascript: injection
      if (/^https?:\/\//i.test(linkUrl)) {
        const token: LinkToken = { type: "link", content: linkMatch[1], url: linkUrl };
        tokens.push(token);
      } else {
        // Treat as plain text if URL is not http/https
        tokens.push({ type: "text", content: linkMatch[0] });
      }
      remaining = remaining.slice(linkMatch[0].length);
      matched = true;
      continue;
    }

    // Auto-link URLs (check for audio/video files first)
    const urlMatch = remaining.match(/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/);
    if (urlMatch && urlMatch[1]) {
      const url = urlMatch[1];
      // Check if it's an audio file
      if (AUDIO_EXTENSIONS.test(url)) {
        const token: AudioToken = { type: "audio", content: url, url };
        tokens.push(token);
      } else if (VIDEO_EXTENSIONS.test(url)) {
        const token: VideoToken = { type: "video", content: url, url };
        tokens.push(token);
      } else {
        const token: LinkToken = { type: "link", content: url, url };
        tokens.push(token);
      }
      remaining = remaining.slice(urlMatch[0].length);
      matched = true;
      continue;
    }

    // Bold (**text** or __text__)
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch && boldMatch[2]) {
      tokens.push({ type: "bold", content: boldMatch[2] });
      remaining = remaining.slice(boldMatch[0].length);
      matched = true;
      continue;
    }

    // Italic (*text* or _text_) - but not inside words for underscore
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch && italicMatch[2]) {
      tokens.push({ type: "italic", content: italicMatch[2] });
      remaining = remaining.slice(italicMatch[0].length);
      matched = true;
      continue;
    }

    // Strikethrough (~~text~~)
    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch && strikeMatch[1]) {
      tokens.push({ type: "strikethrough", content: strikeMatch[1] });
      remaining = remaining.slice(strikeMatch[0].length);
      matched = true;
      continue;
    }

    // Blockquote (> text) - only at start of line
    if (remaining.startsWith("> ") || (tokens.length === 0 && remaining.startsWith(">"))) {
      const lineEnd = remaining.indexOf("\n");
      const quoteContent = lineEnd === -1 ? remaining.slice(2) : remaining.slice(2, lineEnd);
      tokens.push({ type: "blockquote", content: quoteContent.trim() });
      remaining = lineEnd === -1 ? "" : remaining.slice(lineEnd);
      matched = true;
      continue;
    }

    // Newlines
    if (remaining.startsWith("\n")) {
      tokens.push({ type: "newline", content: "\n" });
      remaining = remaining.slice(1);
      matched = true;
      continue;
    }

    // Plain text - consume until next special character
    if (!matched) {
      const nextSpecial = remaining.search(/[*_~`<[\n]|https?:\/\//);
      if (nextSpecial === -1) {
        tokens.push({ type: "text", content: remaining });
        remaining = "";
      } else if (nextSpecial === 0) {
        // Special char but didn't match a pattern, treat as text
        tokens.push({ type: "text", content: remaining.charAt(0) });
        remaining = remaining.slice(1);
      } else {
        tokens.push({ type: "text", content: remaining.slice(0, nextSpecial) });
        remaining = remaining.slice(nextSpecial);
      }
    }
  }

  return tokens;
}

// Render a single token
function renderToken(token: Token, index: number, mega: boolean): React.ReactNode {
  if (token.type === "text") {
    return <span key={index}>{token.content}</span>;
  }
  if (token.type === "bold") {
    return <Bold key={index}>{token.content}</Bold>;
  }
  if (token.type === "italic") {
    return <Italic key={index}>{token.content}</Italic>;
  }
  if (token.type === "strikethrough") {
    return <Strikethrough key={index}>{token.content}</Strikethrough>;
  }
  if (token.type === "code") {
    return <InlineCode key={index}>{token.content}</InlineCode>;
  }
  if (token.type === "codeblock") {
    return (
      <CodeBlockWrapper key={index}>
        <CodeBlock code={token.content} language={token.language} />
      </CodeBlockWrapper>
    );
  }
  if (token.type === "link") {
    return (
      <Link key={index} href={token.url} target="_blank" rel="noopener noreferrer">
        {token.content}
      </Link>
    );
  }
  if (token.type === "audio") {
    return <AudioPlayer key={index} url={token.url} />;
  }
  if (token.type === "video") {
    return <VideoPlayer key={index} url={token.url} />;
  }
  if (token.type === "blockquote") {
    return <Blockquote key={index}>{token.content}</Blockquote>;
  }
  if (token.type === "discordEmoji") {
    const ext = token.animated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${token.emojiId}.${ext}`;
    return (
      <DiscordEmoji
        key={index}
        src={url}
        alt={`:${token.emojiName}:`}
        title={`:${token.emojiName}:`}
        $mega={mega}
      />
    );
  }
  if (token.type === "newline") {
    return <br key={index} />;
  }
  if (token.type === "userMention") {
    return (
      <UserMention
        key={index}
        mentionType={token.mentionType}
        userId={token.userId}
        rawContent={token.content}
      />
    );
  }
  return <span key={index}>{token.content}</span>;
}

// User Mention component - resolves user ID and shows popout on click
interface UserMentionProps {
  mentionType: "discord" | "clerk";
  userId: string;
  rawContent: string;
}

const UserMention = memo(function UserMention({
  mentionType,
  userId,
  rawContent,
}: UserMentionProps) {
  // Query to resolve the mention
  const resolved = useQuery(
    api.users.resolveMentions,
    mentionType === "discord"
      ? { discordIds: [userId], clerkIds: [] }
      : { discordIds: [], clerkIds: [userId] },
  );

  // Get the resolved user
  const key = mentionType === "discord" ? `discord:${userId}` : `clerk:${userId}`;
  const user = resolved?.[key];

  // If we're still loading or user not found, show raw content or placeholder
  if (!resolved) {
    return <MentionSpan $loading>@...</MentionSpan>;
  }

  if (!user) {
    // User not found - show the raw mention
    return <MentionSpan $unknown>{rawContent}</MentionSpan>;
  }

  // Render as clickable mention with popout
  return (
    <UserPopoutTrigger userId={user._id as Id<"users">}>
      <MentionSpan $tier={user.tier as "tier1" | "tier2"}>@{user.displayName}</MentionSpan>
    </UserPopoutTrigger>
  );
});

// Audio Player component
interface AudioPlayerProps {
  url: string;
  soundcloudUrl?: string;
}

const AudioPlayer = memo(function AudioPlayer({ url, soundcloudUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  }, []);

  const handleDownloadClick = useCallback(() => {
    if (soundcloudUrl) {
      setShowDownloadMenu((prev) => !prev);
    } else {
      // Direct download
      window.open(url, "_blank");
    }
  }, [soundcloudUrl, url]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showDownloadMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDownloadMenu]);

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Extract filename from URL
  const filename = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "Audio");

  return (
    <AudioContainer>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <PlayButton onClick={togglePlay} $playing={isPlaying}>
        {isPlaying ? "⏸" : "▶"}
      </PlayButton>
      <AudioInfo>
        <AudioFilename>{filename}</AudioFilename>
        <ProgressBar onClick={handleSeek}>
          <ProgressFill style={{ width: `${progress}%` }} />
        </ProgressBar>
        <AudioTime>
          {formatTime(currentTime)} / {formatTime(duration)}
        </AudioTime>
      </AudioInfo>
      <DownloadButtonWrapper ref={downloadMenuRef}>
        <DownloadButton onClick={handleDownloadClick} title="Download">
          <DownloadIcon />
        </DownloadButton>
        {showDownloadMenu && soundcloudUrl && (
          <DownloadMenu>
            <DownloadMenuItem href={soundcloudUrl} target="_blank" rel="noopener noreferrer">
              <SoundCloudIcon />
              <span>SoundCloud</span>
            </DownloadMenuItem>
            <DownloadMenuItem href={url} target="_blank" rel="noopener noreferrer">
              <DownloadIcon />
              <span>Direct Download</span>
            </DownloadMenuItem>
          </DownloadMenu>
        )}
      </DownloadButtonWrapper>
    </AudioContainer>
  );
});

// Video Player component
interface VideoPlayerProps {
  url: string;
}

const VideoPlayer = memo(function VideoPlayer({ url }: VideoPlayerProps) {
  const handleDownload = useCallback(() => {
    window.open(url, "_blank");
  }, [url]);

  // Extract filename from URL
  const filename = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "Video");

  return (
    <VideoContainer>
      <VideoElement controls preload="metadata">
        <source src={url} />
        Your browser does not support the video tag.
      </VideoElement>
      <VideoControls>
        <VideoFilename>{filename}</VideoFilename>
        <DownloadButton onClick={handleDownload} title="Download">
          <DownloadIcon />
        </DownloadButton>
      </VideoControls>
    </VideoContainer>
  );
});

// Download icon SVG
const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// SoundCloud icon SVG
const SoundCloudIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.19-1.334c-.01-.057-.054-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.059-.104-.12-.104m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.24-2.544-.24-2.64c-.015-.074-.074-.135-.149-.135l-.017-.001m.93-.104c-.09 0-.165.074-.18.164l-.18 2.73.195 2.563c.014.091.09.164.18.164.089 0 .164-.074.179-.164l.21-2.563-.21-2.73c-.015-.091-.09-.164-.18-.164m.96-.073c-.105 0-.195.09-.195.195l-.165 2.79.18 2.534c0 .104.09.194.194.194.104 0 .194-.09.194-.194l.195-2.534-.195-2.79c0-.105-.089-.195-.194-.195m.974-.06c-.119 0-.209.09-.224.21l-.165 2.834.165 2.519c.015.12.105.21.224.21.12 0 .21-.09.225-.21l.18-2.519-.18-2.834c-.015-.12-.105-.21-.225-.21m.99-.03c-.135 0-.24.105-.24.24l-.149 2.849.149 2.504c0 .135.105.24.24.24.135 0 .24-.105.255-.24l.165-2.504-.165-2.849c-.015-.135-.12-.24-.255-.24m1.005-.015c-.15 0-.27.12-.27.27l-.135 2.85.135 2.489c0 .149.12.27.27.27.149 0 .27-.12.27-.27l.165-2.489-.165-2.85c0-.15-.12-.27-.27-.27m1.02 0c-.164 0-.3.135-.3.3l-.119 2.835.119 2.474c0 .165.135.3.3.3.164 0 .3-.135.3-.3l.135-2.474-.135-2.835c0-.165-.135-.3-.3-.3m1.006.015c-.18 0-.315.135-.315.315l-.105 2.82.105 2.46c0 .18.135.315.315.315.18 0 .33-.135.33-.315l.12-2.46-.12-2.82c0-.18-.15-.315-.33-.315m1.02.03c-.195 0-.345.15-.36.345l-.09 2.789.09 2.43c.015.195.165.345.36.345.194 0 .345-.15.359-.345l.105-2.43-.105-2.79c-.015-.195-.165-.345-.36-.345m1.036.045c-.21 0-.375.165-.375.375l-.075 2.76.075 2.414c0 .21.165.375.375.375.21 0 .375-.165.39-.375l.09-2.414-.09-2.76c-.015-.21-.18-.375-.39-.375m1.021.061c-.225 0-.405.18-.405.405l-.06 2.73.06 2.399c0 .225.18.405.405.405.225 0 .405-.18.42-.405l.075-2.399-.075-2.73c-.015-.225-.195-.405-.42-.405m1.036.075c-.24 0-.435.195-.435.435l-.045 2.685.045 2.37c0 .24.195.435.435.435.24 0 .435-.195.45-.435l.06-2.37-.06-2.685c-.015-.24-.21-.435-.45-.435m1.02.09c-.256 0-.45.195-.465.45l-.03 2.64.03 2.34c.015.255.21.45.465.45.255 0 .45-.195.465-.45l.045-2.34-.045-2.64c-.015-.255-.21-.45-.465-.45m1.021.105c-.27 0-.48.21-.495.48l-.015 2.58.015 2.31c.015.27.225.48.495.48.269 0 .48-.21.494-.48l.03-2.31-.03-2.58c-.015-.27-.225-.48-.494-.48m1.875-.39c-.33 0-.66.135-.9.375-.135-2.955-2.595-5.295-5.595-5.295-.705 0-1.395.135-2.01.375-.255.105-.33.21-.345.405v10.56c.015.21.165.375.375.39h8.475c1.425 0 2.58-1.155 2.58-2.595 0-1.425-1.155-2.595-2.58-2.595" />
  </svg>
);

// Simple code block with syntax highlighting
const CodeBlock = memo(function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <Highlight theme={themes.shadesOfPurple} code={code.trim()} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Pre className={className} style={style}>
          {tokens.map((line, i) => (
            <Line key={i} {...getLineProps({ line })}>
              <LineNo>{i + 1}</LineNo>
              <LineContent>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </LineContent>
            </Line>
          ))}
        </Pre>
      )}
    </Highlight>
  );
});

// Main component
export const MessageMarkdown = memo(function MessageMarkdown({ content }: MarkdownProps) {
  const mega = useMemo(() => isEmojiOnlyMessage(content), [content]);
  const tokens = useMemo(() => parseMarkdown(content), [content]);

  return (
    <MessageText $mega={mega}>
      {tokens.map((token, index) => renderToken(token, index, mega))}
    </MessageText>
  );
});

// Styled Components
const MessageText = styled.span<{ $mega?: boolean }>`
  font-size: ${(props) => (props.$mega ? "2.5rem" : "inherit")};
  line-height: ${(props) => (props.$mega ? "1.2" : "inherit")};
  display: ${(props) => (props.$mega ? "flex" : "inline")};
  align-items: center;
  gap: ${(props) => (props.$mega ? "0.25rem" : "0")};
  min-height: ${(props) => (props.$mega ? "3rem" : "auto")};
`;

const Bold = styled.strong`
  font-weight: 700;
  color: #fff;
`;

const Italic = styled.em`
  font-style: italic;
`;

const Strikethrough = styled.del`
  text-decoration: line-through;
  opacity: 0.7;
`;

const InlineCode = styled.code`
  background: rgba(0, 0, 0, 0.4);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: #e9a6ff;
`;

const Link = styled.a`
  color: ${LOUNGE_COLORS.tier1};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

// User Mention styles
const MentionSpan = styled.span<{
  $tier?: "tier1" | "tier2";
  $loading?: boolean;
  $unknown?: boolean;
}>`
  display: inline;
  padding: 0 4px;
  border-radius: 4px;
  font-weight: 500;
  cursor: ${(props) => (props.$unknown ? "default" : "pointer")};
  transition: background 0.15s ease;

  ${(props) => {
    if (props.$loading) {
      return `
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.5);
      `;
    }
    if (props.$unknown) {
      return `
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.4);
      `;
    }
    // Tier-based coloring
    const color = props.$tier === "tier2" ? LOUNGE_COLORS.tier2 : LOUNGE_COLORS.tier1;
    return `
      background: ${color}22;
      color: ${color};

      &:hover {
        background: ${color}44;
      }
    `;
  }}
`;

// Audio Player styles
const AudioContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  margin: 8px 0;
  max-width: 400px;
`;

const PlayButton = styled.button<{ $playing?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${(props) => (props.$playing ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.1)")};
  color: ${(props) => (props.$playing ? "#000" : "#fff")};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$playing ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.2)")};
    transform: scale(1.05);
  }
`;

const AudioInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const AudioFilename = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    height: 8px;
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 3px;
  transition: width 0.1s linear;
`;

const AudioTime = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font-mono);
`;

// Video Player styles
const VideoContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  margin: 8px 0;
  max-width: 500px;
  overflow: hidden;
`;

const VideoElement = styled.video`
  width: 100%;
  max-height: 350px;
  background: #000;
  display: block;
`;

const VideoControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
`;

const VideoFilename = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 8px;
`;

const DownloadButtonWrapper = styled.div`
  position: relative;
`;

const DownloadButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`;

const DownloadMenu = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  overflow: hidden;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
`;

const DownloadMenuItem = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 0.85rem;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:first-child {
    color: #ff5500;
  }

  svg {
    flex-shrink: 0;
  }
`;

const Blockquote = styled.span`
  display: block;
  border-left: 3px solid ${LOUNGE_COLORS.glassBorder};
  padding-left: 0.75rem;
  margin: 0.25rem 0;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
`;

const DiscordEmoji = styled.img<{ $mega?: boolean }>`
  display: inline-block;
  width: ${(props) => (props.$mega ? "48px" : "1.375em")};
  height: ${(props) => (props.$mega ? "48px" : "1.375em")};
  vertical-align: middle;
  object-fit: contain;
  margin: 0 2px;
`;

const CodeBlockWrapper = styled.div`
  margin: 0.5rem 0;
  width: 100%;
`;

const Pre = styled.pre`
  margin: 0;
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.8rem;
  line-height: 1.4;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const Line = styled.div`
  display: table-row;
`;

const LineNo = styled.span`
  display: table-cell;
  text-align: right;
  padding-right: 1em;
  user-select: none;
  opacity: 0.4;
  font-size: 0.75rem;
`;

const LineContent = styled.span`
  display: table-cell;
  white-space: pre-wrap;
  word-break: break-word;
`;

export default MessageMarkdown;
