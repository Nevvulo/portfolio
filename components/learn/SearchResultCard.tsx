import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import styled, { type DefaultTheme, useTheme } from "styled-components";
import type { SearchResult } from "../../hooks/useBlogSearch";
import { Label, Labels } from "../blog/labels";
import { SkeletonImage } from "../blog/skeleton-image";
import { Title } from "../generics/title";

function getDifficultyBackground(difficulty: string | undefined, theme: DefaultTheme) {
  const {
    difficultyAdvancedBackground,
    difficultyIntermediateBackground,
    difficultyBeginnerBackground,
  } = theme;

  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return difficultyBeginnerBackground;
    case "intermediate":
      return difficultyIntermediateBackground;
    case "advanced":
      return difficultyAdvancedBackground;
    default:
      return undefined;
  }
}

interface SearchResultCardProps {
  result: SearchResult;
  prioritizeImage?: boolean;
}

export function SearchResultCard({ result, prioritizeImage }: SearchResultCardProps) {
  const theme = useTheme();
  const difficultyBackground = getDifficultyBackground(result.difficulty, theme);

  // Capitalize first letter of difficulty for display
  const difficultyDisplay = result.difficulty
    ? result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1)
    : null;

  return (
    <Link href={`/learn/${result.slug}`} style={{ textDecoration: "none" }}>
      <Card>
        <Content>
          <Title fontSize="24px">{result.title}</Title>
          <Description>{result.description}</Description>
          {result.labels?.length > 0 && (
            <Labels>
              {result.labels.slice(0, 3).map((label) => (
                <Label key={label}>{label.replace(/-/g, " ")}</Label>
              ))}
            </Labels>
          )}
          <MetaRow>
            {result.readTimeMins > 0 && (
              <ReadTime>
                <FontAwesomeIcon icon={faClock} />
                <span>{result.readTimeMins} mins</span>
              </ReadTime>
            )}
            {difficultyBackground && difficultyDisplay && (
              <DifficultyBadge $color={difficultyBackground}>{difficultyDisplay}</DifficultyBadge>
            )}
          </MetaRow>
        </Content>
        {result.coverImage && (
          <ImageWrapper>
            <SkeletonImage
              alt={result.title}
              fill
              style={{ objectFit: "cover" }}
              src={result.coverImage}
              priority={prioritizeImage}
            />
          </ImageWrapper>
        )}
      </Card>
    </Link>
  );
}

const Card = styled.div`
	display: flex;
	flex-direction: row;
	background: ${(props) => props.theme.postBackground};
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 12px;
	overflow: hidden;
	cursor: pointer;
	transition: all 0.2s ease;
	min-height: 140px;

	&:hover {
		border-color: rgba(144, 116, 242, 0.4);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	@media (max-width: 600px) {
		flex-direction: column-reverse;
		min-height: auto;
	}
`;

const Content = styled.div`
	flex: 1;
	padding: 16px 20px;
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`;

const Description = styled.p`
	margin: 0;
	font-size: 14px;
	font-family: var(--font-sans);
	color: ${(props) => props.theme.postDescriptionText};
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
`;

const MetaRow = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-top: auto;
	padding-top: 8px;
`;

const ReadTime = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	font-family: var(--font-sans);
	color: ${(props) => props.theme.textColor};
`;

const DifficultyBadge = styled.div<{ $color: string }>`
	background: ${(props) => props.$color};
	padding: 2px 8px;
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

const ImageWrapper = styled.div`
	position: relative;
	width: 180px;
	flex-shrink: 0;

	@media (max-width: 600px) {
		width: 100%;
		height: 160px;
	}
`;

export default SearchResultCard;
