import type { NextApiRequest, NextApiResponse } from "next";
import { getTwitchAccessToken, TWITCH_CLIENT_ID, TWITCH_USER_ID } from "../../../utils/twitch";

interface TwitchVod {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  duration: string;
  created_at: string;
  view_count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!TWITCH_CLIENT_ID) {
      return res.status(200).json({ vods: [] });
    }

    const accessToken = await getTwitchAccessToken();

    const response = await fetch(
      `https://api.twitch.tv/helix/videos?user_id=${TWITCH_USER_ID}&type=archive&first=6`,
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      console.error(`Twitch VODs API error: ${response.statusText}`);
      return res.status(200).json({ vods: [] });
    }

    const data = await response.json();

    const vods: TwitchVod[] = (data.data || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      thumbnail_url: v.thumbnail_url
        .replace("%{width}", "320")
        .replace("%{height}", "180"),
      duration: v.duration,
      created_at: v.created_at,
      view_count: v.view_count,
    }));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ vods });
  } catch (error) {
    console.error("Error fetching Twitch VODs:", error);
    return res.status(200).json({ vods: [] });
  }
}
