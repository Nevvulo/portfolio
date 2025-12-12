import Head from "next/head";
import styled from "styled-components";
import { Subtitle } from "../../components/about/typography";
import { Container } from "../../components/container";
import { IconLink, Link, Text } from "../../components/generics";
import { Footer } from "../../components/generics/footer";
import { AboutBox } from "../../components/layout/about";
import { TopNavView } from "../../components/layout/topnav";
import { SimpleNavbar } from "../../components/navbar/simple";
import COLORS from "../../constants/colors";
import { ROUTES } from "../../constants/routes";

export default function About() {
  return (
    <TopNavView>
      <Background />
      <SimpleNavbar title="About" />

      <AboutBox>
        <TextContainer>
          <Subtitle>Who am I?</Subtitle>
          <Text>
            I'm Blake - a software engineer based in Melbourne, Australia working at{" "}
            <Link color={COLORS.UNLOAN_YELLOW} href={ROUTES.PROJECTS.UNLOAN}>
              Unloan
            </Link>{" "}
            for CBA. I'm passionate about giving users the best experiences in applications because
            that's what they deserve.
          </Text>

          <Subtitle>What do I do?</Subtitle>
          <Text>
            I primarily work with <b>TypeScript</b> and <b>JavaScript</b>, but I have experience
            working with lower level languages such as <b>Java</b> and <b>Swift</b> for native app
            development. I am proficient with{" "}
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
            for building front-end interfaces with layouts and performance built for the modern web.
            I also spend just as much time working on the back-end of applications, such as handling
            business logic, solving problems at scale and server management.
          </Text>

          <Text>
            I'm also well-versed in many other areas such as CSS, Python, Ionic/Capacitor and{" "}
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
            as a medium to learn new (or solidify existing) concepts while teaching others in a
            concise, fun and unique way.
          </Text>
        </TextContainer>

        <Footer>
          <Text>
            Wanna get in touch? You can <Link href="/contact">contact me</Link>, or check out some
            of <Link href="/projects">my projects</Link>
          </Text>
        </Footer>
      </AboutBox>

      <Head key="about">
        <title>About - Nevulo</title>
        <meta
          name="description"
          content="Learn about Blake, a software engineer based in Melbourne, Australia. Passionate about building exceptional digital experiences."
        />
        <meta property="og:title" content="About Nevulo" />
        <meta
          property="og:description"
          content="Learn about Blake, a software engineer based in Melbourne, Australia. Passionate about building exceptional digital experiences."
        />
        <meta property="og:url" content="https://nev.so/about" />
        <meta
          property="og:image"
          content="https://nev.so/api/og?title=About%20Blake&subtitle=Software%20Engineer%20%7C%20Melbourne%2C%20Australia"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Nevulo" />
        <meta
          name="twitter:description"
          content="Learn about Blake, a software engineer based in Melbourne, Australia."
        />
        <meta
          name="twitter:image"
          content="https://nev.so/api/og?title=About%20Blake&subtitle=Software%20Engineer%20%7C%20Melbourne%2C%20Australia"
        />
      </Head>
    </TopNavView>
  );
}

const Background = styled.div`
  width: 100%;
  filter: ${(props) => (props.theme.contrast === "#000" ? "invert(1)" : "")};
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
