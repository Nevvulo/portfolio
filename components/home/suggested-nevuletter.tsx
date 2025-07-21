import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as Fathom from "fathom-client";
import { m } from "framer-motion";
import Image from "next/image";
import styled from "styled-components";
import { LatestNevuletterResponse } from "../../types/nevuletter";
import { Container } from "../container";
import { StrippedLink, Title } from "../generics";

export const NevuletterLink = styled(m.a)`
  text-decoration: none;
  opacity: 0.75;
  cursor: pointer;
  background: linear-gradient(to bottom, #212121, #171717);
  padding: 0.6em min(2vw, 1.5em);
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: clamp(2vmin, 1.4rem, 6vmax);
  margin: 0.25em;
  border: 0;
  outline: 0;
  color: white;
  border-radius: 4px;
`;

type SuggestedNevuletterProps = NonNullable<LatestNevuletterResponse["email"]>;
export function SuggestedNevuletter({
  title,
  image,
  createdAt,
  issueNo,
  url,
}: SuggestedNevuletterProps) {
  // view blog post goal
  function onClick() {
    Fathom.trackGoal("CTGT4BLM", 0);
  }

  return (
    <StrippedLink scroll={false} passHref href={url}>
      <PreviewContainer onClick={onClick}>
        <Post>
          <NevuletterImage
            layout="fill"
            priority
            quality={45}
            objectFit="cover"
            objectPosition="top"
            src={image}
          />
          <PreviewText direction="column">
            <NevuletterTitle>
              {title}{" "}
              <FontAwesomeIcon
                aria-role="external-link"
                color="#bbbbbb"
                style={{
                  width: "10px",
                  marginLeft: "6px",
                  marginRight: "2px",
                  alignSelf: "flex-end",
                  position: "relative",
                  top: "2px",
                }}
                icon={faExternalLinkAlt}
              />
            </NevuletterTitle>
            <PreviewDescription>
              Published {createdAt}
              {"  "}•{"  "}
              <BoldText>Nevuletter</BoldText> #{issueNo}
            </PreviewDescription>
          </PreviewText>
        </Post>
      </PreviewContainer>
    </StrippedLink>
  );
}

const BoldText = styled.b`
  color: ${(props) => props.theme.contrast};
`;

const NevuletterImage = styled(Image)`
  flex: 1;
  border-radius: 6px;
  opacity: 0.2;
`;

//https://codepen.io/taylorvowell/pen/BkxbC
const Post = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  background: ${(props) => props.theme.postBackground};
  color: black;
  border-radius: 8px;
  box-shadow: 1px 5px 8px rgba(0, 0, 0, 0.3);
  align-self: center;
  justify-self: center;
  text-decoration: none;
  max-width: 650px;
  cursor: pointer;
  margin: 1em 0.5em;
  padding: 0.5em;
`;

const PreviewText = styled(Container)`
  flex: 1;
  margin: 12px;
  max-width: 450px;
  color: ${(props) => props.theme.contrast};

  @media (max-width: 460px) {
    margin: 1em;
  }
`;

const NevuletterTitle = styled(Title)`
  font-size: clamp(1em, 2vw, 22px);
  letter-spacing: -0.1px;
  font-weight: 500;
`;

const PreviewDescription = styled.p`
  font-size: 14px;
  font-weight: 500;
  font-family: "Inter", sans-serif;
  letter-spacing: -0.5px;
  margin-bottom: 0;
  color: ${(props) => props.theme.postDescriptionText};
`;

const PreviewContainer = styled.a.attrs({ target: "_blank" })`
  text-decoration: none;
  overflow: hidden;
  margin: 0 1em;
`;
