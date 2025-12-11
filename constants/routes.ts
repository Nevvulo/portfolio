enum PROJECTS {
  ROOT = "/projects",
  MAINTAINED = "/projects/maintained",
  PROJECT = "/projects/:id",
  FLUX = "/projects/flux",
  UNLOAN = "/projects/unloan",
  POPLET = "/projects/poplet",
  ZBOT = "/projects/zbot",
  DANK_MEMER = "/projects/dankmemer",
  POWERCORD = "/projects/powercord",
}

const ROOT = "/";
const ABOUT = "/about";
const CONTACT = "/contact";

enum BLOG {
  ROOT = "/blog",
  POST = "/blog/:id",
}

enum AUTH {
  SIGN_IN = "/sign-in",
  SIGN_UP = "/sign-up",
  ACCOUNT = "/account",
}

export const ROUTES = {
  ROOT,
  ABOUT,
  CONTACT,
  PROJECTS,
  BLOG,
  AUTH,
};
