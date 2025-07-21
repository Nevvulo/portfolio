import { useState } from "react";
import * as Fathom from "fathom-client";

export function useNewsletterSubscribe() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function subscribe(email: string) {
    setLoading(true);
    if (Fathom) Fathom.trackGoal("IWGMSY8R", 0);
    const res = await fetch("/api/subscribe", {
      body: JSON.stringify({ email: email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setLoading(false);

    const { error, message } = await res.json();
    if (error) {
      setError(error);
    } else {
      setSuccess(message);
    }
  }

  return { error, success, subscribe, loading };
}
