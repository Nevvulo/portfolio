import { faArrowLeft, faHome } from "@fortawesome/free-solid-svg-icons";
import {
  FontAwesomeIcon,
  FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import { m } from "framer-motion";
import React, { HTMLAttributes } from "react";
import styled from "styled-components";
import { ROUTES } from "../../constants/routes";
import { Container } from "../container";
import { IconLink } from "./link";

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

export const BackButton = styled(IconLink).attrs((props) => ({
  ...props,
  icon: faArrowLeft,
  role: "back",
  color: props.color || props.theme.contrast || "white",
  style: { marginRight: 22, height: 24, fontWeight: 800, cursor: "pointer" },
}))``;

export const HomeButton = styled(IconLink).attrs((props) => ({
  ...props,
  icon: faHome,
  role: "back",
  color: props.color || "white",
  to: ROUTES.ROOT,
  style: { cursor: "pointer" },
}))``;
