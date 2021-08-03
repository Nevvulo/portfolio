import React from "react";
import styled from "styled-components";
import { Container } from "../container";
import { BackButton, HomeButton, Title } from "../generics";

const NavbarBackground = styled(Container)`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  background-color: rgba(225, 225, 225, 0.1);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: 0px 0px 16px rgba(0, 0, 0, 0.2);

  a {
    justify-self: flex-start;
    padding-right: 0;
  }

  @media (prefers-color-scheme: dark) {
    h1,
    svg {
      color: white !important;
    }
  }
`;

const NavbarContainer = styled(Container)`
  position: sticky;
  top: 0;
  margin: 1em;
`;

interface NavbarProps {
  title: string;
  route: string;
}
export const Navbar: React.FC<NavbarProps> = ({ title, route }) => {
  return (
    <NavbarContainer>
      <NavbarBackground>
        <BackButton color="white" to={route} />
        <Title fontSize="20px">{title}</Title>
        <HomeButton color="black" />
      </NavbarBackground>
    </NavbarContainer>
  );
};
