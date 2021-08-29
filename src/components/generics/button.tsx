import {
  faArrowLeft,
  faExternalLinkAlt,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import React, { HTMLAttributes } from "react";
import { Link, LinkProps } from "react-router-dom";
import styled from "styled-components";
import { ROUTES } from "../../constants/routes";
import { Container } from "../container";

const ButtonIcon = styled(FontAwesomeIcon)`
  margin-right: 12px;
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
  <motion.a
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
  </motion.a>
);

export type IconLinkProps = Partial<LinkProps> &
  FontAwesomeIconProps & { isExternal?: boolean };
export const IconLink: React.FC<IconLinkProps> = ({
  to,
  href,
  className,
  children,
  isExternal = false,
  ...iconProps
}) => (
  <>
    {href ? (
      <a href={href}>
        <FontAwesomeIcon {...iconProps} />
        {children} {isExternal && <FontAwesomeIcon icon={faExternalLinkAlt} />}
      </a>
    ) : (
      <Link to={to || ""} className={className}>
        <FontAwesomeIcon {...iconProps} />
        {children} {isExternal && <FontAwesomeIcon icon={faExternalLinkAlt} />}
      </Link>
    )}
  </>
);

export const BackButton = styled(IconLink).attrs((props) => ({
  ...props,
  icon: faArrowLeft,
  role: "back",
}))`
  padding: 1em;
  color: ${(props) => props.color || "white"};
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
