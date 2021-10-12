// all colors here will be specified in hex
enum COLORS {
  BACKGROUND = "#151515",
  WHITE = "#ffffff",
  BLACK = "#000000",
  LIGHT_PURPLE = "#b39ddb",
  FLUX_GREEN = "#6cea9c",
  TAB_SELECTED = "#f7be5c",
  TEXT_COLOR = "#f7be5c",
  TAB_UNFOCUSED = "#d6d6d6",
}

enum ColorsRGBA {
  PROJECT_BACKGROUND = "rgba(35, 35, 35, 0.99)",
}

enum Gradients {
  ABOUT_PAGE = "linear-gradient(to right, #cb356b, #bd3f32)",
  CONTACT_PAGE = "linear-gradient(to right, #4568dc, #b06ab3)",
  BLOG_POST = "linear-gradient(315deg, #000000 0%, #414141 74%)",
}

export default COLORS;
export { ColorsRGBA, Gradients };
