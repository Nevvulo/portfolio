import type { PropsWithChildren } from "react";
import { Container } from "../container";
import { BackButton, Emoji, Header, Title } from "../generics";
import type { NavbarProps } from ".";

type SimpleNavbarProps = NavbarProps & { emoji: string };
export function SimpleNavbar({
  route = "/",
  title,
  emoji,
  children,
}: PropsWithChildren<SimpleNavbarProps>) {
  return (
    <Header justifyContent="center" direction="column">
      <Container alignItems="center">
        <BackButton href={route} />
        <Title fontSize="36px">
          <Emoji>{emoji}</Emoji> {title}
        </Title>
      </Container>
      {children}
    </Header>
  );
}
