import React from "react";
import { ROUTES } from "../../constants/routes";
import {
  BackButton,
  Header,
  Link,
  Text,
  Title,
} from "../../components/generics";
import { SocialLinks } from "../../components/social-links";
import { MinimalView } from "../../components/views/minimal";
import { Page } from "../../components/views/page";
import Colors, { Gradients } from "../../constants/colors";

const Contact: React.FC = () => (
  <MinimalView>
    <Page background={Gradients.CONTACT_PAGE}>
      <Header>
        <BackButton color={Colors.WHITE} size="lg" to="/" />
        <Title>Contact</Title>
      </Header>
      <Text>Wanna get in touch?</Text>
      <SocialLinks direction="row" />
      <Text>
        Reporting a potential security vulnerability or privacy concern
        regarding one of my{" "}
        <Link to={ROUTES.PROJECTS.MAINTAINED}>maintained projects</Link>? Please
        shoot me an e-mail by clicking the icon above.
      </Text>
    </Page>
  </MinimalView>
);

export default Contact;
