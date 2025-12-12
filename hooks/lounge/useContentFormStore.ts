import { create } from "zustand";
import type { Id } from "../../convex/_generated/dataModel";

type ContentType = "music" | "video" | "writing" | "game_build" | "news" | "tools" | "event" | "advice" | "giveaway" | "poll" | "emoji";
type Tier = "tier1" | "tier2";

interface ContentFormState {
  // Basic fields
  selectedChannel: Id<"channels"> | "";
  contentType: ContentType;
  title: string;
  content: string;
  requiredTier: Tier;
  sendToDiscord: boolean;

  // Status
  sending: boolean;
  uploadingMedia: boolean;

  // Media fields
  mediaUrl: string;
  mediaThumbnail: string;
  mediaDuration: string;
  mediaFile: File | null;
  soundcloudUrl: string;

  // Event fields
  eventStartTime: string;
  eventEndTime: string;
  eventTimezone: string;
  eventLocation: string;

  // Giveaway fields
  giveawayEndsAt: string;
  giveawayPrize: string;
  giveawayMaxEntries: string;

  // Poll fields
  pollOptions: string[];
  pollEndsAt: string;
  pollAllowMultiple: boolean;

  // Emoji fields
  emojiEmoji: string;
  emojiMessage: string;
}

interface ContentFormActions {
  // Setters
  setSelectedChannel: (channel: Id<"channels"> | "") => void;
  setContentType: (type: ContentType) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setRequiredTier: (tier: Tier) => void;
  setSendToDiscord: (send: boolean) => void;
  setSending: (sending: boolean) => void;
  setUploadingMedia: (uploading: boolean) => void;

  // Media
  setMediaUrl: (url: string) => void;
  setMediaThumbnail: (thumbnail: string) => void;
  setMediaDuration: (duration: string) => void;
  setMediaFile: (file: File | null) => void;
  setSoundcloudUrl: (url: string) => void;

  // Event
  setEventStartTime: (time: string) => void;
  setEventEndTime: (time: string) => void;
  setEventTimezone: (timezone: string) => void;
  setEventLocation: (location: string) => void;

  // Giveaway
  setGiveawayEndsAt: (time: string) => void;
  setGiveawayPrize: (prize: string) => void;
  setGiveawayMaxEntries: (entries: string) => void;

  // Poll
  setPollOptions: (options: string[]) => void;
  addPollOption: () => void;
  updatePollOption: (index: number, value: string) => void;
  removePollOption: (index: number) => void;
  setPollEndsAt: (time: string) => void;
  setPollAllowMultiple: (allow: boolean) => void;

  // Emoji
  setEmojiEmoji: (emoji: string) => void;
  setEmojiMessage: (message: string) => void;

  // Reset
  resetForm: () => void;
}

const initialState: ContentFormState = {
  selectedChannel: "",
  contentType: "news",
  title: "",
  content: "",
  requiredTier: "tier1",
  sendToDiscord: true,
  sending: false,
  uploadingMedia: false,

  mediaUrl: "",
  mediaThumbnail: "",
  mediaDuration: "",
  mediaFile: null,
  soundcloudUrl: "",

  eventStartTime: "",
  eventEndTime: "",
  eventTimezone: "America/New_York",
  eventLocation: "",

  giveawayEndsAt: "",
  giveawayPrize: "",
  giveawayMaxEntries: "",

  pollOptions: ["", ""],
  pollEndsAt: "",
  pollAllowMultiple: false,

  emojiEmoji: "🎉",
  emojiMessage: "",
};

export const useContentFormStore = create<ContentFormState & ContentFormActions>((set, get) => ({
  ...initialState,

  // Basic setters
  setSelectedChannel: (channel) => set({ selectedChannel: channel }),
  setContentType: (type) => set({ contentType: type }),
  setTitle: (title) => set({ title }),
  setContent: (content) => set({ content }),
  setRequiredTier: (tier) => set({ requiredTier: tier }),
  setSendToDiscord: (send) => set({ sendToDiscord: send }),
  setSending: (sending) => set({ sending }),
  setUploadingMedia: (uploading) => set({ uploadingMedia: uploading }),

  // Media setters
  setMediaUrl: (url) => set({ mediaUrl: url, mediaFile: url ? null : get().mediaFile }),
  setMediaThumbnail: (thumbnail) => set({ mediaThumbnail: thumbnail }),
  setMediaDuration: (duration) => set({ mediaDuration: duration }),
  setMediaFile: (file) => set({ mediaFile: file, mediaUrl: file ? "" : get().mediaUrl }),
  setSoundcloudUrl: (url) => set({ soundcloudUrl: url }),

  // Event setters
  setEventStartTime: (time) => set({ eventStartTime: time }),
  setEventEndTime: (time) => set({ eventEndTime: time }),
  setEventTimezone: (timezone) => set({ eventTimezone: timezone }),
  setEventLocation: (location) => set({ eventLocation: location }),

  // Giveaway setters
  setGiveawayEndsAt: (time) => set({ giveawayEndsAt: time }),
  setGiveawayPrize: (prize) => set({ giveawayPrize: prize }),
  setGiveawayMaxEntries: (entries) => set({ giveawayMaxEntries: entries }),

  // Poll actions
  setPollOptions: (options) => set({ pollOptions: options }),
  addPollOption: () => {
    const { pollOptions } = get();
    if (pollOptions.length < 10) {
      set({ pollOptions: [...pollOptions, ""] });
    }
  },
  updatePollOption: (index, value) => {
    const { pollOptions } = get();
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    set({ pollOptions: newOptions });
  },
  removePollOption: (index) => {
    const { pollOptions } = get();
    if (pollOptions.length > 2) {
      set({ pollOptions: pollOptions.filter((_, i) => i !== index) });
    }
  },
  setPollEndsAt: (time) => set({ pollEndsAt: time }),
  setPollAllowMultiple: (allow) => set({ pollAllowMultiple: allow }),

  // Emoji setters
  setEmojiEmoji: (emoji) => set({ emojiEmoji: emoji }),
  setEmojiMessage: (message) => set({ emojiMessage: message }),

  // Reset form to initial state (but keep channel selection)
  resetForm: () => {
    const { selectedChannel } = get();
    set({ ...initialState, selectedChannel });
  },
}));
