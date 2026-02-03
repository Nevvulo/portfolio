import Link from "next/link";
import type React from "react";
import { forwardRef, type PropsWithChildren, useRef, useState } from "react";
import styled from "styled-components";
import { ROUTES } from "../../constants/routes";
import useMediaQuery from "../../hooks/useMediaQuery";
import { riseUpSmall } from "../../utils/animation";
import { Container } from "../container";
import { Avatar, CustomLink } from "../generics";
import { ButtonLink } from "../home/button";

export type NavbarProps = {
  style?: React.CSSProperties;
};
export function DetailedNavbar({ style }: NavbarProps) {
  const fontSize = "clamp(1rem, 1.5vw, 2rem)";
  const btnStyle = { fontSize, padding: "0.4em 1em" };
  const smallDisplay = useMediaQuery("(max-width: 550px)");
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  return (
    <DetailedContainer>
      <NavbarContainer style={style}>
        <NavbarBackground>
          <Link href={ROUTES.ROOT}>
            <Avatar border width={38} height={38} />
          </Link>

          <CustomLink href={ROUTES.BLOG.ROOT}>
            <ButtonLink as="span" style={btnStyle}>
              Blog
            </ButtonLink>
          </CustomLink>
          <CustomLink href={ROUTES.PROJECTS.ROOT}>
            <ButtonLink as="span" style={btnStyle}>
              Work
            </ButtonLink>
          </CustomLink>
          {smallDisplay ? (
            <CollapsibleContent
              collapsed={!contextMenuOpen}
              onExpand={() => setContextMenuOpen(true)}
              onCollapse={() => setContextMenuOpen(false)}
            />
          ) : (
            <>
              <CustomLink href={ROUTES.ABOUT}>
                <ButtonLink as="span" style={btnStyle}>
                  About Me
                </ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.CONTACT}>
                <ButtonLink as="span" style={btnStyle}>
                  Contact
                </ButtonLink>
              </CustomLink>
            </>
          )}
        </NavbarBackground>
      </NavbarContainer>
      {contextMenuOpen && smallDisplay && (
        <ContextMenu>
          <CustomLink href={ROUTES.ABOUT}>
            <ButtonLink as="span" style={btnStyle}>
              About Me
            </ButtonLink>
          </CustomLink>
          <CustomLink href={ROUTES.CONTACT}>
            <ButtonLink as="span" style={btnStyle}>
              Contact
            </ButtonLink>
          </CustomLink>
        </ContextMenu>
      )}
    </DetailedContainer>
  );
}

const DetailedContainer = styled.div`
  margin-top: 0;
  padding-top: 1rem;
  margin-bottom: 1rem;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-left: 1rem;
  padding-right: 1rem;
  
  @media (max-width: 768px) {
    padding-top: 0.75rem;
    margin-bottom: 0.75rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
`;

const ContextMenu = styled(Container).attrs({ direction: "column" })`
  background: ${(props) => props.theme.menuBackground};
  animation: ${riseUpSmall} 0.3s ease-in-out;
  padding: 0.4em;
  right: 2.5%;
  z-index: 99;
  top: 82px;
  position: fixed;
  margin-left: auto;
  border-radius: 6px;
  border: 1px solid ${(props) => props.theme.menuBorder};
  box-shadow: 0 4px 20px ${(props) => props.theme.menuShadow};
`;

function CollapsibleContent({
  collapsed,
  onExpand,
  onCollapse,
}: PropsWithChildren<{
  collapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}>) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <MenuIcon
      open={!collapsed}
      ref={ref}
      onClick={() => {
        if (collapsed) onExpand?.();
        else onCollapse?.();
      }}
    />
  );
}

const MenuIcon = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<{ onClick: () => void; open: boolean }>
>((props, ref) => (
  <MenuIconContainer
    onClick={props.onClick}
    ref={ref}
    aria-label="Toggle navigation menu"
    aria-expanded={props.open}
  >
    <input type="checkbox" checked={props.open} aria-hidden="true" tabIndex={-1} readOnly />
    <div aria-hidden="true">
      <span></span>
      <span></span>
    </div>
  </MenuIconContainer>
));

const MenuIconContainer = styled.button`
  background: none;
  border: none;
  position: relative;
  width: 50px;
  height: 50px;
  cursor: pointer;

  input {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    z-index: 2;
    -webkit-touch-callout: none;
    position: absolute;
    opacity: 0;
  }
  div {
    margin: auto;
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    width: 22px;
    height: 12px;
  }
  span {
    position: absolute;
    display: block;
    width: 100%;
    height: 2px;
    background-color: ${(props) => props.theme.contrast};
    border-radius: 1px;
    transition: all 0.2s cubic-bezier(0.1, 0.82, 0.76, 0.965);

    &:first-of-type {
      top: 0;
    }
    &:last-of-type {
      bottom: 0;
    }
  }
  &.active,
  input:checked + div {
    span {
      &:first-of-type {
        transform: rotate(45deg);
        top: 5px;
      }
      &:last-of-type {
        transform: rotate(-45deg);
        bottom: 5px;
      }
    }
  }

  &.active:hover span:first-of-type,
  &.active:hover span:last-of-type,
  &:hover input:checked + div span:first-of-type,
  &:hover input:checked + div span:last-of-type {
    width: 22px;
  }

  &:hover {
    // no need hover effect on mobile.
    @media (min-width: 1024px) {
      span:first-of-type {
        width: 26px;
      }

      span:last-of-type {
        width: 12px;
      }
    }
  }
`;

const NavbarBackground = styled(Container)`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-radius: 6px;
  padding: 0 0.5em;
  gap: 0.5em;

  @media (max-width: 550px) {
    gap: 0.25em;
  }
`;

const NavbarContainer = styled(Container)`
  position: relative;
  top: 0;
  width: 100%;
  max-width: 700px;
  z-index: 9;
  margin: 0 auto;
`;
