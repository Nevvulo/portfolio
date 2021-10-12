import React from "react";
import styled from "styled-components";
import { Container } from "../../components/container";
import { BackButton, Link, Text, Title } from "../../components/generics";
import { Footer } from "../../components/generics/footer";
import { AboutView } from "../../components/views/about";
import { MinimalView } from "../../components/views/minimal";
import Colors, { Gradients } from "../../constants/colors";

const TextContainer = styled(Container)`
  display: block;
  color: ${(props) => props.theme.textColor} !important;
  height: 80%;
  overflow: auto;
`;

export const AboutBox = styled(MinimalView)`
  display: flex;
  background: ${Gradients.ABOUT_PAGE};

  align-items: flex-start;
  border-radius: 4px;
  max-width: 650px;
  padding: 1em;
  box-shadow: 0px 0px 40px rgba(0, 0, 0, 0.4);

  @media (max-width: 460px) {
    margin: 1em 5%;
  }
`;

const About: React.FC = () => (
  <AboutView>
    <AboutBox>
      <Container padding="1em 0" alignItems="center">
        <BackButton color={Colors.WHITE} href="/" />
        <Title fontSize="36px" color="white">
          About Me
        </Title>
      </Container>
      <TextContainer direction="column" padding="0 12px">
        <Text>
          I'm Blake - a full-stack software engineer based in Melbourne,
          Australia.
        </Text>

        <Text>
          Most of the projects I work on use JavaScript or TypeScript but I'm
          also experienced in other languages such as Java and Swift for native
          app development. I'm motivated to learn new concepts and languages
          taking advantage of existing knowledge of programming paradigms to
          pick them up efficiently and effectively.
        </Text>

        <Text>
          I'm also well-versed in many other technologies such as CSS, React
          (and React Native), Python, Ionic + Capacitor and others.
        </Text>
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
