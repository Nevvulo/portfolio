import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as Fathom from "fathom-client";
import Image from "next/image";
import React from "react";
import styled, { DefaultTheme, useTheme } from "styled-components";
import useMediaQuery from "../../hooks/useMediaQuery";
import { Container } from "../container";
import { StrippedLink } from "../generics/link";
import { Skeleton } from "../generics/skeleton";
import { Title } from "../generics/title";
import { Label, Labels } from "./labels";
import { SkeletonImage } from "./skeleton-image";

function getDifficultyBackground(
  difficulty: Difficulty | undefined,
  theme: DefaultTheme
) {
  const {
    difficultyAdvancedBackground,
    difficultyIntermediateBackground,
    difficultyBeginnerBackground,
  } = theme;

  switch (difficulty) {
    case "Beginner":
      return difficultyBeginnerBackground;
    case "Intermediate":
      return difficultyIntermediateBackground;
    case "Advanced":
      return difficultyAdvancedBackground;
    default:
      return undefined;
  }
}

type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type PreviewProps = {
  title?: string;
  slug: string;
  labels?: string[];
  image: string;
  prioritizeImage?: boolean;
  description?: string;
  loading?: boolean;
  readTimeMins?: number;
  difficulty?: string;
  author?: string;
};
export function PostPreview({
  title,
  slug,
  labels,
  image,
  prioritizeImage,
  description,
  loading,
  readTimeMins,
  difficulty,
}: PreviewProps) {
  const theme = useTheme();
  const isSmallDisplay = useMediaQuery("(max-width: 460px)");
  const difficultyBackground = getDifficultyBackground(
    difficulty as Difficulty,
    theme
  );

  // view blog post goal
  function onClick() {
    Fathom.trackGoal("CTGT4BLM", 0);
  }

  return (
    <StrippedLink scroll={false} passHref href={`/blog/${slug}`}>
      <PreviewContainer onClick={onClick}>
        <Post>
          <PreviewText direction="column">
            {!loading ? (
              <Title fontSize="27px">{title}</Title>
            ) : (
              <Skeleton height={32} />
            )}
            {!loading ? (
              <PreviewDescription>{description}</PreviewDescription>
            ) : (
              <Skeleton height={12} marginTop={12} marginBottom={12} />
            )}
            {labels?.length ? (
              <Labels>
                {labels
                  .map((m) => m.replace(/-/g, " "))
                  .slice(0, 3)
                  .map((label, i) => (
                    <Label key={i}>{label}</Label>
                  ))}
              </Labels>
            ) : null}
            <Container alignItems="center" direction="row">
              {readTimeMins && (
                <ReadTimeContainer direction="row">
                  <FontAwesomeIcon icon={faClock} />
                  <p>{readTimeMins} mins</p>
                </ReadTimeContainer>
              )}
              {difficultyBackground && (
                <DifficultyIndicator color={difficultyBackground}>
                  {difficulty}
                </DifficultyIndicator>
              )}
            </Container>
          </PreviewText>
          <SkeletonImage
            width={!isSmallDisplay ? 150 : undefined}
            height={!isSmallDisplay ? 150 : 125}
            sizes={!isSmallDisplay ? undefined : "100vw"}
            style={{ width: !isSmallDisplay ? undefined : "100%" }}
            quality={75}
            priority={prioritizeImage}
            objectFit="cover"
            alt="Post preview image"
            src={`https://raw.githubusercontent.com/Nevvulo/blog/main/posts/assets/${slug}/${image}`}
          />
        </Post>
      </PreviewContainer>
    </StrippedLink>
  );
}

//https://codepen.io/taylorvowell/pen/BkxbC
const Post = styled.div`
  display: flex;
  flex-direction: row;
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

  @media (max-width: 460px) {
    flex-direction: column-reverse;
    min-width: 200px;
    padding: 0;
  }
`;

const PreviewText = styled(Container)`
  margin: 20px 24px 0px 24px;
  max-width: 450px;
  color: ${(props) => props.theme.contrast};

  @media (max-width: 460px) {
    margin: 1em;
  }
`;

const ReadTimeContainer = styled(Container)`
  font-size: 14px;
  font-weight: 500;
  font-family: "Inter", sans-serif;
  align-items: center;
  margin: 0;
  font-size: 12px;
  color: ${(props) => props.theme.textColor};

  p {
    margin: 0.5em;
    margin-left: 8px;
  }
`;

const PreviewDescription = styled.p`
  font-size: 14px;
  font-weight: 500;
  font-family: "Inter", sans-serif;
  letter-spacing: -0.5px;
  color: ${(props) => props.theme.postDescriptionText};
`;

const PreviewContainer = styled.a`
  text-decoration: none;
  overflow: hidden;
  margin: 0 1em;
`;

const DifficultyIndicator = styled.div<{ color: string }>`
  position: relative;
  background: ${(props) => props.color};
  padding: 0.07em 0.5em;
  font-weight: 600;
  top: 0px;
  line-height: 14px;
  border: 0.1px solid #212121;
  box-shadow: 2px 2px 0px black;
  font-family: "Fira Code", monospace;
  font-size: 11.8px;
  height: 14px;
  border-radius: 4px;
  margin: 0em;
  color: white;
`;
