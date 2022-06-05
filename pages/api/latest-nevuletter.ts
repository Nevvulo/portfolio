import type { NextApiRequest, NextApiResponse } from "next";
import { LatestNevuletterResponse } from "../../types/nevuletter";
import { JSDOM } from "jsdom";

export default async function handler(
  _: NextApiRequest,
  res: NextApiResponse<LatestNevuletterResponse>
) {
  try {
    const API_KEY = process.env.BUTTONDOWN_API_KEY;
    const response = await fetch("https://api.buttondown.email/v1/emails", {
      method: "GET",
      headers: {
        Authorization: `Token ${API_KEY}`,
        "Content-Type": "application/json",
      },
    }).then((res) => res.json() as Promise<GetEmailsResponse>);
    const {
      id,
      body,
      publish_date,
      subject: title,
      slug,
      secondary_id: issueNo,
    } = response.results[response.results.length - 1];
    const { window } = new JSDOM(body);
    const element = window.document.querySelector("img");
    const image = element?.getAttribute("src") ?? "";
    if (!image) console.warn("Couldn't find banner image in email body");

    res.status(200).json({
      email: {
        id,
        createdAt: new Date(publish_date).toLocaleDateString(),
        title,
        image,
        issueNo,
        url: `https://nevuletter.nevulo.xyz/archive/${slug}`,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Sorry, something went wrong, please try again soon",
      email: null,
    });
  }
}

interface GetEmailsResponse {
  count: number;
  next: string;
  previous: string | null;
  results: Email[];
}

interface Email {
  publish_date: string;
  id: string;
  body: string;
  slug: string;
  subject: string;
  excluded_tags: string[];
  included_tags: string[];
  email_type: string;
  metadata: Record<string, unknown>;
  secondary_id: number;
  external_url: string;
}
