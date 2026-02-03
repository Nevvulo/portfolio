import {
  SiYoutube,
  SiTwitch,
  SiTiktok,
  SiX,
  SiInstagram,
  SiDiscord,
  SiGithub,
  SiLinkedin,
  SiReddit,
  SiSpotify,
  SiSoundcloud,
  SiKick,
  SiFacebook,
  SiSnapchat,
  SiPinterest,
  SiThreads,
  SiBluesky,
  SiSteam,
  SiApplemusic,
} from "react-icons/si";
import { Globe } from "lucide-react";
import type { IconType } from "react-icons";

export interface ServiceDefinition {
  key: string;
  label: string;
  urlPrefix: string;
  icon: IconType | typeof Globe;
  brandColor: string;
}

export const PROFILE_SERVICES: ServiceDefinition[] = [
  { key: "youtube", label: "YouTube", urlPrefix: "https://youtube.com/", icon: SiYoutube, brandColor: "#FF0000" },
  { key: "twitch", label: "Twitch", urlPrefix: "https://twitch.tv/", icon: SiTwitch, brandColor: "#9146FF" },
  { key: "tiktok", label: "TikTok", urlPrefix: "https://tiktok.com/", icon: SiTiktok, brandColor: "#00F2EA" },
  { key: "x", label: "X", urlPrefix: "https://x.com/", icon: SiX, brandColor: "#000000" },
  { key: "instagram", label: "Instagram", urlPrefix: "https://instagram.com/", icon: SiInstagram, brandColor: "#E4405F" },
  { key: "discord", label: "Discord", urlPrefix: "https://discord.gg/", icon: SiDiscord, brandColor: "#5865F2" },
  { key: "github", label: "GitHub", urlPrefix: "https://github.com/", icon: SiGithub, brandColor: "#ffffff" },
  { key: "linkedin", label: "LinkedIn", urlPrefix: "https://linkedin.com/", icon: SiLinkedin, brandColor: "#0A66C2" },
  { key: "reddit", label: "Reddit", urlPrefix: "https://reddit.com/", icon: SiReddit, brandColor: "#FF4500" },
  { key: "spotify", label: "Spotify", urlPrefix: "https://open.spotify.com/", icon: SiSpotify, brandColor: "#1DB954" },
  { key: "soundcloud", label: "SoundCloud", urlPrefix: "https://soundcloud.com/", icon: SiSoundcloud, brandColor: "#FF5500" },
  { key: "kick", label: "Kick", urlPrefix: "https://kick.com/", icon: SiKick, brandColor: "#53FC18" },
  { key: "facebook", label: "Facebook", urlPrefix: "https://facebook.com/", icon: SiFacebook, brandColor: "#1877F2" },
  { key: "snapchat", label: "Snapchat", urlPrefix: "https://snapchat.com/", icon: SiSnapchat, brandColor: "#FFFC00" },
  { key: "pinterest", label: "Pinterest", urlPrefix: "https://pinterest.com/", icon: SiPinterest, brandColor: "#BD081C" },
  { key: "threads", label: "Threads", urlPrefix: "https://threads.net/", icon: SiThreads, brandColor: "#000000" },
  { key: "bluesky", label: "Bluesky", urlPrefix: "https://bsky.app/", icon: SiBluesky, brandColor: "#0085FF" },
  { key: "steam", label: "Steam", urlPrefix: "https://steamcommunity.com/", icon: SiSteam, brandColor: "#00adee" },
  { key: "appleMusic", label: "Apple Music", urlPrefix: "https://music.apple.com/", icon: SiApplemusic, brandColor: "#FA243C" },
  { key: "website", label: "Website", urlPrefix: "https://", icon: Globe as any, brandColor: "#9CA3AF" },
];

export const SERVICE_KEYS = PROFILE_SERVICES.map((s) => s.key);

export function getServiceByKey(key: string): ServiceDefinition | undefined {
  return PROFILE_SERVICES.find((s) => s.key === key);
}
