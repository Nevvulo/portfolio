import { AnimatePresence } from "framer-motion";
import Head from "next/head";
import React from "react";
import styled from "styled-components";
import { Container } from "../components/container";
import { Avatar, CustomLink } from "../components/generics";
import { SocialLinks } from "../components/generics/social-links";
import { FadeUp } from "../components/home/animation";
import { ButtonLink, ButtonContainer } from "../components/home/button";
import { Subtitle, Title } from "../components/home/typography";
import { HomeView } from "../components/layout/home";
import { ROUTES } from "../constants/routes";
import Background from "../assets/img/background.jpg";
import Image from "next/image";

export default function Home() {
  return (
    <HomeView>
      <BackgroundImg />

      <HomeContainer direction="row">
        <Container flex="1" direction="column">
          <FadeUp delay={50}>
            <Avatar width="52" height="52" />
          </FadeUp>
          <Container direction="row">
            <Border />
            <Title>
              <FadeUp bounce delay={0}>
                Hi,
              </FadeUp>{" "}
              <FadeUp bounce delay={200}>
                I'm
              </FadeUp>{" "}
              <FadeUp bounce delay={310}>
                Blake
              </FadeUp>
            </Title>
          </Container>

          <Subtitle>
            <FadeUp delay={400}>
              I'm a software engineer based in Melbourne, Australia.
            </FadeUp>
          </Subtitle>

          <FadeUp delay={400}>
            <ButtonContainer direction="column">
              <CustomLink href={ROUTES.BLOG.ROOT}>
                <ButtonLink key="blog-btn" layoutId="blog-title">
                  📖 Blog
                </ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.PROJECTS.ROOT}>
                <ButtonLink key="projects-btn" layoutId="projects-title">
                  🛠 Projects
                </ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.ABOUT}>
                <ButtonLink key="about-btn" layoutId="about-title">
                  👋 About Me
                </ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.CONTACT}>
                <ButtonLink key="contact-btn" layoutId="contact-title">
                  📧 Contact
                </ButtonLink>
              </CustomLink>
            </ButtonContainer>
          </FadeUp>
        </Container>

        <FadeUp delay={545}>
          <SocialLinks />
        </FadeUp>
      </HomeContainer>
      <Head>
        <meta property="og:title" content="Hi there, I'm Blake!" />
        <meta
          property="og:description"
          content="I'm a software engineer based in Australia working at Flux. Click this link to learn more about me!"
        />
        <meta property="og:url" content="https://nevulo.xyz" />
        <meta
          property="og:image"
          content="https://nevulo.xyz/nevuletter-square.png"
        />
      </Head>
    </HomeView>
  );
}

const BackgroundImg = styled(Image).attrs({
  layout: "fill",
  objectFit: "cover",
  priority: true,
  src: Background,
})`
  filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")};
  opacity: 0.1;
  z-index: -1;
`;

const Border = styled.div`
  background: #4f4dc1;
  width: 8px;
  border-radius: 12px;
  height: auto;
  margin: 0.1em 0;
  margin-right: 8px;
`;

const HomeContainer = styled(Container).attrs({ ariaRole: "container" })`
  @media (max-width: 768px) {
    flex-direction: column !important;
  }

  padding: 1em;
`;
