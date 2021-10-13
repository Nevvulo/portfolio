import { useSession } from "next-auth/react";
import React from "react";
import styled from "styled-components";
import { Container } from "../container";
import { Comment } from "./comment";
import { CommentsForm } from "./comments-form";

export const CommentsContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  background: #343136;
  padding: 1.5em;
  padding-top: 1em;
  border: 1px solid rgba(0, 0, 0, 0.75);
  border-radius: 8px;
`;

const Header = styled(Container)`
  margin-top: 12px;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  font-size: 24px;
  font-weight: 500;
  color: ${(props) => props.theme.pure};
  margin: 0;
`;

const CommentCount = styled.h4`
  font-size: 18px;
  font-family: "Fira Code", monospace;
  margin: 0;
  margin-left: 10px;
  margin-top: 2px;
  font-weight: 400;
  color: ${(props) => props.theme.pure};
`;

export default function Comments({ total, comments, onCommentSubmitted }: any) {
  const { status } = useSession({ required: false });
  return (
    <CommentsContainer>
      <Header alignItems="center">
        <Title>Comments</Title>
        <CommentCount>• {total}</CommentCount>
      </Header>
      {comments?.map((comment, i) => (
        <Comment
          key={i}
          author={comment.author}
          content={comment.body}
          timestamp={comment.publishedAt}
        />
      ))}
      <CommentsForm
        disabled={status !== "authenticated"}
        onCommentSubmitted={onCommentSubmitted}
      />
    </CommentsContainer>
  );
}
