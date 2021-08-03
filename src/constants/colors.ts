// all colors here will be specified in hex
enum COLORS {
  WHITE = "#ffffff",
  BLACK = "#000000",
  LIGHT_PURPLE = "#b39ddb",
  FLUX_GREEN = "#6cea9c",
  TAB_SELECTED = "#f7be5c",
  TAB_UNFOCUSED = "#d6d6d6",
}

enum ColorsRGBA {
  PROJECT_BACKGROUND = "rgba(35, 35, 35, 0.99)",
}

enum Gradients {
  ABOUT_PAGE = "linear-gradient(to right, #eb3349, #f45c43)",
  CONTACT_PAGE = "linear-gradient( 109.6deg,  rgba(102,203,149,1) 11.2%, rgba(39,210,175,1) 98.7% )",
  BLOG_POST = "linear-gradient( 76.3deg,  rgba(44,62,78,1) 12.6%, rgba(69,103,131,1) 82.8% )",
}

export default COLORS;
export { ColorsRGBA, Gradients };
