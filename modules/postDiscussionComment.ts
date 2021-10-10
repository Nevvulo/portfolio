import { graphql, withCustomRequest } from "@octokit/graphql";

export default async function postDiscussionComment(
  discussionId: string,
  content: string,
  token: string
) {
  const data = await graphql(
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
  const comment = (data as any).addDiscussionComment.comment;
  return comment;
}
