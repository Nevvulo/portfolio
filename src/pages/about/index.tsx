import React from "react";
import { BackButton, Header, Text, Title } from "../../components/generics";
import { MinimalView } from "../../components/views/minimal";
import { Page } from "../../components/views/page";
import Colors, { Gradients } from "../../constants/colors";

const About: React.FC = () => (
  <MinimalView>
    <Page background={Gradients.ABOUT_PAGE}>
      <Header>
        <BackButton color={Colors.WHITE} to="/" />
        <Title>About Me</Title>
      </Header>
      <Text>
        I'm Blake - a full-stack software engineer based in Melbourne,
        Australia.
      </Text>

      <Text>
        Most of the projects I work on use JavaScript or TypeScript but I'm also
        experienced in other languages such as Java and Swift for native app
        development. I'm motivated to learn new concepts and languages taking
        advantage of existing knowledge of programming paradigms to pick them up
        efficiently and effectively.
      </Text>

      <Text>
        I'm also well-versed in many other technologies such as CSS, React (and
        React Native), Python, Ionic + Capacitor and others.
      </Text>
    </Page>
  </MinimalView>
);

export default About;
