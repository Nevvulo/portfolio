// import original module declarations
import "styled-components";

interface GenericTheme {
  background: string;
  foreground: string;
  contrast: string;
  pure: string;
  textColor: string;
  linkColor: string;
  postBackground: string;
  postImageLoadingBackground: string;
  postDescriptionText: string;
  postImageBoxShadow: string;
  subscriptionBackground: string;
  subscriptionText: string;
  difficultyBeginnerBackground: string;
  difficultyIntermediateBackground: string;
  difficultyAdvancedBackground: string;
}

// and extend them!
declare module "styled-components" {
  interface DefaultTheme extends GenericTheme {}
}
