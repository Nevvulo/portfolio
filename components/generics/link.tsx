import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import NextLink from "next/link";
import type { CSSProperties, PropsWithChildren } from "react";
import styled from "styled-components";
import COLORS from "../../constants/colors";

type LinkProps = {
  href: string;
  style?: CSSProperties;
  color?: string;
  underline?: boolean;
};
export function Link({ href, color, style, children }: PropsWithChildren<LinkProps>) {
  return (
    <NextLink href={href} style={{ textDecoration: "none" }}>
      <LinkTextStyled style={style} color={color} as="span">
        {children}
      </LinkTextStyled>
    </NextLink>
  );
}

export function CustomLink({ href, children }: PropsWithChildren<LinkProps>) {
  return (
    <NextLink href={href} passHref>
      {children}
    </NextLink>
  );
}

const IconLinkContainer = styled.span`
  display: inline;
  align-items: baseline;
`;

export type IconLinkProps = Partial<LinkProps> &
  Omit<FontAwesomeIconProps, "icon"> & {
    isExternal?: boolean;
    icon?: IconProp;
    children?: React.ReactNode;
  };
export const IconLink: React.FC<IconLinkProps> = ({
  href = "/",
  color,
  children,
  style,
  spacing,
  isExternal = false,
  ...iconProps
}) => (
  <IconLinkContainer>
    {!children ? (
      <Link color={color} href={href}>
        {iconProps.icon && (
          <FontAwesomeIcon
            width="24"
            height="24"
            {...iconProps}
            style={style}
            icon={iconProps.icon}
          />
        )}
      </Link>
    ) : (
      <>
        {iconProps.icon && (
          <FontAwesomeIcon
            color="white"
            width="22"
            height="22"
            style={{ marginRight: "8px" }}
            {...iconProps}
            icon={iconProps.icon}
          />
        )}
        <Link style={style} color={color} href={href}>
          {children || " "}
        </Link>
      </>
    )}

    {isExternal && (
      <FontAwesomeIcon
        role="img"
        aria-label="External link"
        color="#bbbbbb"
        style={{
          width: "10px",
          marginLeft: "4px",
          marginRight: spacing || "2px",
          display: "inline-block",
          verticalAlign: "baseline",
        }}
        icon={faExternalLinkAlt}
      />
    )}
  </IconLinkContainer>
);

const LinkTextStyled = styled.a<{ color?: string }>`
  color: ${(props) => props.color || COLORS.LINK};
  font-family: "Fira Code", monospace;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
`;

export const LinkText = LinkTextStyled;

export const StrippedLink = styled(NextLink)`
  text-decoration: none;
  display: block;
  width: 100%;
`;
