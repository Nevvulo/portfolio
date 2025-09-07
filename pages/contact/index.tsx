import Head from "next/head";
import styled from "styled-components";
import { Notice, Subtitle } from "../../components/contact/typography";
import { SocialLinks } from "../../components/generics/social-links";
import { ContactBox } from "../../components/layout/contact";
import { MinimalView } from "../../components/layout/minimal";
import { DetailedNavbar } from "../../components/navbar/detailed";

const ContactTitle = styled.h1`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-size: 48px;
  margin-bottom: 8px;
  margin-top: 2em;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 36px;
    margin-top: 1em;
  }
`;

export default function Contact() {
  return (
    <MinimalView>
      <DetailedNavbar />

      <ContactTitle>📧 Contact</ContactTitle>

      <ContactBox>
        <Subtitle color="white">Socials</Subtitle>
        <SocialLinks color="white" include={{ linkedIn: true }} direction="row" />
        <Subtitle color="white">Security & Privacy</Subtitle>
        <Notice>
          Reporting a potential security vulnerability or privacy concern regarding one of my
          maintained projects? Please shoot me an e-mail by clicking the icon above.
        </Notice>
      </ContactBox>

      <Head key="contact">
        <title>Contact - Nevulo</title>
        <meta property="og:title" content="Get in touch with Nevulo" />
        <meta
          property="og:description"
          content="I'm Blake, a software engineer based in Melbourne, Australia. Click here to get in contact with me, or have a look at my social accounts!"
        />
      </Head>
    </MinimalView>
  );
}
