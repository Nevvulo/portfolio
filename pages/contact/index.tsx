import Head from "next/head";
import React from "react";
import styled from "styled-components";
import { Container } from "../../components/container";
import {
  BackButton,
  Emoji,
  Header,
  Text,
  Title,
} from "../../components/generics";
import { SocialLinks } from "../../components/social-links";
import { ContactView } from "../../components/views/contact";
import { MinimalView } from "../../components/views/minimal";
import Colors, { Gradients } from "../../constants/colors";

const Subtitle = styled.h2`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: ${(props) => props.color};
  font-size: 22px;
  padding: 0px;
  letter-spacing: -1.25px;
  margin: 0;
  margin-top: 8px;
`;

const Notice = styled.p`
  font-family: "Inter", sans-serif;
  font-weight: 400;
  color: #eeeeee;
  font-size: 16px;
  padding: 0px;
  margin: 0px;
`;

const Contact: React.FC = () => (
  <ContactView>
    <Head>
      <title>Contact - Nevulo</title>
      <meta property="og:title" content="Get in touch with Nevulo" />
      <meta
        property="og:description"
        content="I'm Blake, a software engineer based in Melbourne, Australia. Click here to get in contact with me, or have a look at my social accounts!"
      />
    </Head>
    <Header justifyContent="center" direction="column">
      <Container alignItems="center">
        <BackButton href="/" />
        <Title fontSize="36px" color="white">
          <Emoji>📧</Emoji> Contact
        </Title>
      </Container>
    </Header>
    <ContactBox>
      <Subtitle color="white">Socials</Subtitle>
      <SocialLinks include={{ linkedIn: true }} direction="row" />
      <Subtitle>Security & Privacy</Subtitle>
      <Notice>
        Reporting a potential security vulnerability or privacy concern
        regarding one of my maintained projects? Please shoot me an e-mail by
        clicking the icon above.
      </Notice>
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
  margin: 1em 5%;
`;
