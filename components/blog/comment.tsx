import styled from "styled-components";

const CommentContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: #212121;
  border-radius: 4px;
  padding: 0.25em 0.8em;
  margin: 0.25em 0.1em;
`;

const CommentAvatar = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 6px;
  padding: 0.2em;
  border-radius: 360px;
`;

const CommentUserContainer = styled.div`
  display: flex;
  font-weight: 600;
  margin-top: 4px;
  letter-spacing: -0.5px;
  font-size: 15px;
  align-items: center;
`;

const CommentContent = styled.p`
  font-size: 14px;
  margin: 0 0.25em 1em 0;
  color: white;
`;

const CommentTimestamp = styled.p`
  font-size: 12px;
  margin: 0;
  margin-left: 6px;
  font-weight: 400;
  letter-spacing: 0px;
  color: grey;
`;

const CommentAuthorUsername = styled.p`
  margin: 0;
  color: ${(props) => props.theme.pure};
`;

const CommentRatingsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 1em 0;
`;

interface CommentAuthor {
  avatarUrl: string;
  login: string;
}

interface Ratings {
  upvotes: number;
}

interface CommentProps {
  content: string;
  author?: CommentAuthor;
  timestamp: string;
  ratings?: Ratings;
}
export function Comment({ author, content, timestamp, ratings }: CommentProps) {
  const { avatarUrl: image, login: name } = author;
  const date = new Date(timestamp).toLocaleDateString();
  return (
    <CommentContainer>
      <CommentUserContainer>
        <CommentAvatar src={image} />
        <CommentAuthorUsername>{name}</CommentAuthorUsername>
        <CommentTimestamp>{date}</CommentTimestamp>
      </CommentUserContainer>
      <CommentContent>{content}</CommentContent>
    </CommentContainer>
  );
}
