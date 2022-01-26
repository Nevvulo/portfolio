import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email } = req.body as { email: string };
  if (!email) {
    return res.status(400).json({ error: "Please provide a valid email" });
  }

  try {
    const API_KEY = process.env.BUTTONDOWN_API_KEY;
    const response = await fetch(
      "https://api.buttondown.email/v1/subscribers",
      {
        method: "POST",
        body: JSON.stringify({
          email: email,
        }),
        headers: {
          Authorization: `Token ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status >= 400) {
      const message = await response.json();
      console.error(
        `Failed to add subscriber to newsletter: ${message.error.email[0]}`
      );
      return res.status(400).json({ error: message.error.email[0] });
    }
    res.status(201).json({
      message: `Thanks! We've sent a verification email to ${email}. Can't wait to get you on board!`,
      error: "",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Sorry, something went wrong, please try again soon" });
  }
}
