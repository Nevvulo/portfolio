import type React from "react";
import styled from "styled-components";
import { Container } from "../container";
import { BackButton, HomeButton, Title } from "../generics";

export type NavbarProps = {
  title: string;
  route?: string;
  style?: React.CSSProperties;
};
export function Navbar({ title, route = "/", style }: NavbarProps) {
  return (
    <NavbarContainer style={style}>
      <NavbarBackground>
        <BackButton href={route} />
        <Title fontSize="20px">{title}</Title>
        <HomeButton />
      </NavbarBackground>
    </NavbarContainer>
  );
}

const NavbarBackground = styled(Container)`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  border-radius: 6px;
  background-color: rgba(215, 215, 215, 0.25);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: 0px 0px 16px rgba(0, 0, 0, 0.35);
`;

const NavbarContainer = styled(Container)`
  position: sticky;
  top: 0;
  width: 100%;
  max-width: 700px;
  z-index: 9;
  margin-left: auto;
  margin-right: auto;
`;
