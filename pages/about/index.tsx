import Head from "next/head";
import React from "react";
import styled from "styled-components";
import { Subtitle } from "../../components/about/typography";
import { Container } from "../../components/container";
import { IconLink, Link, Text } from "../../components/generics";
import { Footer } from "../../components/generics/footer";
import { AboutBox } from "../../components/layout/about";
import { MinimalView } from "../../components/layout/minimal";
import { SimpleNavbar } from "../../components/navbar/simple";
import COLORS from "../../constants/colors";
import { ROUTES } from "../../constants/routes";

export default function About() {
  return (
    <MinimalView>
      <Background />
      <SimpleNavbar emoji="👋" title="About Me" />

      <AboutBox>
        <TextContainer>
          <Subtitle>Who am I?</Subtitle>
          <Text>
            I'm Blake - a software engineer based in Melbourne, Australia
            working at{" "}
            <Link color={COLORS.FLUX_GREEN} href={ROUTES.PROJECTS.FLUX}>
              Flux
            </Link>
            . I'm passionate about giving users the best experiences in
            applications because that's what they deserve.
          </Text>

          <Subtitle>What do I do?</Subtitle>
          <Text>
            I primarily work with <b>TypeScript</b> and <b>JavaScript</b>, but I
            have experience working with lower level languages such as{" "}
            <b>Java</b> and <b>Swift</b> for native app development. I am
            proficient with{" "}
            <IconLink
              isExternal
              spacing="8px"
              target="_blank"
              href="https://reactjs.org"
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
              isExternal
              target="_blank"
              href="https://firebase.google.com"
              width="16"
              spacing="8px"
              height="16"
            >
              Firebase
            </IconLink>
          </Text>

          <Text>
            Always looking to improve, I use my{" "}
            <Link color={COLORS.TAB_SELECTED} href={ROUTES.BLOG.ROOT}>
              Blog
            </Link>{" "}
            as a medium to learn new (or solidify existing) concepts while
            teaching others in a concise, fun and unique way.
          </Text>
        </TextContainer>

        <Footer>
          <Text>
            Wanna get in touch? You can <Link href="/contact">contact me</Link>,
            or check out some of <Link href="/projects">my projects</Link>
          </Text>
        </Footer>
      </AboutBox>

      <Head key="about">
        <title>About Me - Nevulo</title>
        <meta property="og:title" content="Learn more about Nevulo" />
        <meta
          property="og:description"
          content="I'm Blake, a software engineer based in Melbourne, Australia. Click here to learn more about who I am and what I do!"
        />
      </Head>
    </MinimalView>
  );
}

const Background = styled.div`
  width: 100%;
  background: url("/images/alt-background.png");
  height: 100%;
  opacity: 0.5;
  z-index: -1;
  position: fixed;
  top: 0;
`;

const TextContainer = styled(Container)`
  display: block;
  color: ${(props) => props.theme.textColor} !important;
  height: 80%;
  overflow: auto;
  direction: column;
  padding: 0 12px;
`;
