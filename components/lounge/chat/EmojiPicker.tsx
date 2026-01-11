import { useQuery } from "convex/react";
import { Car, Cat, Clock, Coffee, Flag, Hash, Heart, Search, Smile, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import { api } from "../../../convex/_generated/api";

// Discord custom emoji type
interface DiscordEmoji {
  id: string;
  name: string;
  animated: boolean;
}

// Simplified emoji data organized by category
const EMOJI_CATEGORIES = {
  recent: {
    icon: Clock,
    name: "Recently Used",
    emojis: [] as string[],
  },
  discord: {
    icon: Sparkles,
    name: "Server Emojis",
    emojis: [] as string[], // Populated from Discord
  },
  smileys: {
    icon: Smile,
    name: "Smileys & People",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
      "🥲",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "😮‍💨",
      "🤥",
      "😌",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🤢",
      "🤮",
      "🤧",
      "🥵",
      "🥶",
      "🥴",
      "😵",
      "🤯",
      "🤠",
      "🥳",
      "🥸",
      "😎",
      "🤓",
      "🧐",
      "😕",
      "😟",
      "🙁",
      "☹️",
      "😮",
      "😯",
      "😲",
      "😳",
      "🥺",
      "😦",
      "😧",
      "😨",
      "😰",
      "😥",
      "😢",
      "😭",
      "😱",
      "😖",
      "😣",
      "😞",
      "😓",
      "😩",
      "😫",
      "🥱",
      "😤",
      "😡",
      "😠",
      "🤬",
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "💪",
      "🦾",
      "🦿",
      "🦵",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🧠",
    ],
  },
  hearts: {
    icon: Heart,
    name: "Hearts & Love",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❤️‍🔥",
      "❤️‍🩹",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "♥️",
      "💌",
      "💋",
      "💍",
      "💎",
      "🌹",
      "🥀",
      "🌷",
      "🌸",
      "💐",
    ],
  },
  nature: {
    icon: Cat,
    name: "Animals & Nature",
    emojis: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🙈",
      "🙉",
      "🙊",
      "🐔",
      "🐧",
      "🐦",
      "🐤",
      "🦆",
      "🦅",
      "🦉",
      "🦇",
      "🐺",
      "🐗",
      "🐴",
      "🦄",
      "🐝",
      "🦋",
      "🐌",
      "🐞",
      "🐜",
      "🦟",
      "🦗",
      "🕷️",
      "🦂",
      "🐢",
      "🐍",
      "🦎",
      "🦖",
      "🦕",
      "🐙",
      "🦑",
      "🦐",
      "🦞",
      "🦀",
      "🐡",
      "🐠",
      "🐟",
      "🐬",
      "🐳",
      "🐋",
      "🦈",
      "🐊",
      "🐅",
      "🐆",
      "🦓",
      "🌵",
      "🎄",
      "🌲",
      "🌳",
      "🌴",
      "🌱",
      "🌿",
      "☘️",
      "🍀",
      "🎍",
      "🎋",
      "🍃",
      "🍂",
      "🍁",
      "🌾",
      "🌺",
      "🌻",
      "🌼",
      "🌸",
      "💮",
    ],
  },
  food: {
    icon: Coffee,
    name: "Food & Drink",
    emojis: [
      "🍎",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🥑",
      "🍆",
      "🥦",
      "🥬",
      "🥒",
      "🌶️",
      "🫑",
      "🌽",
      "🥕",
      "🫒",
      "🧄",
      "🧅",
      "🥔",
      "🍠",
      "🥐",
      "🥖",
      "🍞",
      "🥨",
      "🥯",
      "🧇",
      "🥞",
      "🧈",
      "🍳",
      "🥚",
      "🧀",
      "🥓",
      "🥩",
      "🍗",
      "🍖",
      "🦴",
      "🌭",
      "🍔",
      "🍟",
      "🍕",
      "🫓",
      "🥪",
      "🥙",
      "🧆",
      "🌮",
      "🌯",
      "🫔",
      "🥗",
      "🥘",
      "🫕",
      "🍝",
      "🍜",
      "🍲",
      "🍛",
      "🍣",
      "🍱",
      "🥟",
      "🦪",
      "🍤",
      "🍙",
      "☕",
      "🍵",
      "🧃",
      "🥤",
      "🧋",
      "🍶",
      "🍺",
      "🍻",
      "🥂",
      "🍷",
    ],
  },
  activities: {
    icon: Car,
    name: "Activities & Objects",
    emojis: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🪀",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🪃",
      "🥅",
      "⛳",
      "🪁",
      "🏹",
      "🎣",
      "🤿",
      "🥊",
      "🥋",
      "🎽",
      "🛹",
      "🛼",
      "🛷",
      "⛸️",
      "🥌",
      "🎿",
      "⛷️",
      "🏂",
      "🪂",
      "🏋️",
      "🎮",
      "🕹️",
      "🎲",
      "🧩",
      "♟️",
      "🎯",
      "🎳",
      "🎭",
      "🎨",
      "🎬",
      "🎤",
      "🎧",
      "🎼",
      "🎹",
      "🥁",
      "🪘",
      "🎷",
      "🎺",
      "🪗",
      "🎸",
      "🪕",
      "🎻",
      "🎪",
      "💻",
      "🖥️",
      "🖨️",
      "⌨️",
      "🖱️",
      "💾",
      "💿",
      "📱",
      "☎️",
      "📞",
      "📺",
      "📷",
      "📹",
      "🎥",
      "📽️",
      "🎞️",
      "📼",
      "🔍",
      "🔬",
      "🔭",
    ],
  },
  symbols: {
    icon: Hash,
    name: "Symbols",
    emojis: [
      "💯",
      "🔥",
      "✨",
      "⭐",
      "🌟",
      "💫",
      "⚡",
      "💥",
      "💢",
      "💦",
      "💨",
      "🕳️",
      "💣",
      "💬",
      "👁️‍🗨️",
      "🗨️",
      "🗯️",
      "💭",
      "💤",
      "🎵",
      "🎶",
      "✅",
      "❌",
      "❓",
      "❗",
      "‼️",
      "⁉️",
      "💲",
      "♻️",
      "🔱",
      "📛",
      "🔰",
      "⭕",
      "✔️",
      "☑️",
      "✖️",
      "➕",
      "➖",
      "➗",
      "➰",
      "➿",
      "〽️",
      "✳️",
      "✴️",
      "❇️",
      "©️",
      "®️",
      "™️",
      "🔴",
      "🟠",
      "🟡",
      "🟢",
      "🔵",
      "🟣",
      "⚫",
      "⚪",
      "🟤",
      "🔶",
      "🔷",
      "🔸",
    ],
  },
  flags: {
    icon: Flag,
    name: "Flags",
    emojis: [
      "🏳️",
      "🏴",
      "🏁",
      "🚩",
      "🏳️‍🌈",
      "🏳️‍⚧️",
      "🇺🇸",
      "🇬🇧",
      "🇨🇦",
      "🇦🇺",
      "🇯🇵",
      "🇰🇷",
      "🇨🇳",
      "🇩🇪",
      "🇫🇷",
      "🇮🇹",
      "🇪🇸",
      "🇧🇷",
      "🇲🇽",
      "🇮🇳",
      "🇷🇺",
      "🇳🇱",
      "🇧🇪",
      "🇸🇪",
      "🇳🇴",
      "🇩🇰",
      "🇫🇮",
      "🇵🇱",
      "🇦🇹",
      "🇨🇭",
    ],
  },
};

