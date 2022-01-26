import styled from "styled-components";
import { Gradients } from "../../constants/colors";
import { MinimalView } from "./minimal";

export const ContactBox = styled(MinimalView)`
  display: flex;
  background: ${Gradients.CONTACT_PAGE};
  align-items: flex-start;
  border-radius: 4px;
  max-width: 650px;
  padding: 1em;
  box-shadow: 0px 0px 40px rgba(0, 0, 0, 0.4);
  margin: 1em 5%;
`;
