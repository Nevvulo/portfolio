import {
  faArrowLeft,
  faExternalLinkAlt,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import { m } from "framer-motion";
import React, { HTMLAttributes } from "react";
import Link, { LinkProps } from "next/link";
import styled from "styled-components";
import { ROUTES } from "../../constants/routes";
import { Container } from "../container";

const ButtonIcon = styled(FontAwesomeIcon)`
  margin-right: 12px;
`;

const IconLinkContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;

  * {
    margin-right: 12px;
  }
`;

export type ButtonProps = HTMLAttributes<HTMLButtonElement> &
  FontAwesomeIconProps;
export const Button: React.FC<ButtonProps> = ({
  icon,
  color,
  size,
  className,
  onClick,
  children,
}) => (
  <button onClick={onClick} className={className}>
    <Container alignItems="center" direction="row">
      <ButtonIcon icon={icon} color={color} size={size} />
      {children}
    </Container>
  </button>
);

export type AnimatedButtonProps = HTMLAttributes<HTMLAnchorElement> &
  FontAwesomeIconProps;
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  icon,
  color,
  size,
  className,
  onClick,
  children,
  href,
}) => (
  <m.a
    onClick={onClick}
    target={href ? "_blank" : void 0}
    href={href}
    referrerPolicy="no-referrer"
    className={className}
  >
    <Container alignItems="center" direction="row">
      <ButtonIcon icon={icon} color={color} size={size} />
      {children}
    </Container>
  </m.a>
);

export type IconLinkProps = Partial<LinkProps> &
  FontAwesomeIconProps & { isExternal?: boolean };
export const IconLink: React.FC<IconLinkProps> = ({
  href = "/",
  className,
  children,
  isExternal = false,
  ...iconProps
}) => (
  <IconLinkContainer>
    {!children ? (
      <Link href={href}>
        <FontAwesomeIcon width="24" height="24" {...iconProps} />
      </Link>
    ) : (
      <Link href={href}>{children || " "}</Link>
    )}

    {isExternal && (
      <FontAwesomeIcon width="12" height="12" icon={faExternalLinkAlt} />
    )}
  </IconLinkContainer>
);

export const BackButton = styled(IconLink).attrs((props) => ({
  ...props,
  icon: faArrowLeft,
  role: "back",
  style: { marginRight: 24, cursor: "pointer" },
}))`
  padding: 1em;
  color: ${(props) => props.color || props.theme.pure};
  font-family: "Roboto", sans-serif;

  svg {
    padding-right: 12px;
  }
`;

export const HomeButton = styled(IconLink).attrs((props) => ({
  ...props,
  icon: faHome,
  role: "back",
  to: ROUTES.ROOT,
}))`
  padding: 1em;
  color: ${(props) => props.color || "white"};
  font-family: "Roboto", sans-serif;

  svg {
    padding-right: 12px;
  }
`;
