import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";
import styled from "styled-components";
import { Text } from "../generics";
import * as Fathom from "fathom-client";

const Container = styled.div`
  border-radius: 4px;
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  font-family: "Inter", sans-serif;
  padding: 0.25em 1em;
  align-items: center;
  height: 32px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-weight: 600;

  svg {
    padding-right: 8px;
  }
`;

const LogoutButton = styled.button`
  background: #bd433c;
  opacity: 0.85;
  border: none;
  font-weight: 400;
  height: 24px;
  font-size: 12px;
  font-family: "Fira Code";
  padding: 0 1em;
  letter-spacing: -0.5px;
  margin: 2px 0 0 0;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  margin-left: auto;
`;

const Avatar = styled.img`
  border-radius: 100%;
  padding: 4px;
  min-width: 16px;
  min-height: 16px;
  margin: 0 2px 0 6px;
`;

const UserContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0 1em;
  justify-content: space-between;
`;

const UserSection = styled(Text)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  height: 100%;
  padding-left: 2px;
  margin: 4px;
  color: rgba(225, 228, 225) !important;

  > b {
    color: white;
  }
`;

export default function GitHubAuthSection() {
  const { status, data } = useSession({ required: false });
  return (
    <Container>
      {status !== "authenticated" ? (
        <UserSection>
          <ActionButton
            onClick={() => {
              // github authentication goal
              Fathom.trackGoal("CT5MFO6L", 0);
              signIn("github");
            }}
          >
            <FontAwesomeIcon
              color="white"
              height="16"
              width="16"
              icon={faGithub}
            />
            Sign in with GitHub to leave feedback
          </ActionButton>
        </UserSection>
      ) : (
        <UserContainer>
          <FontAwesomeIcon
            color="white"
            height="16"
            width="16"
            icon={faGithub}
          />
          <UserSection fontSize="14px">
            Signed in as{" "}
            <Avatar width="16px" height="16px" src={data.user.image} />
            <b>{data.user.name || data.user.email}</b>
          </UserSection>
          <LogoutButton onClick={() => signOut()}>Logout</LogoutButton> <br />
        </UserContainer>
      )}
    </Container>
  );
}
