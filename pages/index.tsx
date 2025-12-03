import Head from "next/head";
import Image from "next/image";
import styled from "styled-components";
import Background from "../assets/img/background.jpg";
import { Container } from "../components/container";
import { Avatar, CustomLink } from "../components/generics";
import { SocialLinks } from "../components/generics/social-links";
import { FadeUp } from "../components/home/animation";
import { ButtonContainer, ButtonLink } from "../components/home/button";
import { Subtitle, Title } from "../components/home/typography";
import { HomeView } from "../components/layout/home";
import { ROUTES } from "../constants/routes";
import useMediaQuery from "../hooks/useMediaQuery";

export default function Home() {
  const isWideDisplay = useMediaQuery("(min-width: 600px)");
  return (
    <HomeView>
      <div style={{ position: "fixed", inset: 0, zIndex: -1, opacity: 0.1 }} aria-hidden="true">
        <Image
          fill
          style={{ objectFit: "cover" }}
          priority
          src={Background}
          alt="Decorative geometric pattern background"
          placeholder="blur"
        />
      </div>

      <HomeContainer
        style={{ marginTop: !isWideDisplay ? "min(10vh, 8em)" : "4em" }}
        direction="row"
      >
        <Container flex="1" direction="column">
          <FadeUp $delay={50}>
            <Avatar width={52} height={52} />
          </FadeUp>
          <Container direction="row">
            <Border />
            <Title>
              <FadeUp $bounce $delay={0}>
                Hi,
              </FadeUp>{" "}
              <FadeUp $bounce $delay={200}>
                I'm
              </FadeUp>{" "}
              <FadeUp $bounce $delay={310}>
                Blake
              </FadeUp>
            </Title>
          </Container>

          <Subtitle>
            <FadeUp $delay={400}>I'm a software engineer based in Melbourne, Australia.</FadeUp>
          </Subtitle>

          <FadeUp $delay={400}>
            <ButtonContainer as="nav" direction="column" aria-label="Main navigation">
              <CustomLink href={ROUTES.BLOG.ROOT} aria-label="Read my blog posts">
                <ButtonLink as="span" key="blog-btn">
                  📖 Blog
                </ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.PROJECTS.ROOT} aria-label="View my projects">
                <ButtonLink as="span" key="projects-btn">
                  🛠 Projects
                </ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.ABOUT} aria-label="Learn more about me">
                <ButtonLink as="span" key="about-btn">
                  👋 About Me
                </ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.CONTACT} aria-label="Get in touch with me">
                <ButtonLink as="span" key="contact-btn">
                  📧 Contact
                </ButtonLink>
              </CustomLink>
            </ButtonContainer>
          </FadeUp>
        </Container>

        <FadeUp $delay={545}>
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
        <meta property="og:image" content="https://nevulo.xyz/images/nevulo.jpg" />
      </Head>
    </HomeView>
  );
}

const Border = styled.div`
  background: #4f4dc1;
  width: 8px;
  border-radius: 12px;
  height: auto;
  margin: 0.1em 0;
  margin-right: 8px;
`;

const HomeContainer = styled(Container)`
  @media (max-width: 768px) {
    flex-direction: column;
  }

  padding: 1.5rem;
  
  @media (max-width: 600px) {
    padding: 1rem;
  }
`;
