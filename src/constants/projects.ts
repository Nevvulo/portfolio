import { ProjectProps, ProjectStyleProps } from "../components/project";
import DankMemer, { DankMemerPreview } from "../pages/projects/dankmemer";
import Poplet, { PopletPreview } from "../pages/projects/poplet";
import Powercord, { PowercordPreview } from "../pages/projects/powercord";
import zBot, { zBotPreview } from "../pages/projects/zbot";
import Flux, { FluxPreview } from "../pages/projects/flux";

type Item = ProjectProps & ProjectStyleProps;
export const Projects: Item[] = [
  {
    projectId: "flux",
    background: "linear-gradient(to right,#6cea9c,#2faf60);",
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
