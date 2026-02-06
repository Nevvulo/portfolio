import type { Metadata } from "next";
import { getAllPublicSoftware } from "@/src/db/queries/software";
import SoftwarePage from "./SoftwarePage";

export const metadata: Metadata = {
  title: "Software",
  description: "Games, tools, apps, and libraries built by Blake (Nevulo).",
  openGraph: {
    title: "Software | Nevulo",
    description: "Games, tools, apps, and libraries built by Blake.",
    url: "https://nev.so/software",
  },
};

export const revalidate = 120;

export default async function Page() {
  const software = await getAllPublicSoftware().catch(() => []);
  return <SoftwarePage software={software} />;
}
