import React from "react";
import styled from "styled-components";
import { BackButton, Header, Text, Title } from "../../components/generics";
import { SocialLinks } from "../../components/social-links";
import { ContactView } from "../../components/views/contact";
import { MinimalView } from "../../components/views/minimal";
import Colors, { Gradients } from "../../constants/colors";

const Contact: React.FC = () => (
  <ContactView>
    <ContactBox>
      <Header>
        <BackButton color={Colors.WHITE} size="lg" href="/" />
        <Title color="white">Contact</Title>
      </Header>
      <Text>Wanna get in touch?</Text>
      <SocialLinks include={{ linkedIn: true }} direction="row" />
      <Text>
        Reporting a potential security vulnerability or privacy concern
        regarding one of my maintained projects? Please shoot me an e-mail by
        clicking the icon above.
      </Text>
    </ContactBox>
  </ContactView>
);

export default Contact;

const ContactBox = styled(MinimalView)`
  display: flex;
  background: ${Gradients.CONTACT_PAGE};

  align-items: flex-start;
  border-radius: 4px;
  max-width: 650px;
  padding: 1em;
  box-shadow: 0px 0px 40px rgba(0, 0, 0, 0.4);

  @media (max-width: 460px) {
    margin: 1em 5%;
  }
`;
