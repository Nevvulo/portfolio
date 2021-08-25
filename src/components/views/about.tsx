import styled from "styled-components";
import { Gradients } from "../../constants/colors";
import { MinimalView } from "./minimal";

export const AboutView = styled(MinimalView)`
  background: ${Gradients.ABOUT_PAGE};
  align-items: flex-start;
  height: 75%;
  border-radius: 4px;
  padding: 1em;
  box-shadow: 0px 0px 40px rgba(0, 0, 0, 0.4);
  align-self: center;
  margin: 1em 15%;

  @media (max-width: 460px) {
    margin: 1em 5%;
  }
`;
