import type { ProjectProps, ProjectStyleProps } from "../components/project";
import Golfquest, { GolfquestPreview } from "../pages/games/golfquest";

export type Game = ProjectProps & ProjectStyleProps;
export const Games: Game[] = [
  {
    projectId: "golfquest",
    background: "linear-gradient(135deg, #065f46, #047857, #059669, #10b981)",
    preview: GolfquestPreview,
    component: Golfquest,
    maintained: true,
    links: {
      website: "https://www.roblox.com/games/golfquest", // Update with actual link when available
    },
  },
];
