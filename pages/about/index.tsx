import Head from "next/head";
import React from "react";
import styled from "styled-components";
import { Container } from "../../components/container";
import {
  BackButton,
  Emoji,
  Header,
  IconLink,
  Link,
  Text,
  Title,
} from "../../components/generics";
import { Footer } from "../../components/generics/footer";
import { AboutView } from "../../components/views/about";
import { MinimalView } from "../../components/views/minimal";
import COLORS from "../../constants/colors";
import { ROUTES } from "../../constants/routes";

const TextContainer = styled(Container)`
  display: block;
  color: ${(props) => props.theme.textColor} !important;
  height: 80%;
  overflow: auto;
`;

export const AboutBox = styled(MinimalView)`
  display: flex;
  align-items: flex-start;
  border-radius: 4px;
  max-width: 650px;
  padding: 1em;

  @media (max-width: 460px) {
    margin: 1em 5%;
  }
`;

const Subtitle = styled.h2`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: white;
  font-size: 22px;
  padding: 0px;
  letter-spacing: -1.25px;
  margin: 0;
  margin-top: 8px;
`;

const Background = styled.div`
  width: 100%;
  background: url("/alt-background.png");
  height: 100%;
  opacity: 0.5;
  z-index: -1;
  position: fixed;
  top: 0;
`;

const About: React.FC = () => (
  <AboutView>
    <Head>
      <title>About Me - Nevulo</title>
      <meta property="og:title" content="Learn more about Nevulo" />
      <meta
        property="og:description"
        content="I'm Blake, a software engineer based in Melbourne, Australia. Click here to learn more about who I am and what I do!"
      />
    </Head>
    <Background />
    <Header justifyContent="center" direction="column">
      <Container alignItems="center">
        <BackButton href="/" />
        <Title fontSize="36px" color="white">
          <Emoji>👋</Emoji> About Me
        </Title>
      </Container>
    </Header>
    <AboutBox>
      <TextContainer direction="column" padding="0 12px">
        <Subtitle>Who am I?</Subtitle>
        <Text linkColor={COLORS.FLUX_GREEN}>
          I'm Blake - a software engineer based in Melbourne, Australia working
          at <Link href={ROUTES.PROJECTS.FLUX}>Flux</Link>. I'm passionate about
          giving users the best experiences in applications because that's what
          they deserve.
        </Text>

        <Subtitle>What do I do?</Subtitle>
        <Text>
          I primarily work with <b>TypeScript</b> and <b>JavaScript</b>, but I
          have experience working with lower level languages such as <b>Java</b>{" "}
          and <b>Swift</b> for native app development. I am proficient with{" "}
          <IconLink
            icon="invision"
            isExternal
            target="_blank"
            href={`https://reactjs.org`}
            width="16"
            height="16"
          >
            React
          </IconLink>
          for building front-end interfaces with layouts and performance built
          for the modern web. I also spend just as much time working on the
          back-end of applications, such as handling business logic, solving
          problems at scale and server management.
        </Text>
        <Text>
          I'm also well-versed in many other areas such as CSS, Python,
          Ionic/Capacitor and{" "}
          <IconLink
            icon="invision"
            isExternal
            target="_blank"
            href={`https://firebase.google.com`}
            width="16"
            height="16"
          >
            Firebase
          </IconLink>
        </Text>
        <Text linkColor={COLORS.TAB_SELECTED}>
          Always looking to improve, I use my{" "}
          <Link href={ROUTES.BLOG.ROOT}>Blog</Link> as a medium to learn new (or
          solidify existing) concepts while teaching others in a concise, fun
          and unique way.
        </Text>

        <Text></Text>
      </TextContainer>
      <Footer>
        <Text>
          Wanna get in touch? You can <Link href="/contact">contact me</Link>,
          or check out some of <Link href="/projects">my projects</Link>
        </Text>
      </Footer>
    </AboutBox>
  </AboutView>
);

export default About;
