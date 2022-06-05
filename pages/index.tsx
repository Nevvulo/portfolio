import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Head from "next/head";
import Image from "next/image";
import React from "react";
import styled from "styled-components";
import Background from "../assets/img/background.jpg";
import { Container } from "../components/container";
import { Avatar, CustomLink } from "../components/generics";
import { SocialLinks } from "../components/generics/social-links";
import { FadeUp } from "../components/home/animation";
import { ButtonContainer, ButtonLink } from "../components/home/button";
import { SuggestedNevuletter } from "../components/home/suggested-nevuletter";
import { Subtitle, Title } from "../components/home/typography";
import { HomeView } from "../components/layout/home";
import { ROUTES } from "../constants/routes";
import useMediaQuery from "../hooks/useMediaQuery";
import getLatestNevuletter from "../modules/getLatestNevuletter";
import { LatestNevuletterResponse } from "../types/nevuletter";

interface HomeProps {
  latestNevuletter: LatestNevuletterResponse["email"] | null;
}

export default function Home({ latestNevuletter }: HomeProps) {
  const isWideDisplay = useMediaQuery("(min-width: 600px)");
  return (
    <HomeView>
      <BackgroundImg />

      <HomeContainer
        style={{ marginTop: !isWideDisplay ? "min(10vh, 8em)" : "4em" }}
        direction="row"
      >
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
                <ButtonLink key="blog-btn">📖 Blog</ButtonLink>
              </CustomLink>
              <CustomLink href="https://nevuletter.nevulo.xyz/">
                <ButtonLink target="_blank" key="blog-btn">
                  🗞 Nevuletter{" "}
                  <FontAwesomeIcon
                    aria-role="external-link"
                    color="#bbbbbb"
                    style={{
                      width: "10px",
                      marginLeft: "6px",
                      marginRight: "2px",
                      alignSelf: "flex-end",
                      position: "relative",
                      top: "2px",
                    }}
                    icon={faExternalLinkAlt}
                  />
                </ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.PROJECTS.ROOT}>
                <ButtonLink key="projects-btn">🛠 Projects</ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.ABOUT}>
                <ButtonLink key="about-btn">👋 About Me</ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.CONTACT}>
                <ButtonLink key="contact-btn">📧 Contact</ButtonLink>
              </CustomLink>
            </ButtonContainer>
          </FadeUp>

          <Container>
            <FadeUp delay={600}>
              {latestNevuletter && (
                <SuggestedNevuletter {...latestNevuletter} />
              )}
            </FadeUp>
          </Container>
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

export async function getStaticProps() {
  const nevuletter = await getLatestNevuletter();
  if (!nevuletter) return { props: { latestNevuletter: null } };
  if (nevuletter.error) return { props: { latestNevuletter: null } };
  return { props: { latestNevuletter: nevuletter.email } };
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
