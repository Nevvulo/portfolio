import { PropsWithChildren } from "react";
import type { NavbarProps } from ".";
import { Container } from "../container";
import { Header, BackButton, Title, Emoji } from "../generics";

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
        <BackButton color="white" href={route} />
        <Title fontSize="36px" color="white">
          <Emoji>{emoji}</Emoji> {title}
        </Title>
      </Container>
      {children}
    </Header>
  );
}
