export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface TwitchStreamResponse {
  data: TwitchStream[];
}

export interface TwitchSubscription {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  gifter_id?: string;
  gifter_login?: string;
  gifter_name?: string;
  is_gift: boolean;
  tier: "1000" | "2000" | "3000"; // T1, T2, T3
  plan_name: string;
  user_id: string;
  user_login: string;
  user_name: string;
}

export interface TwitchSubscriptionResponse {
  data: TwitchSubscription[];
}

export interface TwitchTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string[];
  token_type: string;
}
