import { useState, useEffect, useRef, useCallback, memo } from "react";
import styled from "styled-components";
import { Hash, Megaphone, MessageCircle, Sparkles, Crown, Star } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import type { Id } from "../../../convex/_generated/dataModel";

// Types for users and channels from queries
interface MentionUser {
  _id: Id<"users">;
  clerkId: string;
  discordId: string | null;
  displayName: string;
  avatarUrl: string | null;
  tier: "tier1" | "tier2";
  isCreator: boolean;
}

interface MentionChannel {
  _id: Id<"channels">;
  name: string;
  slug: string;
  icon: string;
}

export type MentionType = "user" | "channel";

export interface MentionSelection {
  type: MentionType;
  // For users
  user?: MentionUser;
  // For channels
  channel?: MentionChannel;
  // The formatted string to insert
  insertText: string;
  // Display text for the mention
  displayText: string;
}

interface MentionAutocompleteProps {
  type: MentionType;
  query: string;
  position: { top: number; left: number };
  onSelect: (selection: MentionSelection) => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

// Icon mapping for channels
const CHANNEL_ICONS: Record<string, typeof Hash> = {
  megaphone: Megaphone,
  "message-circle": MessageCircle,
  sparkles: Sparkles,
  crown: Crown,
  star: Star,
  hash: Hash,
};

export const MentionAutocomplete = memo(function MentionAutocomplete({
  type,
  query,
  position,
  onSelect,
  onClose,
  selectedIndex,
  onSelectedIndexChange,
}: MentionAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch data based on type
  const users = useQuery(
    api.users.searchUsers,
    type === "user" ? { query, limit: 10 } : "skip"
  ) as MentionUser[] | undefined;

  const channels = useQuery(
    api.channels.listForMention,
    type === "channel" ? {} : "skip"
  ) as MentionChannel[] | undefined;

  // Filter channels by query on client side
  const filteredChannels = channels?.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  const items = type === "user" ? users : filteredChannels;
  const itemCount = items?.length ?? 0;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Reset selection when items change
  useEffect(() => {
    if (itemCount > 0 && selectedIndex >= itemCount) {
      onSelectedIndexChange(0);
    }
  }, [itemCount, selectedIndex, onSelectedIndexChange]);

  const handleSelect = useCallback((item: MentionUser | MentionChannel) => {
    if (type === "user") {
      const user = item as MentionUser;
      // Use Discord ID if available, otherwise fall back to Clerk ID format
      const insertText = user.discordId
        ? `<@${user.discordId}>`
        : `<@n:${user.clerkId}>`;

      onSelect({
        type: "user",
        user,
        insertText,
        displayText: `@${user.displayName}`,
      });
    } else {
      const channel = item as MentionChannel;
      // Use our custom channel mention format with Convex ID
      const insertText = `<#c:${channel._id}>`;

      onSelect({
        type: "channel",
        channel,
        insertText,
        displayText: `#${channel.name}`,
      });
    }
  }, [type, onSelect]);

  if (!items || items.length === 0) {
    return (
      <Container ref={containerRef} style={{ top: position.top, left: position.left }}>
        <EmptyState>
          {type === "user" ? "No users found" : "No channels found"}
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container ref={containerRef} style={{ top: position.top, left: position.left }}>
      <Header>{type === "user" ? "Users" : "Channels"}</Header>
      <List>
        {type === "user"
          ? (items as MentionUser[]).map((user, index) => (
              <UserItem
                key={user._id}
                $isSelected={index === selectedIndex}
                onClick={() => handleSelect(user)}
                onMouseEnter={() => onSelectedIndexChange(index)}
              >
                <UserAvatar src={user.avatarUrl ?? undefined} alt={user.displayName} />
                <UserInfo>
                  <UserName $tier={user.tier}>
                    {user.displayName}
                    {user.isCreator && <CreatorBadge>Creator</CreatorBadge>}
                  </UserName>
                </UserInfo>
              </UserItem>
            ))
          : (items as MentionChannel[]).map((channel, index) => {
              const IconComponent = CHANNEL_ICONS[channel.icon] ?? Hash;
              return (
                <ChannelItem
                  key={channel._id}
                  $isSelected={index === selectedIndex}
                  onClick={() => handleSelect(channel)}
                  onMouseEnter={() => onSelectedIndexChange(index)}
                >
                  <ChannelIconWrapper>
                    <IconComponent size={16} />
                  </ChannelIconWrapper>
                  <ChannelName>{channel.name}</ChannelName>
                </ChannelItem>
              );
            })}
      </List>
      <Footer>
        <kbd>↑↓</kbd> navigate <kbd>Tab</kbd> or <kbd>Enter</kbd> select <kbd>Esc</kbd> dismiss
      </Footer>
    </Container>
  );
});

// Styled Components
const Container = styled.div`
  position: absolute;
  z-index: 1000;
  min-width: 250px;
  max-width: 350px;
  max-height: 300px;
  background: rgba(25, 25, 30, 0.98);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem;
`;

const ItemBase = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  background: ${(p) => (p.$isSelected ? "rgba(255, 255, 255, 0.1)" : "transparent")};
  transition: background 0.1s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const UserItem = styled(ItemBase)``;

const UserAvatar = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: ${LOUNGE_COLORS.glassBorder};
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div<{ $tier: "tier1" | "tier2" }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(p) => (p.$tier === "tier2" ? LOUNGE_COLORS.tier2 : "#fff")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CreatorBadge = styled.span`
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.15rem 0.35rem;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  border-radius: 3px;
  color: #fff;
  text-transform: uppercase;
`;

const ChannelItem = styled(ItemBase)``;

const ChannelIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.6);
`;

const ChannelName = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
`;

const EmptyState = styled.div`
  padding: 1rem;
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
`;

const Footer = styled.div`
  padding: 0.4rem 0.75rem;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
  background: rgba(0, 0, 0, 0.2);

  kbd {
    display: inline-block;
    padding: 0.1rem 0.3rem;
    margin: 0 0.15rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    font-family: inherit;
    font-size: 0.6rem;
  }
`;

export default MentionAutocomplete;
