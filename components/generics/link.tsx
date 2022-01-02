import styled from "styled-components";
import NextLink from "next/link";

export const Link = styled(NextLink)<{ color?: string }>`
  color: ${(props) => props.color || "#907a4f2"};
  font-family: "Fira Code", monospace;
  font-size: 15px;
  font-weight: 600;
`;

export const StrippedLink = styled(NextLink)`
  text-decoration: none;
`;
