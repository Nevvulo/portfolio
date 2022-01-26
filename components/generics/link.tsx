import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import {
  FontAwesomeIconProps,
  FontAwesomeIcon,
} from "@fortawesome/react-fontawesome";
import NextLink from "next/link";
import { PropsWithChildren } from "react";
import styled from "styled-components";
import COLORS from "../../constants/colors";

type LinkProps = { href: string; color?: string; underline?: boolean };
export function Link({
  href,
  color,
  children,
  underline,
}: PropsWithChildren<LinkProps>) {
  if (underline)
    return (
      <NextLink passHref href={href}>
        <>
          <LinkText color={color}>{children}</LinkText>
        </>
      </NextLink>
    );

  return (
    <StrippedLink passHref href={href}>
      <LinkText color={color}>{children}</LinkText>
    </StrippedLink>
  );
}

export function CustomLink({ href, children }: PropsWithChildren<LinkProps>) {
  return (
    <StrippedLink passHref href={href}>
      {children}
    </StrippedLink>
  );
}

const IconLinkContainer = styled.div`
  display: inline;
  align-items: center;
  flex-direction: row;
`;

export type IconLinkProps = Partial<LinkProps> &
  Omit<FontAwesomeIconProps, "icon"> & {
    isExternal?: boolean;
    icon?: IconProp;
  };
export const IconLink: React.FC<IconLinkProps> = ({
  href = "/",
  className,
  color,
  children,
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
        <Link color={color} href={href}>
          {children || " "}
        </Link>
      </>
    )}

    {isExternal && (
      <FontAwesomeIcon
        aria-role="external-link"
        color="#bbbbbb"
        style={{
          width: "10px",
          marginLeft: "6px",
          marginRight: spacing || "2px",
          alignSelf: "flex-end",
          position: "relative",
          top: "2px",
        }}
        icon={faExternalLinkAlt}
      />
    )}
  </IconLinkContainer>
);

export const LinkText = styled.a<{ color?: string }>`
  color: ${(props) => props.color || COLORS.LINK};
  font-family: "Fira Code", monospace;
  font-size: 15px;
  font-weight: 600;
`;

export const StrippedLink = styled(NextLink)`
  text-decoration: none;
`;