const RECENT_EMOJIS_KEY = "lounge_recent_emojis";
const MAX_RECENT_EMOJIS = 24;

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  position?: "above" | "below";
}

type CategoryKey = keyof typeof EMOJI_CATEGORIES | "discord";

export function EmojiPicker({ isOpen, onClose, onSelect, position = "above" }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("smileys");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch Discord emojis from Convex
  const discordEmojis = useQuery(api.discord.getGuildEmojis) as DiscordEmoji[] | undefined;

  // Load recent emojis from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
      if (stored) {
        try {
          setRecentEmojis(JSON.parse(stored));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);

    // Update recent emojis
    const newRecent = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(
      0,
      MAX_RECENT_EMOJIS,
    );
    setRecentEmojis(newRecent);
    if (typeof window !== "undefined") {
      localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(newRecent));
    }
  };

  // Get all standard emojis for search
  const getAllEmojis = () => {
    return Object.entries(EMOJI_CATEGORIES)
      .filter(([key]) => key !== "recent" && key !== "discord")
      .flatMap(([_, category]) => category.emojis);
  };

  // Parse a recent emoji string - could be unicode or Discord format
  const parseRecentEmoji = (emoji: string): string | DiscordEmoji => {
    const discordMatch = emoji.match(/^<(a?):(\w+):(\d+)>$/);
    if (discordMatch && discordMatch[2] && discordMatch[3]) {
      return {
        id: discordMatch[3],
        name: discordMatch[2],
        animated: discordMatch[1] === "a",
      };
    }
    return emoji;
  };

  // Filter emojis based on search
  const getDisplayedEmojis = (): (string | DiscordEmoji)[] => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const standardMatches = getAllEmojis().filter((emoji) => emoji.includes(searchQuery));
      const discordMatches = (discordEmojis || []).filter((e) =>
        e.name.toLowerCase().includes(query),
      );
      return [...discordMatches, ...standardMatches];
    }

    if (activeCategory === "recent") {
      // Parse recent emojis which could be unicode or Discord format strings
      return recentEmojis.map(parseRecentEmoji);
    }

    if (activeCategory === "discord") {
      return discordEmojis || [];
    }

    return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || [];
  };

  const displayedEmojis = getDisplayedEmojis();

  // Build category list, only show discord if we have emojis
  const hasDiscordEmojis = discordEmojis && discordEmojis.length > 0;
  const categories = Object.entries(EMOJI_CATEGORIES).filter(([key]) => {
    if (key === "recent") return recentEmojis.length > 0;
    if (key === "discord") return hasDiscordEmojis;
    return true;
  });

  // Add discord category if we have emojis
  if (hasDiscordEmojis && !categories.find(([k]) => k === "discord")) {
    categories.unshift(["discord", { icon: Sparkles, name: "Server Emojis", emojis: [] }]);
  }

  const getCategoryName = () => {
    if (searchQuery) return "Search results";
    if (activeCategory === "discord") return "Server Emojis";
    return EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.name || "";
  };

  if (!isOpen) return null;

  return (
    <PickerContainer ref={containerRef} $position={position}>
      <SearchContainer>
        <SearchIcon>
          <Search size={14} />
        </SearchIcon>
        <SearchInput
          ref={searchRef}
          type="text"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>

      <CategoryTabs>
        {categories.map(([key, category]) => {
          const Icon = category.icon;
          const isActive = activeCategory === key && !searchQuery;
          return (
            <CategoryTab
              key={key}
              $isActive={isActive}
              onClick={() => {
                setActiveCategory(key as CategoryKey);
                setSearchQuery("");
              }}
              title={category.name}
            >
              <Icon size={16} />
            </CategoryTab>
          );
        })}
      </CategoryTabs>

      <EmojiGrid $itemCount={displayedEmojis.length}>
        {displayedEmojis.length > 0 ? (
          displayedEmojis.map((emoji, index) => {
            // Check if it's a Discord emoji object
            if (typeof emoji === "object" && "id" in emoji) {
              const discordEmoji = emoji as DiscordEmoji;
              const ext = discordEmoji.animated ? "gif" : "png";
              const url = `https://cdn.discordapp.com/emojis/${discordEmoji.id}.${ext}`;
              const emojiCode = `<${discordEmoji.animated ? "a" : ""}:${discordEmoji.name}:${discordEmoji.id}>`;

              return (
                <DiscordEmojiButton
                  key={discordEmoji.id}
                  onClick={() => handleEmojiClick(emojiCode)}
                  title={`:${discordEmoji.name}:`}
                >
                  <DiscordEmojiImg src={url} alt={discordEmoji.name} />
                </DiscordEmojiButton>
              );
            }

            // Standard emoji
            return (
              <EmojiButton
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji as string)}
                title={emoji as string}
              >
                {emoji as string}
              </EmojiButton>
            );
          })
        ) : (
          <NoResults>{searchQuery ? "No emojis found" : "No recent emojis"}</NoResults>
        )}
      </EmojiGrid>

      <CategoryLabel>{getCategoryName()}</CategoryLabel>
    </PickerContainer>
  );
}

