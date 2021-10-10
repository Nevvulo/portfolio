import styled from "styled-components";
import { PostImg } from "./post-img";

const PostHeroImgContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 300px;
`;

export function PostHeroImg(props: any) {
  return (
    <PostHeroImgContainer>
      <PostImg style={{ maxHeight: "300px" }} {...props} />
    </PostHeroImgContainer>
  );
}
