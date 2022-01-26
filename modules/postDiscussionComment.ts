import { graphql } from "@octokit/graphql";
import { GetDiscussionCommentsResponseNode } from "./getDiscussionComments";

export type PostDiscussionCommentResponseNode = {
  discussion: {
    id: string;
  };
  publishedAt: string;
  body: string;
  author: {
    login: string;
    avatarUrl: string;
  };
};
interface PostDiscussionCommentResponse {
  addDiscussionComment: { comment: PostDiscussionCommentResponseNode };
}
export default async function postDiscussionComment(
  discussionId: string,
  content: string,
  token: string
) {
  const data = await graphql<PostDiscussionCommentResponse>(
    `
      mutation {
        addDiscussionComment(input: { discussionId: "${discussionId}", body: "${content}" }) {
          comment {
            discussion {
              id
            }
            body
            publishedAt
            author {
              login
              avatarUrl
            }
          }
        }
      }
    `,
    {
      headers: {
        authorization: `token ${token}`,
      },
    }
  );

  const { comment } = data.addDiscussionComment;
  return comment;
}
