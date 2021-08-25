import styled from "styled-components";
import { Gradients } from "../../constants/colors";
import { MinimalView } from "./minimal";

export const ContactView = styled(MinimalView)`
  background: ${Gradients.CONTACT_PAGE};
  align-items: flex-start;
  height: 60%;
  border-radius: 4px;
  padding: 1em;
  align-self: center;
  box-shadow: 0px 0px 40px rgba(0, 0, 0, 0.3);
  margin: 1em 15%;

  @media (max-width: 460px) {
    margin: 1em 5%;
  }
`;
