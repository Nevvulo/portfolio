import {
  faGithub,
  faLinkedin,
  faMastodon,
  faReddit,
  faTiktok,
  faTwitch,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Head from "next/head";
import styled from "styled-components";
import { Notice, Subtitle } from "../../components/contact/typography";
import { ContactBox } from "../../components/layout/contact";
import { TopNavView } from "../../components/layout/topnav";
import { SimpleNavbar } from "../../components/navbar/simple";
import Socials from "../../constants/socials";

export default function Contact() {
  return (
    <TopNavView>
      <SimpleNavbar title="Contact" />

      <ContactBox>
        <Subtitle color="white">Socials</Subtitle>
        <SocialsList>
          <SocialLink href={Socials.Twitch} target="_blank" rel="me noreferrer">
            <SocialIcon icon={faTwitch} />
            <SocialUsername>@Nevvulo</SocialUsername>
          </SocialLink>
          <SocialLink href={Socials.YouTube} target="_blank" rel="me noreferrer">
            <SocialIcon icon={faYoutube} />
            <SocialUsername>@Nevvulo</SocialUsername>
          </SocialLink>
          <SocialLink href={Socials.TikTok} target="_blank" rel="me noreferrer">
            <SocialIcon icon={faTiktok} />
            <SocialUsername>@nevulo</SocialUsername>
          </SocialLink>
          <SocialLink href={Socials.Reddit} target="_blank" rel="me noreferrer">
            <SocialIcon icon={faReddit} />
            <SocialUsername>r/Nevulo</SocialUsername>
          </SocialLink>
          <SocialLink href={Socials.GitHub} target="_blank" rel="me noreferrer">
            <SocialIcon icon={faGithub} />
            <SocialUsername>@Nevvulo</SocialUsername>
          </SocialLink>
          <SocialLink href={`mailto:${Socials.Email}`}>
            <SocialIcon icon={faEnvelope} />
            <SocialUsername>{Socials.Email}</SocialUsername>
          </SocialLink>
          <SocialLink href={Socials.LinkedIn} target="_blank" rel="me noreferrer">
            <SocialIcon icon={faLinkedin} />
            <SocialUsername>LinkedIn</SocialUsername>
          </SocialLink>
          <SocialLink href={Socials.Mastodon} target="_blank" rel="me noreferrer">
            <SocialIcon icon={faMastodon} />
            <SocialUsername>@nevulo</SocialUsername>
          </SocialLink>
        </SocialsList>
        <Subtitle color="white">Security & Privacy</Subtitle>
        <Notice>
          Reporting a potential security vulnerability or privacy concern regarding one of my
          maintained projects? Please shoot me an e-mail by clicking the icon above.
        </Notice>
      </ContactBox>

      <Head key="contact">
        <title>Contact - Nevulo</title>
        <meta
          name="description"
          content="Get in touch with Blake. Connect via email or social media for collaboration opportunities and professional inquiries."
        />
        <meta property="og:title" content="Contact Nevulo" />
        <meta
          property="og:description"
          content="Get in touch with Blake. Connect via email or social media for collaboration opportunities and professional inquiries."
        />
        <meta property="og:url" content="https://nev.so/contact" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=Get%20in%20Touch&subtitle=Let's%20connect%20and%20collaborate"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Nevulo" />
        <meta
          name="twitter:description"
          content="Get in touch for collaboration opportunities and professional inquiries."
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=Get%20in%20Touch&subtitle=Let's%20connect%20and%20collaborate"
        />
      </Head>
    </TopNavView>
  );
}

const SocialsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin: 0.5em 0 1.5em;
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  text-decoration: none;
  padding: 8px 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const SocialIcon = styled(FontAwesomeIcon)`
  width: 24px !important;
  height: 24px !important;
  flex-shrink: 0;
`;

const SocialUsername = styled.span`
  font-size: 16px;
  font-family: var(--font-sans);
`;
