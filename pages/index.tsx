import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";
import styled, { keyframes } from "styled-components";
import { Container } from "../components/container";
import { SocialLinks } from "../components/social-links";
import { HomeView } from "../components/views/home";
import { ROUTES } from "../constants/routes";
import NevuloImg from "./../assets/img/nevulo.jpg";

const ProfilePic = styled(Image).attrs({
  quality: 10,
  src: NevuloImg,
  width: "32",
  height: "32",
})`
  border-radius: 32px;
`;

export default function Home() {
  const history = useRouter();

  return (
    <HomeView>
      <HomeContainer direction="row">
        <Container flex="1" direction="column">
          <FadeUp delay={50}>
            <ProfilePic />
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
              I'm a full-stack developer based in Melbourne.
            </FadeUp>
          </Subtitle>

          <FadeUp delay={400}>
            <ButtonContainer direction="column">
              <Button onClick={() => history.push(ROUTES.BLOG.ROOT)}>
                📖 Blog
              </Button>
              <Button onClick={() => history.push(ROUTES.PROJECTS.ROOT)}>
                🛠 Projects
              </Button>
              <Button onClick={() => history.push(ROUTES.ABOUT)}>
                👋 About Me
              </Button>
              <Button onClick={() => history.push(ROUTES.CONTACT)}>
                📧 Contact
              </Button>
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

const riseUp = keyframes`
from {
  opacity: 0;
  transform: translateY(40px);
}
to {
  opacity: 1;
  transform: translateY(0px);
}
`;

const riseUpBounce = keyframes`
0% {
  opacity: 0.1;
  transform: scale(3);
}
100% {
  opacity: 1;
  transform: scale(1);
  transform-origin: 25px;
}
`;

export const fadeIn = keyframes`
0% {
  opacity: 0.75;
  box-shadow: inset 0px -20px 0px 0px rgb(20 20 20 / 50%), 30px 30px 100px black;
  transform: scale(0.85) rotate(${Math.random() * 3}deg);
}
100% {
  opacity: 1;
  box-shadow: inset 0px -20px 0px 0px rgb(20 20 20 / 50%), 10px 10px 20px rgba(0, 0, 0, 0.5);
  transform: scale(1) rotate(0deg);
}
`;

export const FadeUp = styled.span<{ delay: number; bounce?: boolean }>`
  display: inline-block;
  animation: 0.8s ${(props) => (!props.bounce ? riseUp : riseUpBounce)} forwards;
  opacity: 0;
  transform: translateY(20px);
  animation-timing-function: cubic-bezier(0.33, 0.71, 0.58, 0.99);
  animation-delay: ${(props) => props.delay}ms;

  @media (prefers-reduced-motion) {
    animation: none;
    opacity: 1;
    transform: translateY(0px);
  }
`;

const Border = styled.div`
  background: #4f4dc1;
  width: 8px;
  border-radius: 12px;
  height: auto;
  margin: 0.1em 0;
  margin-right: 8px;
`;

const Title = styled.h1`
  display: block;
  color: ${(props) => props.theme.contrast};
  font-family: "Inter", sans-serif;
  font-weight: 900;
  line-height: clamp(32px, 6vmax, 72px);
  font-size: clamp(32px, 6vmax, 72px);
  margin-bottom: 0px;
  margin-top: 0px;
  letter-spacing: -1.5px;
`;

const Subtitle = styled.h2`
  font-family: "RobotoCondensed", sans-serif;
  color: ${(props) => props.theme.textColor};
  font-weight: 400;
  font-size: max(16px, 2.5vh);
  margin-top: max(4px, 2vh);
`;

const Button = styled.button`
  opacity: 0.75;
  cursor: pointer;
  background: linear-gradient(to bottom, #212121, #171717);
  padding: 0.6em min(2vw, 1.5em);
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: clamp(2vmin, 1rem, 6vmax);
  margin: 0.25em;
  border: 0;
  outline: 0;
  color: white;
  border-radius: 4px;
`;

const ButtonContainer = styled(Container)`
  flex: 1 0 25%;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
  margin-top: max(4px, 2vh);

  @media (min-height: 768px) {
    flex-direction: column;
  }

  @media (max-width: 468px) {
    margin-top: 0;
  }
`;

const HomeContainer = styled(Container).attrs({ ariaRole: "container" })`
  @media (max-width: 768px) {
    flex-direction: column !important;
  }

  padding: 1em;
`;
