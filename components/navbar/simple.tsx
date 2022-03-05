import { PropsWithChildren } from "react";
import type { NavbarProps } from ".";
import { Container } from "../container";
import { Header, BackButton, Title, Emoji } from "../generics";

type SimpleNavbarProps = NavbarProps & { id: string; emoji: string };
export function SimpleNavbar({
  route = "/",
  id,
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
