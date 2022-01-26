import React from "react";
import styled from "styled-components";
import { Container } from "../components/container";
import { Announcement, Avatar, CustomLink, Link } from "../components/generics";
import { SocialLinks } from "../components/generics/social-links";
import { FadeUp } from "../components/home/animation";
import { Button, ButtonContainer } from "../components/home/button";
import { Subtitle, Title } from "../components/home/typography";
import { HomeView } from "../components/layout/home";
import COLORS from "../constants/colors";
import { ROUTES } from "../constants/routes";

export default function Home() {
  return (
    <HomeView>
      <Background />

      <Announcement>
        Check out the new{" "}
        <Link color={COLORS.TAB_SELECTED} href="/blog">
          Nevulo blog
        </Link>
        !
      </Announcement>

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
                <Button>📖 Blog</Button>
              </CustomLink>
              <CustomLink href={ROUTES.PROJECTS.ROOT}>
                <Button>🛠 Projects</Button>
              </CustomLink>
              <CustomLink href={ROUTES.ABOUT}>
                <Button>👋 About Me</Button>
              </CustomLink>
              <CustomLink href={ROUTES.CONTACT}>
                <Button>📧 Contact</Button>
              </CustomLink>
            </ButtonContainer>
          </FadeUp>
        </Container>

        <FadeUp delay={545}>
          <SocialLinks />
        </FadeUp>
      </HomeContainer>
    </HomeView>
  );
}

const Background = styled.div`
  width: 100%;
  background: url("/background.png");
  height: 100%;
  opacity: 0.35;
  z-index: -1;
  position: fixed;
  top: 0;
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
