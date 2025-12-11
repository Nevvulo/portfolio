import styled from "styled-components";
import { Gradients } from "../../constants/colors";

export const ContactBox = styled.div`
  display: flex;
  flex-direction: column;
  background: ${Gradients.CONTACT_PAGE};
  align-items: flex-start;
  border-radius: 4px;
  max-width: 650px;
  padding: 1em;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.4);
  margin: 1em auto;
  
  @media (max-width: 768px) {
    margin: 1em auto;
    padding: 1.5em;
    width: 90%;
  }
`;
