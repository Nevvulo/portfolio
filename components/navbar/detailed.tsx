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
            <ButtonLink style={btnStyle}>Blog</ButtonLink>
          </CustomLink>
          <CustomLink href={ROUTES.PROJECTS.ROOT}>
            <ButtonLink style={btnStyle}>Projects</ButtonLink>
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
                <ButtonLink style={btnStyle}>About Me</ButtonLink>
              </CustomLink>
              <CustomLink href={ROUTES.CONTACT}>
                <ButtonLink style={btnStyle}>Contact</ButtonLink>
              </CustomLink>
            </>
          )}
        </NavbarBackground>
      </NavbarContainer>
      {contextMenuOpen && smallDisplay && (
        <ContextMenu>
          <CustomLink href={ROUTES.ABOUT}>
            <ButtonLink style={btnStyle}>About Me</ButtonLink>
          </CustomLink>
          <CustomLink href={ROUTES.CONTACT}>
            <ButtonLink style={btnStyle}>Contact</ButtonLink>
          </CustomLink>
        </ContextMenu>
      )}
    </DetailedContainer>
  );
}

const DetailedContainer = styled.div`
  margin-top: 2em;
  width: 100%;
`;

const ContextMenu = styled(Container).attrs({ direction: "column" })`
  background: rgba(0, 0, 0, 0.8);
  animation: ${riseUpSmall} 0.3s ease-in-out;
  padding: 0.4em;
  right: 2.5%;
  z-index: 99;
  top: 82px;
  position: fixed;
  margin-left: auto;
  border-radius: 6px;
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
  const ref = useRef<HTMLDivElement>(null);

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
  HTMLDivElement,
  PropsWithChildren<{ onClick: () => void; open: boolean }>
>((props, ref) => (
  <MenuIconContainer onClick={props.onClick} ref={ref}>
    <input type="checkbox" />
    <div>
      <span></span>
      <span></span>
    </div>
  </MenuIconContainer>
));

const MenuIconContainer = styled.div`
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
`;

const NavbarContainer = styled(Container)`
  position: relative;
  top: 0;
  width: 100%;
  max-width: 700px;
  z-index: 9;
  margin-left: auto;
  margin-right: auto;
`;
