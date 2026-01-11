import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styled, { type DefaultTheme, useTheme } from "styled-components";
import useMediaQuery from "../../hooks/useMediaQuery";
import { Container } from "../container";
import { Skeleton } from "../generics/skeleton";
import { Title } from "../generics/title";
import { Label, Labels } from "./labels";
import { SkeletonImage } from "./skeleton-image";

function getDifficultyBackground(difficulty: Difficulty | undefined, theme: DefaultTheme) {
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
  const difficultyBackground = getDifficultyBackground(difficulty as Difficulty, theme);

  return (
    <Link href={`/blog/${slug}`} scroll={false} style={{ textDecoration: "none" }}>
      <PreviewContainer>
        <Post>
          <PreviewText direction="column">
            {!loading ? <Title fontSize="27px">{title}</Title> : <Skeleton height={32} />}
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
                  .map((label) => (
                    <Label key={label}>{label}</Label>
                  ))}
              </Labels>
            ) : null}
            <MetaContainer>
              {readTimeMins && (
                <ReadTimeContainer>
                  <FontAwesomeIcon icon={faClock} />
                  <span>{readTimeMins} mins</span>
                </ReadTimeContainer>
              )}
              {difficultyBackground && (
                <DifficultyIndicator color={difficultyBackground}>{difficulty}</DifficultyIndicator>
              )}
            </MetaContainer>
          </PreviewText>
          <ImageWrapper>
            <SkeletonImage
              alt={title || "Blog post image"}
              width={!isSmallDisplay ? 150 : 400}
              height={!isSmallDisplay ? 150 : 200}
              quality={75}
              priority={prioritizeImage}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
              src={`https://raw.githubusercontent.com/Nevvulo/blog/main/posts/assets/${slug}/${image}`}
            />
          </ImageWrapper>
        </Post>
      </PreviewContainer>
    </Link>
  );
}

//https://codepen.io/taylorvowell/pen/BkxbC
const Post = styled.div`
  display: flex;
  flex-direction: row;
  background: ${(props) => props.theme.postBackground};
  color: black;
  border-radius: 8px 0 0 8px;
  box-shadow: 1px 5px 8px rgba(0, 0, 0, 0.3);
  align-items: stretch;
  text-decoration: none;
  width: 100%;
  cursor: pointer;
  margin: 1em 0;
  padding: 0;
  min-height: 150px;
  overflow: hidden;

  @media (max-width: 460px) {
    flex-direction: column-reverse;
    min-width: 200px;
    min-height: auto;
    border-radius: 0 0 8px 8px;
  }
`;

const PreviewText = styled(Container)`
  margin: 0;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  color: ${(props) => props.theme.contrast};
  flex: 1;
  justify-content: flex-start;
  gap: 0.25em;

  @media (max-width: 460px) {
    padding: 1.25rem 1.25rem 0.75rem 1.25rem;
  }
`;

const MetaContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 4px;
`;

const ReadTimeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 4px;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-sans);
  color: ${(props) => props.theme.textColor};
`;

const PreviewDescription = styled.p`
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-sans);
  letter-spacing: -0.5px;
  color: ${(props) => props.theme.postDescriptionText};
`;

const PreviewContainer = styled.div`
  text-decoration: none;
  overflow: hidden;
  width: 100%;
`;

const ImageWrapper = styled.div`
  width: 200px;
  flex-shrink: 0;
  overflow: hidden;
  margin: 0;

  @media (max-width: 460px) {
    width: 100%;
    height: 200px;
  }
`;

const DifficultyIndicator = styled.div<{ color: string }>`
  background: ${(props) => props.color};
  padding: 0 0.6em;
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid rgba(0, 0, 0, 0.3);
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.4);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: -0.3px;
  border-radius: 4px;
  color: white;
`;
