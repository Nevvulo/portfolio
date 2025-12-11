export interface DiscordWidget {
  id: string;
  name: string;
  instant_invite: string;
  channels: Array<{
    id: string;
    name: string;
    position: number;
  }>;
  members: Array<{
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    status: string;
    avatar_url: string;
  }>;
  presence_count: number;
}
