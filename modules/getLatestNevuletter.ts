import { LatestNevuletterResponse } from "../types/nevuletter";

export default async function getLatestNevuletter(): Promise<
  LatestNevuletterResponse | undefined
> {
  try {
    const response = await fetch(
      "http://localhost:3000/api/latest-nevuletter",
      {
        headers: { "Content-Type": "application/json" },
      }
    ).then((res) => res.json() as Promise<LatestNevuletterResponse>);
    console.log(response);
    return response;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
