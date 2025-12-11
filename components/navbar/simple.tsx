import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import styled from "styled-components";
import NevuloLogo from "../../assets/svg/nevulo-huge-bold-svg.svg";
import { BackButton, Header } from "../generics";
import type { NavbarProps } from ".";

type SimpleNavbarProps = Omit<NavbarProps, 'title'> & { title?: string; backRoute?: string };
export function SimpleNavbar({ title, backRoute, children }: PropsWithChildren<SimpleNavbarProps>) {
  return (
    <Header justifyContent="center" direction="column">
      <NavContainer>
        <Spacer>{backRoute && <BackButton href={backRoute} />}</Spacer>
        <CenterContainer>
          <Link href="/" style={{ textDecoration: "none" }}>
            <LogoContainer>
              <Image
                src={NevuloLogo}
                alt="Nevulo Logo"
                width={32}
                height={32}
                style={{ marginRight: "12px" }}
              />
              <NevuloTitle>nevulo</NevuloTitle>
            </LogoContainer>
          </Link>
        </CenterContainer>
        <Spacer />
      </NavContainer>
      {title && (
        <TitleContainer>
          <PageTitle>{title}</PageTitle>
        </TitleContainer>
      )}
      {children && <TitleContainer>{children}</TitleContainer>}
    </Header>
  );
}

const NavContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const CenterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
`;

const Spacer = styled.div`
  width: 100px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const NevuloTitle = styled.h1`
  font-family: "Sixtyfour", monospace;
  font-weight: 400;
  color: ${(props) => props.theme.contrast};
  font-size: clamp(28px, 5vmax, 48px);
  margin: 0;
  letter-spacing: -1px;
`;

const TitleContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;

  @media (min-width: 1024px) {
    padding: 0 2rem;
  }
`;

const PageTitle = styled.h2`
  font-family: "Inter", sans-serif;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  font-size: 32px;
  margin: 1rem 0 0 0;
  text-align: left;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;