// Styled Components
const PickerContainer = styled.div<{ $position: "above" | "below" }>`
  position: absolute;
  ${(props) => (props.$position === "above" ? "bottom: 100%" : "top: 100%")};
  right: 0;
  margin-bottom: ${(props) => (props.$position === "above" ? "8px" : "0")};
  margin-top: ${(props) => (props.$position === "below" ? "8px" : "0")};
  width: 320px;
  max-height: 360px;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 12px;
  box-shadow: ${LOUNGE_COLORS.glassShadow}, 0 0 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  animation: slideIn 0.15s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(${(props) => (props.$position === "above" ? "8px" : "-8px")});
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SearchContainer = styled.div`
  position: relative;
  padding: 8px;
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 32px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid transparent;
  border-radius: 8px;
  color: #fff;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  padding: 4px 8px;
  gap: 2px;
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryTab = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: ${(props) => (props.$isActive ? LOUNGE_COLORS.tier1Background : "transparent")};
  border: none;
  border-radius: 6px;
  color: ${(props) => (props.$isActive ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.5)")};
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${(props) =>
      props.$isActive ? LOUNGE_COLORS.tier1Background : "rgba(255, 255, 255, 0.1)"};
    color: ${(props) => (props.$isActive ? LOUNGE_COLORS.tier1 : "#fff")};
  }
`;

const EmojiGrid = styled.div<{ $itemCount: number }>`
  display: grid;
  /* Always use 8 columns, items align to start */
  grid-template-columns: repeat(8, 36px);
  justify-content: start;
  align-content: start;
  gap: 4px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 180px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const EmojiButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.1s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.15);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const DiscordEmojiButton = styled(EmojiButton)`
  padding: 4px;
`;

const DiscordEmojiImg = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
`;

const NoResults = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
`;

const CategoryLabel = styled.div`
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
