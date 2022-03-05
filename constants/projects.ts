import { ProjectProps, ProjectStyleProps } from "../components/project";
import DankMemer, { DankMemerPreview } from "../pages/projects/dankmemer";
import Poplet, { PopletPreview } from "../pages/projects/poplet";
import Powercord, { PowercordPreview } from "../pages/projects/powercord";
import zBot, { zBotPreview } from "../pages/projects/zbot";
import Flux, { FluxPreview } from "../pages/projects/flux";

export type Project = ProjectProps & ProjectStyleProps;
export const Projects: Project[] = [
  {
    projectId: "flux",
    background:
      "linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(13,13,13,0.9570421918767507) 41%, rgba(12,12,12,0.9262298669467787) 48%, rgba(13,13,13,0.8954175420168067) 65%, rgba(13,13,13,0.8590029761904762) 69%, rgba(14,14,14,0.8085828081232493) 73%, rgba(58,58,58,0.8618040966386554) 78%, rgba(131,131,131,0.7777704831932774) 89%, rgba(187,187,187,0.35480129551820727) 97%, rgba(254,254,254,0) 100%)",
    preview: FluxPreview,
    component: Flux,
    maintained: true,
    links: {
      github: "https://github.com/joinflux",
      website: "https://joinflux.com",
    },
  },
  {
    projectId: "zbot",
    background: "linear-gradient(to right,#16222a, #3a6073);",
    preview: zBotPreview,
    component: zBot,
    links: {
      github: "https://github.com/nevvulo/zBot",
    },
  },
  {
    projectId: "poplet",
    background: "linear-gradient(to right, #8e2de2, #4a00e0);",
    preview: PopletPreview,
    component: Poplet,
    links: {
      github: "https://github.com/popletapp/web-app",
    },
  },
  {
    projectId: "dankmemer",
    background: "linear-gradient(to right,rgb(89 141 62),rgb(89 141 62));",
    preview: DankMemerPreview,
    component: DankMemer,
    links: {
      github: "https://github.com/dankmemer",
    },
  },
  {
    projectId: "powercord",
    background: "linear-gradient(to right,#7289da,#7289da);",
    preview: PowercordPreview,
    component: Powercord,
    links: {
      github: "https://github.com/powercord",
      website: "https://powercord.dev",
    },
    maintained: true,
  },
];
