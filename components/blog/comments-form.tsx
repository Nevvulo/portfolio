import { useState } from "react";
import styled from "styled-components";
import { signIn } from "next-auth/react";

const Form = styled.form`
  margin-top: 4px;
`;

const CommentTextarea = styled.textarea`
  background: rgba(25, 25, 25, 0.5);
  user-select: none;
  color: white;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  letter-spacing: -0.5px;
  padding: 1em;
  border: 1px solid rgba(10, 10, 10, 0.5);
  width: calc(100% - 2em);
  resize: none;
  margin: 0;
  height: 80px;
`;

const SignInButton = styled.button`
  padding: 0.9em 1em;
  background: #9074f2;
  color: white;
  width: 100%;
  max-width: 250px;
  border: none;
  border-radius: 4px;
  box-shadow: 1px 4px 8px rgba(0, 0, 0, 0.5);
  font-family: "Fira Code", monospace;
  font-weight: 700;
  font-size: 14px;
  transition: 0.25s;

  :hover {
    background: #9f85f9;
    opacity: 0.95;
    transform: scale(1.025);
    cursor: pointer;
  }
`;

const CommentsPostButton = styled.button`
  padding: 0.5em 1em;
  background: #9074f2;
  color: white;
  border: none;
  border-radius: 4px;
  box-shadow: 1px 4px 8px rgba(0, 0, 0, 0.5);
  font-family: "Fira Code", monospace;
  font-weight: 700;
  margin: 1em;
  position: absolute;
  bottom: 24px;
  right: 24px;
  transition: 0.25s;

  :hover {
    background: #9f85f9;
    opacity: 0.95;
    transform: scale(1.025);
    cursor: pointer;
  }
`;

const HintText = styled.p`
  color: #bdbdbd;
  font-size: 15px;
  font-weight: 400;
  margin-top: 14px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
`;

export function CommentsForm({ disabled, onCommentSubmitted }) {
  const [value, setValue] = useState("");

  if (disabled)
    return (
      <>
        <HintText>You need to be signed in to comment</HintText>
        <SignInButton onClick={() => signIn("credentials")}>
          Sign in
        </SignInButton>
      </>
    );

  return (
    <>
      <HintText style={{ marginBottom: 0 }}>
        Leave a comment on this post
      </HintText>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          onCommentSubmitted(value);
          setValue("");
        }}
      >
        <CommentTextarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <CommentsPostButton>Post</CommentsPostButton>
      </Form>
    </>
  );
}
