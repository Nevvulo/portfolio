import { LatestNevuletterResponse } from "../types/nevuletter";

export default async function getLatestNevuletter(): Promise<
  LatestNevuletterResponse | undefined
> {
  try {
    const url =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://nevulo.xyz";
    const response = await fetch(`${url}/api/latest-nevuletter`, {
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json() as Promise<LatestNevuletterResponse>);
    console.log(response);
    return response;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
