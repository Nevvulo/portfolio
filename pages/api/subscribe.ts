import type { NextApiRequest, NextApiResponse } from "next";

const isValidEmail = (email: string) => {
  return email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email } = req.body as { email: string };
  if (!email) {
    return res.status(400).json({
      error: "You need to enter an e-mail to subscribe!",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error:
        "Sorry, looks like that's an invalid e-mail. Check your input and try again.",
    });
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
