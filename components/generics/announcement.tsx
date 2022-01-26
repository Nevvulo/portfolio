import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PropsWithChildren } from "react";
import styled from "styled-components";
import { Link } from ".";
import { Container } from "../container";

export function Announcement({ children }: PropsWithChildren<unknown>) {
  return (
    <AnnouncementContainer>
      <p style={{ margin: "0.5em 0", fontSize: "16px" }}>
        <FontAwesomeIcon
          style={{ marginRight: 8, width: "14px", height: "14px" }}
          icon={faBell}
        />
        {children}
      </p>
    </AnnouncementContainer>
  );
}

export const AnnouncementContainer = styled(Container)`
  background: rgba(255, 208, 115, 0.3);
  padding: 0em 1em;
  width: 85%;
  max-width: 600px;
  text-align: center;
  position: absolute;
  color: rgba(255, 230, 140) !important;
  top: 0;
  margin-top: 1em;
  border: 0.25px solid rgba(25, 25, 25, 0.25);
  border-radius: 8px;
  color: white;
  font-family: "Inter", sans-serif;
  letter-spacing: -0.5px;
`;
